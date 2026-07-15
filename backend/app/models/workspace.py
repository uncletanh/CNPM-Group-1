import uuid

from sqlalchemy import Column, ForeignKey, Integer, String, Text
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
    # Neu duoc dien, /chat chi chap nhan widget_token goi tu dung domain nay
    # (kiem tra header Origin). Day la lop phong thu bo sung, khong thay the
    # hoan toan widget_token vi Origin/Referer van co the bi gia mao boi client
    # khong phai trinh duyet (vd goi truc tiep bang script/cURL).
    allowed_origin = Column(String, nullable=True)

    owner = relationship("User", back_populates="workspaces")
