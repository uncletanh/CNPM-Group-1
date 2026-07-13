from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse, WorkspacePromptUpdate

import os
import shutil
import tempfile
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
router = APIRouter()

@router.get("/", response_model=list[WorkspaceResponse])
def read_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Lấy danh sách workspace thuộc sở hữu của user hiện tại
    return db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()

@router.post("/", response_model=WorkspaceResponse)
def create_workspace(workspace_in: WorkspaceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_workspace = Workspace(
        name=workspace_in.name,
        owner_id=current_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    return new_workspace

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không gian làm việc không tồn tại hoặc bạn không có quyền xóa."
        )
    db.delete(workspace)
    db.commit()
    return None

@router.put("/{workspace_id}/prompt", response_model=WorkspaceResponse)
def update_workspace_prompt(workspace_id: int, prompt_in: WorkspacePromptUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace không tồn tại.")
    
    workspace.system_prompt = prompt_in.system_prompt
    db.commit()
    db.refresh(workspace)
    return workspace

@router.post("/{workspace_id}/knowledge", status_code=200)
async def upload_knowledge(workspace_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace không tồn tại.")
    
    # Save file temp
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".txt", ".pdf"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file TXT hoặc PDF")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name

    try:
        if file_ext == ".pdf":
            loader = PyPDFLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path, encoding="utf-8")
        
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        
        # Add metadata
        for chunk in chunks:
            chunk.metadata["workspace_id"] = workspace_id
        
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        # Save to local Chroma
        vector_store = Chroma(
            collection_name=f"workspace_{workspace_id}",
            embedding_function=embeddings,
            persist_directory="./chroma_db"
        )
        vector_store.add_documents(chunks)
        
        return {"detail": "Tải tài liệu lên và tạo Knowledge Base thành công.", "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)

