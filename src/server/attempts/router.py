from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.attempts import service
from server.attempts.models import Attempt
from server.attempts.schemas import (
    AnswerSubmit,
    AttemptAnswerRead,
    AttemptDetail,
    AttemptRead,
    AttemptStart,
)
from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.modules import service as modules_service
from server.questions import service as questions_service
from server.users.models import User

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


def get_owned_attempt(db: Session, user_id: int, attempt_id: int) -> Attempt:
    attempt = service.get_user_attempt(db, user_id, attempt_id)
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )
    return attempt


def get_open_attempt(db: Session, user_id: int, attempt_id: int) -> Attempt:
    attempt = get_owned_attempt(db, user_id, attempt_id)
    if attempt.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt is already completed",
        )
    return attempt


@router.post("", response_model=AttemptRead, status_code=status.HTTP_201_CREATED)
def start_attempt(
    payload: AttemptStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Attempt:
    module = modules_service.get_user_module(db, current_user.id, payload.module_id)
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    questions = questions_service.list_module_questions(db, module.id, payload.count)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module has no questions to attempt",
        )

    return service.create_attempt(
        db,
        current_user.id,
        module.id,
        payload.mode,
        len(questions),
    )


@router.post("/{attempt_id}/answers", response_model=AttemptAnswerRead)
def submit_answer(
    attempt_id: int,
    payload: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AttemptAnswerRead:
    attempt = get_open_attempt(db, current_user.id, attempt_id)

    question = questions_service.get_question(db, payload.question_id)
    question_in_attempt_module = (
        question is not None and question.module_id == attempt.module_id
    )
    if not question_in_attempt_module:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not belong to this attempt's module",
        )

    return service.record_answer(db, attempt, question, payload.user_answer)


@router.post("/{attempt_id}/complete", response_model=AttemptRead)
def complete_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Attempt:
    attempt = get_open_attempt(db, current_user.id, attempt_id)
    return service.complete_attempt(db, attempt)


@router.get("/{attempt_id}", response_model=AttemptDetail)
def read_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AttemptDetail:
    attempt = get_owned_attempt(db, current_user.id, attempt_id)
    answers = service.list_attempt_answers(db, attempt.id)

    return AttemptDetail(
        id=attempt.id,
        module_id=attempt.module_id,
        mode=attempt.mode,
        total_questions=attempt.total_questions,
        score=attempt.score,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        answers=answers,
    )
