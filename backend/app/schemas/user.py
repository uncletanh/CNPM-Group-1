from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

class UserResponse(UserBase):
    id: int
    role: str
    plan: str
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class StaffCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserPlanUpdate(BaseModel):
    plan: str = Field(pattern="^(FREE|PRO)$")


class LicenseActivateRequest(BaseModel):
    key: str = Field(..., min_length=1, max_length=64)

