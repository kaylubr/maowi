from pydantic import BaseModel, ConfigDict

from server.files.models import FileStatus


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_type: str
    status: FileStatus
    error_message: str | None = None
    module_id: int | None = None


class FileStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: FileStatus
    error_message: str | None = None


class FileUpdate(BaseModel):
    module_id: int | None
