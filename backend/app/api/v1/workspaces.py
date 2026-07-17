import logging
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.chroma import (
    CHROMA_DATA_DIR,
    CHROMA_SETTINGS,
    get_chroma_client,
    get_knowledge_collection_name,
    get_workspace_collection,
)
from app.db.session import get_db
from app.models.chat import ChatSession, Message
from app.models.user import User
from app.models.workspace import (
    DEFAULT_SYSTEM_PROMPT,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMember,
)
from app.schemas.workspace import (
    KnowledgeDocumentResponse,
    KnowledgePreviewChunk,
    KnowledgePreviewResponse,
    KnowledgeSummaryResponse,
    KnowledgeTextUpsert,
    KnowledgeUploadResponse,
    WorkspaceCreate,
    WorkspaceInvitationCreate,
    WorkspaceInvitationResponse,
    WorkspaceMemberResponse,
    WorkspaceOriginUpdate,
    WorkspacePromptUpdate,
    WorkspaceResponse,
    WidgetSettingsResponse,
    WidgetSettingsUpdate,
)
from app.services.embeddings import get_embedding_model

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_KNOWLEDGE_EXTENSIONS = {".pdf", ".txt", ".docx"}
MAX_KNOWLEDGE_FILE_SIZE = 50 * 1024 * 1024
CHUNK_SIZE = 600
CHUNK_OVERLAP = 100

def get_owned_workspace(
    workspace_id: int,
    db: Session,
    current_user: User,
) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace không tồn tại hoặc bạn không có quyền truy cập.",
        )
    if workspace.owner_id == current_user.id:
        return workspace
    membership = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.role == "admin",
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Thao tác này yêu cầu quyền Admin workspace.")
    return workspace


def get_workspace_access(
    workspace_id: int,
    db: Session,
    current_user: User,
) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace không tồn tại.")
    if workspace.owner_id == current_user.id:
        return workspace
    membership = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Bạn không phải thành viên workspace này.")
    return workspace


def save_upload_to_temp_file(file: UploadFile, file_ext: str) -> tuple[str, int]:
    total_size = 0
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        tmp_path = tmp_file.name
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_KNOWLEDGE_FILE_SIZE:
                tmp_file.close()
                os.remove(tmp_path)
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="File vuot qua gioi han 50MB.",
                )
            tmp_file.write(chunk)

    if total_size == 0:
        os.remove(tmp_path)
        raise HTTPException(status_code=400, detail="File tai len dang rong.")

    return tmp_path, total_size


def get_knowledge_summary(workspace_id: int) -> KnowledgeSummaryResponse:
    collection = get_workspace_collection(str(workspace_id))
    result = collection.get(include=["metadatas"])
    grouped: dict[str, dict] = {}

    for metadata in result.get("metadatas") or []:
        metadata = metadata or {}
        filename = str(
            metadata.get("source_filename")
            or metadata.get("source")
            or "Tài liệu không xác định"
        )
        document = grouped.setdefault(
            filename,
            {
                "filename": filename,
                "file_size": metadata.get("file_size"),
                "chunks": 0,
                "uploaded_at": metadata.get("uploaded_at"),
                "file_type": metadata.get("file_type"),
            },
        )
        document["chunks"] += 1
        document["file_size"] = document["file_size"] or metadata.get("file_size")
        document["uploaded_at"] = document["uploaded_at"] or metadata.get("uploaded_at")
        document["file_type"] = document["file_type"] or metadata.get("file_type")

    documents = [KnowledgeDocumentResponse(**document) for document in grouped.values()]
    documents.sort(key=lambda document: (document.uploaded_at or "", document.filename), reverse=True)
    return KnowledgeSummaryResponse(
        total_documents=len(documents),
        total_chunks=sum(document.chunks for document in documents),
        documents=documents,
    )


