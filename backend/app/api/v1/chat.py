from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from langchain_chroma import Chroma
from sqlalchemy.orm import Session

from app.api.v1.workspaces import get_embedding_model
from app.db.chroma import CHROMA_DATA_DIR, CHROMA_SETTINGS
from app.db.session import get_db
from app.models.workspace import Workspace
from app.schemas.chat import ChatRequest, ChatResponse, ChatSource
from app.services.llm import LLMProviderError, get_llm_provider

router = APIRouter()

NO_CONTEXT_ANSWER = (
    "Tôi không có thông tin này trong tài liệu được cung cấp. "
    "Bạn có muốn gặp nhân viên hỗ trợ không?"
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


def get_workspace_vector_store(workspace_id: int) -> Chroma:
    return Chroma(
        collection_name=f"workspace_{workspace_id}_knowledge",
        embedding_function=get_embedding_model(),
        persist_directory=CHROMA_DATA_DIR,
        client_settings=CHROMA_SETTINGS,
    )


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
):
    workspace = get_workspace_or_404(workspace_id, db)
    message = chat_in.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống.")

    try:
        vector_store = get_workspace_vector_store(workspace_id)
        retrieved = vector_store.similarity_search_with_score(message, k=chat_in.top_k)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không thể truy vấn ChromaDB: {exc}")

    retrieved = [
        (document, float(distance) if distance is not None else None)
        for document, distance in retrieved
        if document.page_content.strip()
    ]
    if not retrieved:
        return ChatResponse(
            workspace_id=workspace_id,
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

    return ChatResponse(
        workspace_id=workspace_id,
        answer=answer,
        context_chunks=len(retrieved),
        sources=[
            source_from_document(document, distance)
            for document, distance in retrieved
        ],
    )


def _format_sse_event(data: str, event: str | None = None) -> str:
    lines = []
    if event:
        lines.append(f"event: {event}")
    for chunk_line in data.splitlines() or [""]:
        lines.append(f"data: {chunk_line}")
    return "\n".join(lines) + "\n\n"


def _stream_chat_response(
    workspace_id: int,
    message: str,
    top_k: int,
    db: Session,
):
    workspace = get_workspace_or_404(workspace_id, db)

    try:
        vector_store = get_workspace_vector_store(workspace_id)
        retrieved = vector_store.similarity_search_with_score(message, k=top_k)
    except Exception as exc:
        yield _format_sse_event(
            f"Không thể truy vấn ChromaDB: {exc}",
            event="error",
        )
        return

    retrieved = [
        (document, float(distance) if distance is not None else None)
        for document, distance in retrieved
        if document.page_content.strip()
    ]
    if not retrieved:
        yield _format_sse_event(NO_CONTEXT_ANSWER, event="chunk")
        yield _format_sse_event("done", event="done")
        return

    context = "\n\n".join(
        f"[Chunk {index + 1}]\n{document.page_content.strip()}"
        for index, (document, _) in enumerate(retrieved)
    )
    prompt = build_rag_prompt(message, context)

    try:
        llm_stream = get_llm_provider().generate_stream(
            system_prompt=workspace.system_prompt,
            user_prompt=prompt,
        )
    except LLMProviderError as exc:
        yield _format_sse_event(str(exc), event="error")
        return

    try:
        for chunk in llm_stream:
            yield _format_sse_event(chunk, event="chunk")
        yield _format_sse_event("done", event="done")
    except LLMProviderError as exc:
        yield _format_sse_event(str(exc), event="error")


@router.post("/{workspace_id}/stream")
def chat_with_workspace_stream(
    workspace_id: int,
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
):
    message = chat_in.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống.")

    return StreamingResponse(
        _stream_chat_response(workspace_id, message, chat_in.top_k, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/{workspace_id}/stream")
def chat_with_workspace_stream_get(
    workspace_id: int,
    message: str = Query(..., min_length=1, max_length=2000),
    top_k: int = Query(3, ge=1, le=5),
    db: Session = Depends(get_db),
):
    return StreamingResponse(
        _stream_chat_response(workspace_id, message.strip(), top_k, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )
