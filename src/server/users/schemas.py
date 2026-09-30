from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str | None
    avatar_url: str | None
    created_at: datetime


class UserUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