def get_knowledge_preview(workspace_id: int, filename: str) -> KnowledgePreviewResponse:
    collection = get_workspace_collection(str(workspace_id))
    result = collection.get(
        where={"source_filename": filename},
        include=["documents", "metadatas"],
    )
    documents = result.get("documents") or []
    metadatas = result.get("metadatas") or []
    chunks = []

    for position, content in enumerate(documents):
        metadata = metadatas[position] or {} if position < len(metadatas) else {}
        chunks.append(
            KnowledgePreviewChunk(
                chunk_index=int(metadata.get("chunk_index", position)),
                page=(int(metadata["page"]) + 1 if metadata.get("page") is not None else None),
                content=str(content or "").strip(),
            )
        )

    chunks = [chunk for chunk in chunks if chunk.content]
    chunks.sort(key=lambda chunk: chunk.chunk_index)
    if not chunks:
        raise HTTPException(status_code=404, detail="Không tìm thấy nội dung xem trước của tài liệu.")

    return KnowledgePreviewResponse(
        filename=filename,
        total_chunks=len(chunks),
        chunks=chunks,
    )


def replace_knowledge_documents(
    workspace_id: int,
    filename: str,
    documents: list,
    file_size: int,
    file_ext: str,
) -> tuple[int, str]:
    from langchain_chroma import Chroma
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = [
        chunk
        for chunk in text_splitter.split_documents(documents)
        if chunk.page_content.strip()
    ]
    if not chunks:
        raise HTTPException(status_code=400, detail="Tài liệu không có nội dung văn bản hợp lệ.")

    uploaded_at = datetime.now(timezone.utc).isoformat()
    for index, chunk in enumerate(chunks):
        chunk.metadata.update(
            {
                "workspace_id": str(workspace_id),
                "source_filename": filename,
                "chunk_index": index,
                "file_size": file_size,
                "file_type": file_ext.lstrip("."),
                "uploaded_at": uploaded_at,
            }
        )

    collection_name = get_knowledge_collection_name(workspace_id)
    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=get_embedding_model(),
        persist_directory=CHROMA_DATA_DIR,
        client_settings=CHROMA_SETTINGS,
    )
    existing = vector_store.get(where={"source_filename": filename}, include=[])
    existing_ids = existing.get("ids") or []
    if existing_ids:
        vector_store.delete(ids=existing_ids)
    vector_store.add_documents(chunks)
    return len(chunks), collection_name


@router.get("/", response_model=list[WorkspaceResponse])
def read_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Workspace)
        .outerjoin(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(
            or_(
                Workspace.owner_id == current_user.id,
                WorkspaceMember.user_id == current_user.id,
            )
        )
        .distinct()
        .all()
    )


