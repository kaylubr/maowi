from datetime import datetime, timezone
from typing import NamedTuple

from sqlalchemy import Float, cast, func, select
from sqlalchemy.orm import Session

from server.attempts.models import Attempt
from server.dashboard.schemas import DashboardSummaryRead, ModuleSummaryRead
from server.members import service as members_service
from server.modules.models import Module
from server.questions.models import Question

EPOCH = datetime.min.replace(tzinfo=timezone.utc)


class AttemptTotals(NamedTuple):
    attempt_count: int
    average_score: float | None
    best_score: float | None
    last_studied_at: datetime | None

score_ratio = cast(Attempt.score, Float) / Attempt.total_questions


def get_summary(db: Session, user_id: int) -> DashboardSummaryRead:
    modules = list_accessible_modules(db, user_id)

    if not modules:
        return empty_summary()

    module_ids = [module.id for module in modules]
    question_counts = count_questions(db, module_ids)
    per_module = score_attempts_by_module(db, user_id, module_ids)
    totals = score_attempts(db, user_id)

    summaries = [
        build_module_summary(module, user_id, question_counts, per_module)
        for module in modules
    ]
    summaries.sort(key=recency_key, reverse=True)

    return DashboardSummaryRead(
        module_count=len(modules),
        question_count=sum(question_counts.values()),
        attempt_count=totals.attempt_count,
        average_score=to_percent(totals.average_score),
        best_score=to_percent(totals.best_score),
        last_studied_at=totals.last_studied_at,
        modules=summaries,
    )


def list_accessible_modules(db: Session, user_id: int) -> list[Module]:
    module_ids = members_service.accessible_module_ids(db, user_id)
    if not module_ids:
        return []
    statement = select(Module).where(Module.id.in_(module_ids)).order_by(Module.id)
    return list(db.scalars(statement))


def empty_summary() -> DashboardSummaryRead:
    return DashboardSummaryRead(
        module_count=0,
        question_count=0,
        attempt_count=0,
        average_score=None,
        best_score=None,
        last_studied_at=None,
        modules=[],
    )


def count_questions(db: Session, module_ids: list[int]) -> dict[int, int]:
    statement = (
        select(Question.module_id, func.count(Question.id))
        .where(Question.module_id.in_(module_ids))
        .group_by(Question.module_id)
    )
    return dict(db.execute(statement).all())


def score_attempts_by_module(
    db: Session, user_id: int, module_ids: list[int]
) -> dict[int, tuple[int, float | None, datetime | None]]:
    statement = (
        select(
            Attempt.module_id,
            func.count(Attempt.id),
            func.max(score_ratio),
            func.max(Attempt.completed_at),
        )
        .where(*completed_attempt_filter(user_id), Attempt.module_id.in_(module_ids))
        .group_by(Attempt.module_id)
    )
    return {
        module_id: (count, best_score, last_studied_at)
        for module_id, count, best_score, last_studied_at in db.execute(statement).all()
    }


def score_attempts(db: Session, user_id: int) -> AttemptTotals:
    statement = select(
        func.count(Attempt.id),
        func.avg(score_ratio),
        func.max(score_ratio),
        func.max(Attempt.completed_at),
    ).where(*completed_attempt_filter(user_id))

    count, average, best, last_studied_at = db.execute(statement).one()
    return AttemptTotals(count, average, best, last_studied_at)


def build_module_summary(
    module: Module,
    user_id: int,
    question_counts: dict[int, int],
    per_module: dict[int, tuple[int, float | None, datetime | None]],
) -> ModuleSummaryRead:
    count, best_score, last_studied_at = per_module.get(module.id, (0, None, None))

    return ModuleSummaryRead(
        id=module.id,
        name=module.name,
        is_owner=members_service.is_owner(module, user_id),
        question_count=question_counts.get(module.id, 0),
        attempt_count=count,
        best_score=to_percent(best_score),
        last_studied_at=last_studied_at,
    )


def completed_attempt_filter(user_id: int):
    return Attempt.user_id == user_id, Attempt.completed_at.is_not(None)


def recency_key(summary: ModuleSummaryRead) -> tuple:
    return (
        summary.last_studied_at is not None,
        summary.last_studied_at or EPOCH,
        summary.id,
    )


def to_percent(ratio: float | None) -> int | None:
    return None if ratio is None else round(ratio * 100)
