import os
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "default-fallback-secret-key-for-development")
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
