from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.license import STATUS_REVOKED, LicenseKey
from app.models.user import ROLE_ADMIN, ROLE_STAFF, User
from app.schemas.license import LicenseKeyGenerateRequest, LicenseKeyResponse
from app.schemas.user import StaffCreate, UserPlanUpdate, UserResponse
from app.core import security
from app.services.licensing import create_license_keys

router = APIRouter(dependencies=[Depends(require_role(ROLE_ADMIN))])


def _to_license_response(license_key: LicenseKey) -> LicenseKeyResponse:
    return LicenseKeyResponse(
        id=license_key.id,
        key=license_key.key,
        status=license_key.status,
        used_by_user_id=license_key.used_by_user_id,
        used_by_email=license_key.used_by.email if license_key.used_by else None,
        used_at=license_key.used_at,
        created_at=license_key.created_at,
    )


@router.post("/license-keys", response_model=list[LicenseKeyResponse], status_code=status.HTTP_201_CREATED)
def generate_license_keys(
    request_in: LicenseKeyGenerateRequest,
    db: Session = Depends(get_db),
):
    created = create_license_keys(db, request_in.count)
    return [_to_license_response(key) for key in created]


@router.get("/license-keys", response_model=list[LicenseKeyResponse])
def list_license_keys(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    keys = (
        db.query(LicenseKey)
        .order_by(LicenseKey.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_license_response(key) for key in keys]


@router.post("/license-keys/{key_id}/revoke", response_model=LicenseKeyResponse)
def revoke_license_key(
    key_id: int,
    db: Session = Depends(get_db),
):
    license_key = db.query(LicenseKey).filter(LicenseKey.id == key_id).first()
    if not license_key:
        raise HTTPException(status_code=404, detail="Không tìm thấy License Key.")
    license_key.status = STATUS_REVOKED
    db.commit()
    db.refresh(license_key)
    return _to_license_response(license_key)


@router.get("/users", response_model=list[UserResponse])
def list_all_users(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.put("/users/{user_id}/plan", response_model=UserResponse)
def update_user_plan(
    user_id: int,
    plan_in: UserPlanUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
    user.plan = plan_in.plan
    db.commit()
    db.refresh(user)
    return user


@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == staff_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký sử dụng.")
    staff_user = User(
        email=staff_in.email,
        hashed_password=security.get_password_hash(staff_in.password),
        role=ROLE_STAFF,
    )
    db.add(staff_user)
    db.commit()
    db.refresh(staff_user)
    return staff_user
