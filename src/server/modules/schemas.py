from pydantic import BaseModel, ConfigDict, Field

from server.modules.models import ModuleStatus


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: ModuleStatus
    error_message: str | None = None


class ModuleStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ModuleStatus
    error_message: str | None = None


class ModuleUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ModuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    file_ids: list[int] = Field(default_factory=list)


class ModuleMergeRequest(BaseModel):
    target_module_id: int
