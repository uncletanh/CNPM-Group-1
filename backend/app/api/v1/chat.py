import json
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from langchain_chroma import Chroma
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.workspaces import get_embedding_model, get_owned_workspace
from app.core import security
from app.db.chroma import CHROMA_DATA_DIR, CHROMA_SETTINGS
from app.db.session import get_db
from app.models.chat import (
    STATUS_BOT_HANDLING,
    STATUS_HUMAN_HANDLING,
    STATUS_RESOLVED,
    ChatSession,
    Message,
)
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.chat import (
    AgentReplyRequest,
    ChatRequest,
    ChatResponse,
    ChatSessionResponse,
    ChatSource,
    MessageResponse,
    PollResponse,
    WorkspaceStats,
)
from app.services.llm import LLMProviderError, get_llm_provider

router = APIRouter()

# Widget nhung tren web khach hang goi endpoint nay khi chua dang nhap, nen
# khong the bat buoc JWT admin. Chap nhan MOT trong hai: JWT cua chu workspace
# (dung khi test trong dashboard), hoac widget_token cong khai gan voi workspace.
optional_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

NO_CONTEXT_ANSWER = (
    "Tôi không có thông tin này trong tài liệu được cung cấp. "
    "Bạn có muốn gặp nhân viên hỗ trợ không?"
)

# Khi nhan vien da tiep quan, tin nhan cua khach van duoc luu nhung bot khong tra loi.
HUMAN_HANDLING_ACK = (
    "Yêu cầu của bạn đã được chuyển tới nhân viên hỗ trợ. "
    "Vui lòng chờ trong giây lát."
)


def get_workspace_or_404(workspace_id: int, db: Session) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace không tồn tại.",
        )
    return workspace


def build_rag_prompt(question: str, context: str) -> str:
    return (
        "Hãy trả lời câu hỏi của khách hàng chỉ dựa trên phần <context>. "
        "Nếu <context> không có thông tin phù hợp, hãy nói rằng bạn không có thông tin "
        "và đề nghị khách hàng gặp nhân viên hỗ trợ.\n\n"
        f"<context>\n{context}\n</context>\n\n"
        f"Câu hỏi: {question}"
    )


def check_origin_allowed(workspace: Workspace, origin: str | None) -> None:
    if not workspace.allowed_origin:
        return
    normalized_allowed = workspace.allowed_origin.rstrip("/").lower()
    normalized_origin = (origin or "").rstrip("/").lower()
    if normalized_origin != normalized_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Widget không được phép gọi từ domain này.",
        )


def verify_chat_access(
    workspace: Workspace,
    db: Session,
    bearer_token: str | None,
    widget_token: str | None,
    origin: str | None,
) -> None:
    if widget_token and widget_token == workspace.widget_token:
        check_origin_allowed(workspace, origin)
        return

    if bearer_token:
        try:
            payload = jwt.decode(
                bearer_token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
            )
            user_id = int(payload.get("sub"))
            if user_id == workspace.owner_id:
                return
        except (JWTError, TypeError, ValueError):
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Khong co quyen truy cap workspace nay.",
    )


def get_or_create_session(db: Session, workspace_id: int, session_key: str | None) -> ChatSession:
    if session_key:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.workspace_id == workspace_id, ChatSession.session_key == session_key)
            .first()
        )
        if session:
            return session

    session = ChatSession(workspace_id=workspace_id)
    if session_key:
        session.session_key = session_key
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def save_message(db: Session, session: ChatSession, sender: str, content: str) -> Message:
    message = Message(session_id=session.id, sender=sender, content=content)
    db.add(message)
    # Cham vao session de updated_at nhay len -> Omnibox sap xep theo hoat dong moi nhat.
    session.updated_at = datetime.utcnow()
    db.add(session)
    db.commit()
    db.refresh(message)
    return message


def get_workspace_vector_store(workspace_id: int) -> Chroma:
    return Chroma(
        collection_name=f"workspace_{workspace_id}_knowledge",
        embedding_function=get_embedding_model(),
        persist_directory=CHROMA_DATA_DIR,
        client_settings=CHROMA_SETTINGS,
    )


def retrieve_context(workspace_id: int, message: str, top_k: int):
    try:
        vector_store = get_workspace_vector_store(workspace_id)
        retrieved = vector_store.similarity_search_with_score(message, k=top_k)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không thể truy vấn ChromaDB: {exc}")

    return [
        (document, float(distance) if distance is not None else None)
        for document, distance in retrieved
        if document.page_content.strip()
    ]


def source_from_document(document, distance: float | None) -> ChatSource:
    metadata = document.metadata or {}
    preview = " ".join(document.page_content.split())[:240]
    return ChatSource(
        source_filename=metadata.get("source_filename") or metadata.get("source"),
        chunk_index=metadata.get("chunk_index"),
        distance=distance,
        preview=preview,
    )


