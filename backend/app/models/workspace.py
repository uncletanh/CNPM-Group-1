import uuid
from datetime import datetime, timedelta

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base

DEFAULT_SYSTEM_PROMPT = (
    "Ban la tro ly ao cua cong ty. Chi tra loi dua tren context duoc cung cap. "
    "Neu context khong co thong tin phu hop, hay de nghi khach hang gap nhan vien ho tro."
)


def generate_widget_token() -> str:
    return uuid.uuid4().hex


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    system_prompt = Column(Text, nullable=False, default=DEFAULT_SYSTEM_PROMPT)
    owner_id = Column(Integer, ForeignKey("users.id"))
    widget_token = Column(
        String, unique=True, index=True, nullable=False, default=generate_widget_token
    )
    # Neu khong rong, /chat chi chap nhan widget_token goi tu mot trong cac domain
    # nay (kiem tra header Origin). Day la lop phong thu bo sung, khong thay the
    # hoan toan widget_token vi Origin/Referer van co the bi gia mao boi client
    # khong phai trinh duyet (vd goi truc tiep bang script/cURL).
    allowed_domains = Column(JSON, nullable=False, default=list)
    widget_primary_color = Column(String, nullable=False, default="#4f46e5")
    bot_name = Column(String, nullable=False, default="NovaChat AI")
    bot_greeting = Column(
        String,
        nullable=False,
        default="Xin chào! Mình là NovaChat AI. Mình có thể giúp gì cho bạn?",
    )
    bot_avatar_url = Column(String, nullable=True)
    widget_position = Column(String, nullable=False, default="right")
    # Dem so tin nhan bot da xu ly qua Embed API trong ky (message_count_period)
    # hien tai, dung de gioi han goi FREE. Reset khi sang ky moi (xem
    # app/services/monetization.py). Khong tinh tin nhan test trong dashboard.
    message_count = Column(Integer, nullable=False, default=0)
    message_count_period = Column(String, nullable=True)  # "YYYY-MM"

    owner = relationship("User", back_populates="workspaces")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name="uq_workspace_member"),)

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False, default="agent")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    workspace = relationship("Workspace")
    user = relationship("User")


class WorkspaceInvitation(Base):
    __tablename__ = "workspace_invitations"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False, default="agent")
    token = Column(String, nullable=False, unique=True, index=True, default=generate_widget_token)
    status = Column(String, nullable=False, default="pending")
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=7))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    workspace = relationship("Workspace")
    invited_by = relationship("User")
