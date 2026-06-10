from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # TODO: Implement logic truy vấn DB bằng SQLAlchemy
    # return db.query(models.User).offset(skip).limit(limit).all()
    return []

# TODO: Thêm các API đăng ký, đăng nhập ở đây
