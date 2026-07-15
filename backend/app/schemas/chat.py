from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=3, ge=1, le=5)
    session_key: str | None = Field(default=None, max_length=64)


class ChatSource(BaseModel):
    source_filename: str | None = None
    chunk_index: int | None = None
    page: int | None = None
    distance: float | None = None
    preview: str


class ChatResponse(BaseModel):
    workspace_id: int
    session_key: str
    answer: str
    context_chunks: int
    sources: list[ChatSource]


class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    id: int
    session_key: str
    status: str
    assigned_agent_id: int | None = None
    handoff_requested_at: datetime | None = None
    fallback_sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentReplyRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class HumanSupportRequest(BaseModel):
    session_key: str | None = Field(default=None, min_length=1, max_length=64)


class PollResponse(BaseModel):
    """Widget hoi backend co gi moi: trang thai phien + cac tin nhan cua nhan vien
    (sender=agent) co id lon hon con tro `after` ma widget da thay."""

    status: str
    messages: list[MessageResponse]


class WorkspaceStats(BaseModel):
    """So lieu tong hop cho trang Thong ke & Bao cao."""

    total_sessions: int
    sessions_by_status: dict[str, int]
    total_messages: int
    messages_by_sender: dict[str, int]
