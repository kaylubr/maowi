from datetime import datetime

from pydantic import BaseModel


class InvitationRead(BaseModel):
    module_name: str
    owner_username: str | None


class InvitationAcceptRead(BaseModel):
    module_id: int


class MemberRead(BaseModel):
    user_id: int
    username: str | None
    avatar_url: str | None
    is_owner: bool
    joined_at: datetime | None


class LeaderboardEntryRead(BaseModel):
    user_id: int
    username: str | None
    avatar_url: str | None
    is_owner: bool
    best_score: int | None
    best_mcq_score: int | None
    best_identification_score: int | None
    attempt_count: int
    last_studied_at: datetime | None


class InviteTokenRead(BaseModel):
    invite_token: str
