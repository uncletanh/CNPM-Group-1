from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

ROLE_USER = "USER"
ROLE_STAFF = "STAFF"
ROLE_ADMIN = "ADMIN"

PLAN_FREE = "FREE"
PLAN_PRO = "PRO"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Vai tro toan cuc tren he thong (USER/STAFF/ADMIN) - khac voi
    # WorkspaceMember.role (admin/agent), la vai tro rieng cho tung workspace.
    role = Column(String, nullable=False, default=ROLE_USER)
    plan = Column(String, nullable=False, default=PLAN_FREE)  # FREE hoac PRO
    is_active = Column(Boolean, default=True)

    workspaces = relationship("Workspace", back_populates="owner")

