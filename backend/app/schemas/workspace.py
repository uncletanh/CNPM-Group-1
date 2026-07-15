from pydantic import BaseModel, Field

from app.models.workspace import DEFAULT_SYSTEM_PROMPT


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspacePromptUpdate(BaseModel):
    system_prompt: str = Field(..., min_length=20, max_length=4000)


class WorkspaceOriginUpdate(BaseModel):
    # De trong (None) = khong khoa domain, widget_token dung duoc tu bat ky origin nao.
    allowed_origin: str | None = Field(default=None, max_length=255)


class WorkspaceResponse(WorkspaceBase):
    id: int
    system_prompt: str = DEFAULT_SYSTEM_PROMPT
    owner_id: int
    widget_token: str
    allowed_origin: str | None = None

    class Config:
        from_attributes = True


class KnowledgeUploadResponse(BaseModel):
    detail: str
    filename: str
    file_size: int
    chunks: int
    collection_name: str


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
