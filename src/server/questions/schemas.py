from enum import StrEnum

from pydantic import BaseModel


class QuestionMode(StrEnum):
    flashcard = "flashcard"
    mcq = "mcq"
    identification = "identification"


class FlashcardQuestion(BaseModel):
    id: int
    prompt: str
    answer: str


class MultipleChoiceQuestion(BaseModel):
    id: int
    prompt: str
    options: list[str]


class IdentificationQuestion(BaseModel):
    id: int
    prompt: str


QuestionRead = FlashcardQuestion | MultipleChoiceQuestion | IdentificationQuestion