@router.post("/{workspace_id}", response_model=ChatResponse)
def chat_with_workspace(
    workspace_id: int,
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
    bearer_token: str | None = Depends(optional_oauth2),
    x_widget_token: str | None = Header(default=None, alias="X-Widget-Token"),
    origin: str | None = Header(default=None, alias="Origin"),
):
    workspace = get_workspace_or_404(workspace_id, db)
    verify_chat_access(workspace, db, bearer_token, x_widget_token, origin)
    message = chat_in.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống.")

    session = get_or_create_session(db, workspace_id, chat_in.session_key)
    # Khach nhan lai vao phien da dong -> mo lai cho bot phu trach.
    if session.status == STATUS_RESOLVED:
        session.status = STATUS_BOT_HANDLING
    save_message(db, session, "user", message)

    # Nhan vien da tiep quan phien: bot ngung tra loi, chi luu tin nhan cua khach
    # va cho nhan vien phan hoi (khach se nhan phan hoi qua endpoint /poll).
    if session.status == STATUS_HUMAN_HANDLING:
        return ChatResponse(
            workspace_id=workspace_id,
            session_key=session.session_key,
            answer=HUMAN_HANDLING_ACK,
            context_chunks=0,
            sources=[],
        )

    retrieved = retrieve_context(workspace_id, message, chat_in.top_k)
    if not retrieved:
        save_message(db, session, "bot", NO_CONTEXT_ANSWER)
        return ChatResponse(
            workspace_id=workspace_id,
            session_key=session.session_key,
            answer=NO_CONTEXT_ANSWER,
            context_chunks=0,
            sources=[],
        )

    context = "\n\n".join(
        f"[Chunk {index + 1}]\n{document.page_content.strip()}"
        for index, (document, _) in enumerate(retrieved)
    )
    prompt = build_rag_prompt(message, context)

    try:
        answer = get_llm_provider().generate(
            system_prompt=workspace.system_prompt,
            user_prompt=prompt,
        )
    except LLMProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    save_message(db, session, "bot", answer)

    return ChatResponse(
        workspace_id=workspace_id,
        session_key=session.session_key,
        answer=answer,
        context_chunks=len(retrieved),
        sources=[
            source_from_document(document, distance)
            for document, distance in retrieved
        ],
    )


def sse_event(event: str | None, data) -> str:
    payload = f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
    if event:
        return f"event: {event}\n{payload}"
    return payload


