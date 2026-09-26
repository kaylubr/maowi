from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from server.attempts.models import Attempt, AttemptAnswer, AttemptMode
from server.questions.models import Question


def create_attempt(
    db: Session,
    user_id: int,
    module_id: int,
    mode: AttemptMode,
    total_questions: int,
) -> Attempt:
    attempt = Attempt(
        user_id=user_id,
        module_id=module_id,
        mode=mode,
        total_questions=total_questions,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def get_user_attempt(db: Session, user_id: int, attempt_id: int) -> Attempt | None:
    statement = select(Attempt).where(
        Attempt.id == attempt_id, Attempt.user_id == user_id
    )
    return db.scalar(statement)


def list_attempt_answers(db: Session, attempt_id: int) -> list[AttemptAnswer]:
    statement = (
        select(AttemptAnswer)
        .where(AttemptAnswer.attempt_id == attempt_id)
        .order_by(AttemptAnswer.id)
    )
    return list(db.scalars(statement))


def is_correct_answer(
    question: Question,
    user_answer: str,
    mode: AttemptMode,
) -> bool:
    if mode == AttemptMode.identification:
        return question.answer.strip().lower() == user_answer.strip().lower()
    return question.answer == user_answer


def record_answer(
    db: Session,
    attempt: Attempt,
    question: Question,
    user_answer: str,
) -> AttemptAnswer:
    statement = select(AttemptAnswer).where(
        AttemptAnswer.attempt_id == attempt.id,
        AttemptAnswer.question_id == question.id,
    )
    answer = db.scalar(statement)
    correct = is_correct_answer(question, user_answer, attempt.mode)

    if answer is None:
        answer = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            user_answer=user_answer,
            is_correct=correct,
        )
        db.add(answer)
    else:
        answer.user_answer = user_answer
        answer.is_correct = correct

    db.commit()
    db.refresh(answer)
    return answer


def complete_attempt(db: Session, attempt: Attempt) -> Attempt:
    answers = list_attempt_answers(db, attempt.id)
    attempt.score = sum(1 for answer in answers if answer.is_correct)
    attempt.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(attempt)
    return attempt
