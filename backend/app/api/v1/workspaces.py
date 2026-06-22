from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

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
