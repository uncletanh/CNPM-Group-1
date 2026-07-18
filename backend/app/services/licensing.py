import asyncio
import secrets
import string
import time
from collections import defaultdict, deque
from datetime import datetime

from fastapi import Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.license import STATUS_AVAILABLE, STATUS_USED, LicenseKey
from app.models.user import PLAN_PRO, User

_KEY_ALPHABET = string.ascii_uppercase + string.digits
_GROUP_LENGTH = 4
_GROUP_COUNT = 4


def generate_license_key() -> str:
    groups = [
        "".join(secrets.choice(_KEY_ALPHABET) for _ in range(_GROUP_LENGTH))
        for _ in range(_GROUP_COUNT)
    ]
    return "NOVA-" + "-".join(groups)


def create_license_keys(db: Session, count: int) -> list[LicenseKey]:
    created: list[LicenseKey] = []
    for _ in range(count):
        # Xac suat trung ma la khong dang ke (36^16 khong gian), nhung van
        # thu lai vai lan cho chac chan key thuc su unique trong DB.
        for _attempt in range(5):
            license_key = LicenseKey(key=generate_license_key())
            db.add(license_key)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                continue
            db.refresh(license_key)
            created.append(license_key)
            break
        else:
            raise RuntimeError("Không thể sinh License Key duy nhất sau nhiều lần thử.")
    return created


def verify_and_activate(db: Session, user: User, raw_key: str) -> LicenseKey:
    # Tuyet doi khong tu suy luan tinh hop le tu format chuoi key - chi doi
    # chieu voi ban ghi thuc te trong DB.
    license_key = db.query(LicenseKey).filter(LicenseKey.key == raw_key.strip()).first()
    if not license_key or license_key.status != STATUS_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License Key không hợp lệ hoặc đã được sử dụng.",
        )
    license_key.status = STATUS_USED
    license_key.used_by_user_id = user.id
    license_key.used_at = datetime.utcnow()
    user.plan = PLAN_PRO
    db.commit()
    db.refresh(license_key)
    db.refresh(user)
    return license_key


# --- Rate limiter chong brute-force cho endpoint verify/activate key ---
# Cua so truot 60s, toi da VERIFY_RATE_LIMIT_PER_MINUTE lan goi/user, doc lap
# voi rate limiter chung cua OperationsMiddleware (chi ap dung cho POST
# /api/v1/chat/*). Key theo user_id vi endpoint nay luon yeu cau dang nhap.
VERIFY_RATE_LIMIT_PER_MINUTE = 5
_verify_attempts: dict[int, deque[float]] = defaultdict(deque)
_verify_lock = asyncio.Lock()


async def enforce_verify_rate_limit(current_user: User = Depends(get_current_user)) -> User:
    now = time.monotonic()
    async with _verify_lock:
        bucket = _verify_attempts[current_user.id]
        while bucket and bucket[0] <= now - 60:
            bucket.popleft()
        if len(bucket) >= VERIFY_RATE_LIMIT_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Bạn thử kích hoạt key quá nhanh. Vui lòng thử lại sau 1 phút.",
                headers={"Retry-After": "60"},
            )
        bucket.append(now)
    return current_user
