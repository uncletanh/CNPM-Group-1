from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LicenseKeyGenerateRequest(BaseModel):
    count: int = Field(default=1, ge=1, le=100)


class LicenseKeyResponse(BaseModel):
    id: int
    key: str
    status: str
    used_by_user_id: int | None
    used_by_email: EmailStr | None = None
    used_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
