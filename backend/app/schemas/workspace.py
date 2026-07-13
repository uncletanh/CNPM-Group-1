from pydantic import BaseModel, Field

from app.models.workspace import DEFAULT_SYSTEM_PROMPT


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspacePromptUpdate(BaseModel):
    system_prompt: str = Field(..., min_length=20, max_length=4000)


class WorkspaceResponse(WorkspaceBase):
    id: int
    system_prompt: str = DEFAULT_SYSTEM_PROMPT
    owner_id: int

    class Config:
        from_attributes = True


class KnowledgeUploadResponse(BaseModel):
    detail: str
    filename: str
    file_size: int
    chunks: int
    collection_name: str
