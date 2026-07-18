from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.workspace import DEFAULT_SYSTEM_PROMPT


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspacePromptUpdate(BaseModel):
    system_prompt: str = Field(..., min_length=20, max_length=4000)


class WorkspaceDomainsUpdate(BaseModel):
    # Danh sach rong = khong khoa domain, widget_token dung duoc tu bat ky origin nao.
    domains: list[str] = Field(default_factory=list)


class WidgetSettingsUpdate(BaseModel):
    primary_color: str = Field(default="#4f46e5", pattern=r"^#[0-9a-fA-F]{6}$")
    bot_name: str = Field(default="NovaChat AI", min_length=1, max_length=60)
    greeting: str = Field(..., min_length=1, max_length=300)
    avatar_url: str | None = Field(default=None, max_length=500)
    position: str = Field(default="right", pattern="^(left|right)$")


class WidgetSettingsResponse(BaseModel):
    primary_color: str
    bot_name: str
    greeting: str
    avatar_url: str | None = None
    position: str
    watermark: bool = True


class WorkspaceResponse(WorkspaceBase):
    id: int
    system_prompt: str = DEFAULT_SYSTEM_PROMPT
    owner_id: int
    widget_token: str
    allowed_domains: list[str] = Field(default_factory=list)
    widget_primary_color: str = "#4f46e5"
    bot_name: str = "NovaChat AI"
    bot_greeting: str = "Xin chào! Mình là NovaChat AI. Mình có thể giúp gì cho bạn?"
    bot_avatar_url: str | None = None
    widget_position: str = "right"

    class Config:
        from_attributes = True


class KnowledgeUploadResponse(BaseModel):
    detail: str
    filename: str
    file_size: int
    chunks: int
    collection_name: str


class KnowledgeTextUpsert(BaseModel):
    filename: str = Field(..., min_length=1, max_length=180)
    content: str = Field(..., min_length=1, max_length=500_000)


class KnowledgeDocumentResponse(BaseModel):
    filename: str
    file_size: int | None = None
    chunks: int
    uploaded_at: str | None = None
    file_type: str | None = None


class KnowledgeSummaryResponse(BaseModel):
    total_documents: int
    total_chunks: int
    documents: list[KnowledgeDocumentResponse]


class KnowledgePreviewChunk(BaseModel):
    chunk_index: int
    page: int | None = None
    content: str


class KnowledgePreviewResponse(BaseModel):
    filename: str
    total_chunks: int
    chunks: list[KnowledgePreviewChunk]


class WorkspaceMemberResponse(BaseModel):
    user_id: int
    email: EmailStr
    role: str
    is_owner: bool = False


class WorkspaceMemberRoleUpdate(BaseModel):
    role: str = Field(pattern="^(admin|agent)$")


class WorkspaceInvitationCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="agent", pattern="^(admin|agent)$")


class WorkspaceInvitationResponse(BaseModel):
    id: int
    workspace_id: int
    email: EmailStr
    role: str
    token: str
    status: str
    expires_at: datetime

    class Config:
        from_attributes = True
