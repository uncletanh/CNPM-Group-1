import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base

STATUS_BOT_HANDLING = "bot_handling"
STATUS_WAITING_HUMAN = "waiting_human"
STATUS_HUMAN_HANDLING = "human_handling"
STATUS_RESOLVED = "resolved"


def generate_session_key() -> str:
    return uuid.uuid4().hex


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    session_key = Column(String, unique=True, index=True, nullable=False, default=generate_session_key)
    status = Column(String, nullable=False, default=STATUS_BOT_HANDLING)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    handoff_requested_at = Column(DateTime, nullable=True)
    fallback_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace")
    assigned_agent = relationship("User")
    messages = relationship(
        "Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    sender = Column(String, nullable=False)  # 'user' | 'bot' | 'agent'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("ChatSession", back_populates="messages")
