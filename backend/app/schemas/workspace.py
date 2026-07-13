from pydantic import BaseModel

class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspacePromptUpdate(BaseModel):
    system_prompt: str

class WorkspaceResponse(WorkspaceBase):
    id: int
    system_prompt: str
    owner_id: int

    class Config:
        from_attributes = True