@router.post("/", response_model=WorkspaceResponse)
def create_workspace(
    workspace_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_workspace = Workspace(
        name=workspace_in.name.strip(),
        system_prompt=DEFAULT_SYSTEM_PROMPT,
        owner_id=current_user.id,
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    return new_workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    collection_prefix = f"workspace_{workspace_id}_knowledge"
    for collection in get_chroma_client().list_collections():
        collection_name = getattr(collection, "name", str(collection))
        if collection_name.startswith(collection_prefix):
            get_chroma_client().delete_collection(collection_name)
    session_ids = [
        row[0]
        for row in db.query(ChatSession.id)
        .filter(ChatSession.workspace_id == workspace_id)
        .all()
    ]
    if session_ids:
        db.query(Message).filter(Message.session_id.in_(session_ids)).delete(
            synchronize_session=False
        )
        db.query(ChatSession).filter(ChatSession.id.in_(session_ids)).delete(
            synchronize_session=False
        )
    db.query(WorkspaceInvitation).filter(
        WorkspaceInvitation.workspace_id == workspace_id
    ).delete(synchronize_session=False)
    db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).delete(synchronize_session=False)
    db.delete(workspace)
    db.commit()
    return None


@router.put("/{workspace_id}/prompt", response_model=WorkspaceResponse)
def update_workspace_prompt(
    workspace_id: int,
    prompt_in: WorkspacePromptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    workspace.system_prompt = prompt_in.system_prompt.strip()
    db.commit()
    db.refresh(workspace)
    return workspace


@router.put("/{workspace_id}/widget-domain", response_model=WorkspaceResponse)
def update_widget_allowed_origin(
    workspace_id: int,
    origin_in: WorkspaceOriginUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    workspace.allowed_origin = origin_in.allowed_origin.strip() if origin_in.allowed_origin else None
    db.commit()
    db.refresh(workspace)
    return workspace


@router.put("/{workspace_id}/widget-settings", response_model=WidgetSettingsResponse)
def update_widget_settings(
    workspace_id: int,
    settings_in: WidgetSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    workspace.widget_primary_color = settings_in.primary_color.lower()
    workspace.bot_name = settings_in.bot_name.strip()
    workspace.bot_greeting = settings_in.greeting.strip()
    workspace.bot_avatar_url = settings_in.avatar_url.strip() if settings_in.avatar_url else None
    workspace.widget_position = settings_in.position
    db.commit()
    db.refresh(workspace)
    return WidgetSettingsResponse(
        primary_color=workspace.widget_primary_color,
        bot_name=workspace.bot_name,
        greeting=workspace.bot_greeting,
        avatar_url=workspace.bot_avatar_url,
        position=workspace.widget_position,
    )


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
def list_workspace_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    owner = db.query(User).filter(User.id == workspace.owner_id).first()
    result = []
    if owner:
        result.append(
            WorkspaceMemberResponse(
                user_id=owner.id, email=owner.email, role="admin", is_owner=True
            )
        )
    memberships = (
        db.query(WorkspaceMember, User)
        .join(User, User.id == WorkspaceMember.user_id)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .all()
    )
    result.extend(
        WorkspaceMemberResponse(
            user_id=user.id,
            email=user.email,
            role=membership.role,
            is_owner=False,
        )
        for membership, user in memberships
    )
    return result


@router.post(
    "/{workspace_id}/invitations",
    response_model=WorkspaceInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_workspace_member(
    workspace_id: int,
    invitation_in: WorkspaceInvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    email = invitation_in.email.lower()
    if workspace.owner and workspace.owner.email.lower() == email:
        raise HTTPException(status_code=409, detail="Email này là chủ sở hữu workspace.")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        membership = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == existing_user.id,
            )
            .first()
        )
        if membership:
            raise HTTPException(status_code=409, detail="Người dùng đã là thành viên workspace.")

    db.query(WorkspaceInvitation).filter(
        WorkspaceInvitation.workspace_id == workspace_id,
        WorkspaceInvitation.email == email,
        WorkspaceInvitation.status == "pending",
    ).update({WorkspaceInvitation.status: "revoked"}, synchronize_session=False)
    invitation = WorkspaceInvitation(
        workspace_id=workspace_id,
        email=email,
        role=invitation_in.role,
        invited_by_id=current_user.id,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.get(
    "/{workspace_id}/invitations",
    response_model=list[WorkspaceInvitationResponse],
)
def list_workspace_invitations(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    return (
        db.query(WorkspaceInvitation)
        .filter(WorkspaceInvitation.workspace_id == workspace_id)
        .order_by(WorkspaceInvitation.created_at.desc())
        .all()
    )


@router.post("/invitations/{token}/accept", response_model=WorkspaceResponse)
def accept_workspace_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invitation = (
        db.query(WorkspaceInvitation)
        .filter(WorkspaceInvitation.token == token, WorkspaceInvitation.status == "pending")
        .first()
    )
    if not invitation or invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Lời mời không tồn tại hoặc đã hết hạn.")
    if invitation.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Lời mời không dành cho tài khoản này.")

    membership = WorkspaceMember(
        workspace_id=invitation.workspace_id,
        user_id=current_user.id,
        role=invitation.role,
    )
    db.add(membership)
    invitation.status = "accepted"
    db.commit()
    return db.query(Workspace).filter(Workspace.id == invitation.workspace_id).first()


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_workspace_member(
    workspace_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = get_owned_workspace(workspace_id, db, current_user)
    if user_id == workspace.owner_id:
        raise HTTPException(status_code=400, detail="Không thể xóa chủ sở hữu workspace.")
    membership = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên.")
    db.delete(membership)
    db.commit()
    return None


@router.post("/{workspace_id}/knowledge", response_model=KnowledgeUploadResponse)
async def upload_knowledge(
    workspace_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader

    get_owned_workspace(workspace_id, db, current_user)

    filename = Path(file.filename or "").name
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_KNOWLEDGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file TXT, PDF hoặc DOCX.")

    tmp_path, file_size = save_upload_to_temp_file(file, file_ext)
    try:
        if file_ext == ".pdf":
            loader = PyPDFLoader(tmp_path)
        elif file_ext == ".docx":
            loader = Docx2txtLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path, encoding="utf-8")

        documents = loader.load()
        if not documents:
            raise HTTPException(status_code=400, detail="Khong doc duoc noi dung tu file.")

        chunk_count, collection_name = replace_knowledge_documents(
            workspace_id, filename, documents, file_size, file_ext
        )

        return KnowledgeUploadResponse(
            detail="Tải tài liệu lên và nạp tri thức thành công.",
            filename=filename,
            file_size=file_size,
            chunks=chunk_count,
            collection_name=collection_name,
        )
    except HTTPException:
        raise
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File TXT phai duoc ma hoa UTF-8.")
    except Exception:
        logger.exception(
            "Knowledge ingestion failed workspace_id=%s filename=%s file_size=%s",
            workspace_id,
            filename,
            file_size,
        )
        raise HTTPException(
            status_code=503,
            detail="Dịch vụ tạo embedding tạm thời không khả dụng. Vui lòng thử lại sau.",
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        await file.close()


@router.post("/{workspace_id}/knowledge/text", response_model=KnowledgeUploadResponse)
def upsert_text_knowledge(
    workspace_id: int,
    text_in: KnowledgeTextUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from langchain_core.documents import Document

    get_owned_workspace(workspace_id, db, current_user)
    filename = Path(text_in.filename).name.strip()
    if not filename.lower().endswith(".txt"):
        filename = f"{filename}.txt"
    content = text_in.content.strip()
    chunk_count, collection_name = replace_knowledge_documents(
        workspace_id,
        filename,
        [Document(page_content=content)],
        len(content.encode("utf-8")),
        ".txt",
    )
    return KnowledgeUploadResponse(
        detail="Đã lưu và nạp tri thức văn bản.",
        filename=filename,
        file_size=len(content.encode("utf-8")),
        chunks=chunk_count,
        collection_name=collection_name,
    )


@router.get("/{workspace_id}/knowledge", response_model=KnowledgeSummaryResponse)
def list_knowledge_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    return get_knowledge_summary(workspace_id)


@router.get(
    "/{workspace_id}/knowledge/{filename}/preview",
    response_model=KnowledgePreviewResponse,
)
def preview_knowledge_document(
    workspace_id: int,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    decoded_filename = Path(unquote(filename)).name
    return get_knowledge_preview(workspace_id, decoded_filename)


@router.delete("/{workspace_id}/knowledge/{filename}", response_model=KnowledgeSummaryResponse)
def delete_knowledge_document(
    workspace_id: int,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    decoded_filename = Path(unquote(filename)).name
    collection = get_workspace_collection(str(workspace_id))
    matching = collection.get(where={"source_filename": decoded_filename}, include=[])
    ids = matching.get("ids") or []
    if not ids:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu trong kho tri thức.")
    collection.delete(ids=ids)
    return get_knowledge_summary(workspace_id)
