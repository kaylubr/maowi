import secrets
from datetime import datetime, timezone
from typing import NamedTuple

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from server.attempts.models import Attempt, AttemptMode
from server.members.models import ModuleMember
from server.members.schemas import LeaderboardEntryRead
from server.modules.models import Module
from server.users.models import User
from server.users.service import get_users_by_ids

EPOCH = datetime.min.replace(tzinfo=timezone.utc)
OWNER_JOINED_RANK = -1


class AttemptStats(NamedTuple):
    best_ratio: float
    best_completed_at: datetime
    best_mcq_ratio: float | None
    best_identification_ratio: float | None
    attempt_count: int
    last_studied_at: datetime


class LeaderboardRow(NamedTuple):
    entry: LeaderboardEntryRead
    joined_rank: int
    best_completed_at: datetime | None


def get_module_member(
    db: Session, module_id: int, user_id: int
) -> ModuleMember | None:
    statement = select(ModuleMember).where(
        ModuleMember.module_id == module_id, ModuleMember.user_id == user_id
    )
    return db.scalar(statement)


def is_owner(module: Module, user_id: int) -> bool:
    return module.user_id == user_id


def is_owner_or_member(db: Session, module: Module, user_id: int) -> bool:
    return (
        is_owner(module, user_id)
        or get_module_member(db, module.id, user_id) is not None
    )


def get_accessible_module(db: Session, user_id: int, module_id: int) -> Module:
    module = db.get(Module, module_id)
    if module is None or not is_owner_or_member(db, module, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return module


def accessible_module_ids(db: Session, user_id: int) -> list[int]:
    owned = select(Module.id).where(Module.user_id == user_id)
    joined = select(ModuleMember.module_id).where(ModuleMember.user_id == user_id)
    return sorted({*db.scalars(owned), *db.scalars(joined)})


def add_member(db: Session, module: Module, user_id: int) -> ModuleMember:
    member = ModuleMember(user_id=user_id, module_id=module.id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, module: Module, user_id: int) -> None:
    db.execute(
        delete(ModuleMember).where(
            ModuleMember.module_id == module.id,
            ModuleMember.user_id == user_id,
        )
    )
    db.commit()


def list_members(db: Session, module: Module) -> list[ModuleMember]:
    statement = (
        select(ModuleMember)
        .where(ModuleMember.module_id == module.id)
        .order_by(ModuleMember.id)
    )
    return list(db.scalars(statement))


def count_members(db: Session, module: Module) -> int:
    statement = select(func.count(ModuleMember.id)).where(
        ModuleMember.module_id == module.id
    )
    return db.scalar(statement)


def regenerate_invite_token(db: Session, module: Module) -> Module:
    module.invite_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(module)
    return module


def get_leaderboard(db: Session, module: Module) -> list[LeaderboardEntryRead]:
    members = list_members(db, module)
    user_ids = sorted({module.user_id, *[member.user_id for member in members]})
    users = get_users_by_ids(db, user_ids)
    stats = collect_attempt_stats(db, module.id, user_ids)
    joined_ranks = member_joined_ranks(members)

    rows = [
        build_leaderboard_row(
            module,
            users[user_id],
            stats.get(user_id),
            joined_ranks.get(user_id, OWNER_JOINED_RANK),
        )
        for user_id in user_ids
        if user_id in users
    ]
    rows.sort(key=lambda row: row.joined_rank)
    rows.sort(key=score_key)
    return [row.entry for row in rows]


def collect_attempt_stats(
    db: Session, module_id: int, user_ids: list[int]
) -> dict[int, AttemptStats]:
    statement = select(Attempt).where(
        Attempt.module_id == module_id,
        Attempt.user_id.in_(user_ids),
        Attempt.completed_at.is_not(None),
    )
    grouped: dict[int, list[Attempt]] = {}
    for attempt in db.scalars(statement):
        grouped.setdefault(attempt.user_id, []).append(attempt)
    return {
        user_id: summarize_attempts(attempts)
        for user_id, attempts in grouped.items()
    }


def summarize_attempts(attempts: list[Attempt]) -> AttemptStats:
    best = best_attempt(attempts)
    return AttemptStats(
        best_ratio=attempt_ratio(best),
        best_completed_at=best.completed_at,
        best_mcq_ratio=best_mode_ratio(attempts, AttemptMode.mcq),
        best_identification_ratio=best_mode_ratio(
            attempts, AttemptMode.identification
        ),
        attempt_count=len(attempts),
        last_studied_at=max(attempt.completed_at for attempt in attempts),
    )


def best_attempt(attempts: list[Attempt]) -> Attempt:
    return min(
        attempts,
        key=lambda attempt: (
            -attempt_ratio(attempt),
            attempt.completed_at,
            attempt.id,
        ),
    )


def best_mode_ratio(attempts: list[Attempt], mode: AttemptMode) -> float | None:
    ratios = [
        attempt_ratio(attempt) for attempt in attempts if attempt.mode == mode
    ]
    return max(ratios) if ratios else None


def attempt_ratio(attempt: Attempt) -> float:
    return attempt.score / attempt.total_questions


def member_joined_ranks(members: list[ModuleMember]) -> dict[int, int]:
    ordered = sorted(members, key=lambda member: (member.joined_at, member.id))
    return {
        member.user_id: rank for rank, member in enumerate(ordered)
    }


def build_leaderboard_row(
    module: Module,
    user: User,
    stats: AttemptStats | None,
    joined_rank: int,
) -> LeaderboardRow:
    entry = LeaderboardEntryRead(
        user_id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        is_owner=is_owner(module, user.id),
        best_score=to_percent(stats.best_ratio) if stats else None,
        best_mcq_score=to_percent(stats.best_mcq_ratio) if stats else None,
        best_identification_score=(
            to_percent(stats.best_identification_ratio) if stats else None
        ),
        attempt_count=stats.attempt_count if stats else 0,
        last_studied_at=stats.last_studied_at if stats else None,
    )
    return LeaderboardRow(
        entry=entry,
        joined_rank=joined_rank,
        best_completed_at=stats.best_completed_at if stats else None,
    )


def score_key(row: LeaderboardRow) -> tuple:
    return (
        row.entry.best_score is None,
        -(row.entry.best_score or 0),
        row.best_completed_at or EPOCH,
    )


def to_percent(ratio: float | None) -> int | None:
    return None if ratio is None else round(ratio * 100)
