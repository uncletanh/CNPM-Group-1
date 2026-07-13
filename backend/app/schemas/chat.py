from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=3, ge=1, le=5)


class ChatSource(BaseModel):
    source_filename: str | None = None
    chunk_index: int | None = None
    distance: float | None = None
    preview: str


class ChatResponse(BaseModel):
    workspace_id: int
    answer: str
    context_chunks: int
    sources: list[ChatSource]