@router.post("/{workspace_id}/stream")
def chat_with_workspace_stream(
    workspace_id: int,
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
    bearer_token: str | None = Depends(optional_oauth2),
    x_widget_token: str | None = Header(default=None, alias="X-Widget-Token"),
    origin: str | None = Header(default=None, alias="Origin"),
):
    workspace = get_workspace_or_404(workspace_id, db)
    verify_chat_access(workspace, db, bearer_token, x_widget_token, origin)
    message = chat_in.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống.")

    session = get_or_create_session(db, workspace_id, chat_in.session_key)
    # Khach nhan lai vao phien da dong -> mo lai cho bot phu trach.
    if session.status == STATUS_RESOLVED:
        session.status = STATUS_BOT_HANDLING
    save_message(db, session, "user", message)

    is_human_handling = session.status == STATUS_HUMAN_HANDLING
    # Chi truy van ChromaDB khi bot con phu trach (tiet kiem khi da co nhan vien).
    retrieved = [] if is_human_handling else retrieve_context(workspace_id, message, chat_in.top_k)

    def event_stream():
        yield sse_event("session", session.session_key)

        if is_human_handling:
            # Bot khong tra loi; khach cho nhan vien phan hoi qua /poll.
            yield sse_event("human", HUMAN_HANDLING_ACK)
            yield sse_event("done", {"handled_by": "human"})
            return

        if not retrieved:
            save_message(db, session, "bot", NO_CONTEXT_ANSWER)
            yield sse_event("chunk", NO_CONTEXT_ANSWER)
            yield sse_event("done", {"context_chunks": 0})
            return

        context = "\n\n".join(
            f"[Chunk {index + 1}]\n{document.page_content.strip()}"
            for index, (document, _) in enumerate(retrieved)
        )
        prompt = build_rag_prompt(message, context)

        full_answer_parts: list[str] = []
        try:
            for piece in get_llm_provider().generate_stream(
                system_prompt=workspace.system_prompt,
                user_prompt=prompt,
            ):
                full_answer_parts.append(piece)
                yield sse_event("chunk", piece)
        except LLMProviderError as exc:
            yield sse_event("error", str(exc))
            return

        save_message(db, session, "bot", "".join(full_answer_parts))
        yield sse_event("done", {"context_chunks": len(retrieved)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/{workspace_id}/stats", response_model=WorkspaceStats)
def workspace_stats(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)

    status_rows = (
        db.query(ChatSession.status, func.count(ChatSession.id))
        .filter(ChatSession.workspace_id == workspace_id)
        .group_by(ChatSession.status)
        .all()
    )
    sender_rows = (
        db.query(Message.sender, func.count(Message.id))
        .join(ChatSession, Message.session_id == ChatSession.id)
        .filter(ChatSession.workspace_id == workspace_id)
        .group_by(Message.sender)
        .all()
    )
    sessions_by_status = {row[0]: row[1] for row in status_rows}
    messages_by_sender = {row[0]: row[1] for row in sender_rows}
    return WorkspaceStats(
        total_sessions=sum(sessions_by_status.values()),
        sessions_by_status=sessions_by_status,
        total_messages=sum(messages_by_sender.values()),
        messages_by_sender=messages_by_sender,
    )


@router.get("/{workspace_id}/sessions", response_model=list[ChatSessionResponse])
def list_chat_sessions(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    return (
        db.query(ChatSession)
        .filter(ChatSession.workspace_id == workspace_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


@router.get("/{workspace_id}/sessions/{session_id}/messages", response_model=list[MessageResponse])
def list_session_messages(
    workspace_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    session = get_owned_session(db, workspace_id, session_id)
    return session.messages


def get_owned_session(db: Session, workspace_id: int, session_id: int) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.workspace_id == workspace_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy hội thoại.")
    return session


# ------------------------------------------------------------------
# Human-in-the-loop: nhan vien tiep quan / phan hoi / dong phien (admin)
# ------------------------------------------------------------------


@router.post("/{workspace_id}/sessions/{session_id}/takeover", response_model=ChatSessionResponse)
def takeover_session(
    workspace_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    session = get_owned_session(db, workspace_id, session_id)
    session.status = STATUS_HUMAN_HANDLING
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.post("/{workspace_id}/sessions/{session_id}/resolve", response_model=ChatSessionResponse)
def resolve_session(
    workspace_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    session = get_owned_session(db, workspace_id, session_id)
    # Dong phien va tra quyen ve cho bot cho cac tin nhan sau nay.
    session.status = STATUS_RESOLVED
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.post("/{workspace_id}/sessions/{session_id}/reply", response_model=MessageResponse)
def agent_reply(
    workspace_id: int,
    session_id: int,
    reply_in: AgentReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    session = get_owned_session(db, workspace_id, session_id)
    content = reply_in.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Nội dung không được để trống.")

    # Neu nhan vien tra loi khi phien chua o trang thai human -> tu dong tiep quan.
    if session.status != STATUS_HUMAN_HANDLING:
        session.status = STATUS_HUMAN_HANDLING

    return save_message(db, session, "agent", content)


# ------------------------------------------------------------------
# Widget (public, dung widget_token): lay lich su & hoi tin nhan moi
# ------------------------------------------------------------------


def get_session_by_key(db: Session, workspace_id: int, session_key: str) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.workspace_id == workspace_id, ChatSession.session_key == session_key)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy hội thoại.")
    return session


@router.get("/{workspace_id}/history", response_model=list[MessageResponse])
def widget_history(
    workspace_id: int,
    session_key: str = Query(..., max_length=64),
    db: Session = Depends(get_db),
    bearer_token: str | None = Depends(optional_oauth2),
    x_widget_token: str | None = Header(default=None, alias="X-Widget-Token"),
    origin: str | None = Header(default=None, alias="Origin"),
):
    workspace = get_workspace_or_404(workspace_id, db)
    verify_chat_access(workspace, db, bearer_token, x_widget_token, origin)
    session = get_session_by_key(db, workspace_id, session_key)
    return session.messages


@router.get("/{workspace_id}/poll", response_model=PollResponse)
def widget_poll(
    workspace_id: int,
    session_key: str = Query(..., max_length=64),
    after: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    bearer_token: str | None = Depends(optional_oauth2),
    x_widget_token: str | None = Header(default=None, alias="X-Widget-Token"),
    origin: str | None = Header(default=None, alias="Origin"),
):
    workspace = get_workspace_or_404(workspace_id, db)
    verify_chat_access(workspace, db, bearer_token, x_widget_token, origin)
    session = get_session_by_key(db, workspace_id, session_key)

    # Chi tra ve tin nhan cua nhan vien (agent) moi hon con tro `after`.
    # Tin nhan user/bot da duoc widget hien thi cuc bo (khi gui / khi stream) nen bo qua,
    # tranh trung lap ma khong can dedup phuc tap.
    new_agent_messages = [
        message
        for message in session.messages
        if message.sender == "agent" and message.id > after
    ]
    return PollResponse(status=session.status, messages=new_agent_messages)
