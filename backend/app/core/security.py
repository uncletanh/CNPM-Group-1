import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


def _resolve_secret_key() -> str:
    configured = os.getenv("SECRET_KEY")
    if configured:
        return configured
    if ENVIRONMENT == "production":
        # Khong duoc fallback am tham tren production: truoc day co mot chuoi co dinh
        # trong code lam gia tri du phong, nghia la ai doc duoc repo (ma nguon mo) cung
        # ky duoc JWT hop le cho bat ky user_id, ke ca admin, ma khong can mat khau -
        # neu vi ly do gi SECRET_KEY chua duoc cau hinh. render.yaml da co
        # "generateValue: true" cho SECRET_KEY nen truong hop nay khong nen xay ra thuc
        # te, nhung fail loudly ngay luc khoi dong van an toan hon fallback im lang.
        raise RuntimeError(
            "SECRET_KEY chua duoc cau hinh tren moi truong production (ENVIRONMENT="
            "production). Dat bien moi truong SECRET_KEY truoc khi khoi dong - "
            "khong dung gia tri mac dinh trong code."
        )
    # Local dev/CI/test: sinh ngau nhien rieng cho moi lan khoi dong process (khong
    # phai mot chuoi co dinh nam san trong code) - token cu se het hieu luc sau moi
    # lan restart, chap nhan duoc o dev/test vi khong anh huong den du lieu nghiep vu.
    return secrets.token_hex(32)


SECRET_KEY = _resolve_secret_key()
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Hash gia dung khi khong tim thay user, de van chay du 1 lan bcrypt.checkpw (cham) -
# tranh lo qua timing side-channel (email khong ton tai tra loi nhanh hon email ton tai
# nhung sai mat khau, vi thieu buoc bcrypt).
_DUMMY_HASH = get_password_hash("dummy-password-for-constant-time-check")

def verify_login_password(user: Any, password: str) -> bool:
    hashed_password = user.hashed_password if user is not None else _DUMMY_HASH
    return verify_password(password, hashed_password) and user is not None

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
