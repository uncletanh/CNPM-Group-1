import os
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.core import security

router = APIRouter()

try:
    from authlib.integrations.starlette_client import OAuth
except ImportError:
    OAuth = None  # type: ignore[assignment,misc]

oauth = OAuth() if OAuth is not None else None
if oauth is not None and os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"):
    oauth.register(
        name="google",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Kiểm tra xem user đã tồn tại chưa
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được đăng ký sử dụng."
        )
    
    # Tạo user mới
    new_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        role="agent"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    # Tìm user theo email
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản hoặc mật khẩu không chính xác."
        )
    
    # Tạo JWT Token
    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/google/login")
async def google_login(request: Request):
    google = oauth.create_client("google") if oauth is not None else None
    if google is None:
        raise HTTPException(status_code=503, detail="Google SSO chưa được cấu hình.")
    redirect_uri = request.url_for("google_callback")
    return await google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    google = oauth.create_client("google") if oauth is not None else None
    if google is None:
        raise HTTPException(status_code=503, detail="Google SSO chưa được cấu hình.")
    try:
        token = await google.authorize_access_token(request)
        user_info = token.get("userinfo") or await google.userinfo(token=token)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Không thể xác thực với Google.") from exc

    email = str(user_info.get("email", "")).lower()
    if not email or not user_info.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Google chưa xác minh địa chỉ email này.")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=security.get_password_hash(uuid.uuid4().hex),
            role="agent",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = security.create_access_token(subject=user.id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    query = urlencode({"token": access_token, "email": user.email})
    return RedirectResponse(f"{frontend_url}/login?{query}")
