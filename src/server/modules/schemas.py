from pydantic import BaseModel, ConfigDict, Field

from server.modules.models import ModuleCreationStatus


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_owner: bool


class ModuleDetailRead(BaseModel):
    id: int
    name: str
    is_owner: bool
    invite_token: str
    member_count: int


class ModuleUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ModuleCreationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ModuleCreationStatus
    module_id: int | None = None
    error_message: str | None = None
