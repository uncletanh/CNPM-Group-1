from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base

DEFAULT_SYSTEM_PROMPT = (
    "Ban la tro ly ao cua cong ty. Chi tra loi dua tren context duoc cung cap. "
    "Neu context khong co thong tin phu hop, hay de nghi khach hang gap nhan vien ho tro."
)


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    system_prompt = Column(Text, nullable=False, default=DEFAULT_SYSTEM_PROMPT)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="workspaces")
