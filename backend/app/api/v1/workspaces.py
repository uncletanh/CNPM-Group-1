import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.chroma import CHROMA_DATA_DIR, CHROMA_SETTINGS, get_workspace_collection
from app.db.session import get_db
from app.models.user import User
from app.models.workspace import DEFAULT_SYSTEM_PROMPT, Workspace
from app.schemas.workspace import (
    KnowledgeDocumentResponse,
    KnowledgeSummaryResponse,
    KnowledgeUploadResponse,
    WorkspaceCreate,
    WorkspaceOriginUpdate,
    WorkspacePromptUpdate,
    WorkspaceResponse,
)

router = APIRouter()

ALLOWED_KNOWLEDGE_EXTENSIONS = {".pdf", ".txt"}
MAX_KNOWLEDGE_FILE_SIZE = 50 * 1024 * 1024
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embedding_model


def get_owned_workspace(
    workspace_id: int,
    db: Session,
    current_user: User,
) -> Workspace:
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace khong ton tai hoac ban khong co quyen truy cap.",
        )
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


@router.get("/", response_model=list[WorkspaceResponse])
def read_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()


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


@router.post("/{workspace_id}/knowledge", response_model=KnowledgeUploadResponse)
async def upload_knowledge(
    workspace_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)

    filename = Path(file.filename or "").name
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_KNOWLEDGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Chi ho tro file TXT hoac PDF.")

    tmp_path, file_size = save_upload_to_temp_file(file, file_ext)
    try:
        if file_ext == ".pdf":
            loader = PyPDFLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path, encoding="utf-8")

        documents = loader.load()
        if not documents:
            raise HTTPException(status_code=400, detail="Khong doc duoc noi dung tu file.")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )
        chunks = text_splitter.split_documents(documents)
        chunks = [chunk for chunk in chunks if chunk.page_content.strip()]
        if not chunks:
            raise HTTPException(status_code=400, detail="File khong co noi dung van ban hop le.")

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

        collection_name = f"workspace_{workspace_id}_knowledge"
        vector_store = Chroma(
            collection_name=collection_name,
            embedding_function=get_embedding_model(),
            persist_directory=CHROMA_DATA_DIR,
            client_settings=CHROMA_SETTINGS,
        )
        vector_store.add_documents(chunks)

        return KnowledgeUploadResponse(
            detail="Tai tai lieu len va nap tri thuc thanh cong.",
            filename=filename,
            file_size=file_size,
            chunks=len(chunks),
            collection_name=collection_name,
        )
    except HTTPException:
        raise
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File TXT phai duoc ma hoa UTF-8.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Khong the nap tri thuc: {exc}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        await file.close()


@router.get("/{workspace_id}/knowledge", response_model=KnowledgeSummaryResponse)
def list_knowledge_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_workspace(workspace_id, db, current_user)
    return get_knowledge_summary(workspace_id)


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
