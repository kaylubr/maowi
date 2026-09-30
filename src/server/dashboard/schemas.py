from datetime import datetime

from pydantic import BaseModel


class ModuleSummaryRead(BaseModel):
    id: int
    name: str
    is_owner: bool
    question_count: int
    attempt_count: int
    best_score: int | None
    last_studied_at: datetime | None


class DashboardSummaryRead(BaseModel):
    module_count: int
    question_count: int
    attempt_count: int
    average_score: int | None
    best_score: int | None
    last_studied_at: datetime | None
    modules: list[ModuleSummaryRead]
