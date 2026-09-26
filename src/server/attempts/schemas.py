from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from server.attempts.models import AttemptMode


class AttemptStart(BaseModel):
    module_id: int
    mode: AttemptMode
    count: int | None = Field(default=None, ge=1)


class AnswerSubmit(BaseModel):
    question_id: int
    user_answer: str


class AttemptAnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: int
    user_answer: str
    is_correct: bool


class AttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_id: int
    mode: AttemptMode
    total_questions: int
    score: int | None
    started_at: datetime
    completed_at: datetime | None


class AttemptDetail(AttemptRead):
    answers: list[AttemptAnswerRead]
