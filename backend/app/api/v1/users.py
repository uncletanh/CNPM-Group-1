from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import security
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import PasswordChange, UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me/password", response_model=UserResponse)
def change_password(
    password_in: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not security.verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác.",
        )
    current_user.hashed_password = security.get_password_hash(password_in.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/", response_model=list[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Yeu cau dang nhap de tranh lo danh sach email cho nguoi la.
    return db.query(User).offset(skip).limit(limit).all()
