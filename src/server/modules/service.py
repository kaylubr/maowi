import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from server.members import service as members_service
from server.modules.models import Module, ModuleCreation, ModuleCreationStatus

CREATION_TTL_HOURS = 1


def list_modules(db: Session, user_id: int) -> list[Module]:
    module_ids = members_service.accessible_module_ids(db, user_id)
    if not module_ids:
        return []
    statement = (
        select(Module).where(Module.id.in_(module_ids)).order_by(Module.id)
    )
    return list(db.scalars(statement))


def get_user_module(db: Session, user_id: int, module_id: int) -> Module | None:
    statement = select(Module).where(
        Module.id == module_id, Module.user_id == user_id
    )
    return db.scalar(statement)


def get_module_by_invite_token(db: Session, invite_token: str) -> Module | None:
    statement = select(Module).where(Module.invite_token == invite_token)
    return db.scalar(statement)


def create_module(db: Session, user_id: int, name: str) -> Module:
    module = Module(
        user_id=user_id, name=name, invite_token=secrets.token_urlsafe(32)
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


def rename_module(db: Session, module: Module, name: str) -> Module:
    module.name = name
    db.commit()
    db.refresh(module)
    return module


def delete_module(db: Session, module: Module) -> None:
    db.delete(module)
    db.commit()


def create_creation(db: Session, user_id: int) -> ModuleCreation:
    creation = ModuleCreation(
        user_id=user_id, status=ModuleCreationStatus.generating
    )
    db.add(creation)
    db.commit()
    db.refresh(creation)
    return creation


def get_user_creation(
    db: Session, user_id: int, creation_id: int
) -> ModuleCreation | None:
    statement = select(ModuleCreation).where(
        ModuleCreation.id == creation_id, ModuleCreation.user_id == user_id
    )
    return db.scalar(statement)


def reap_stale_creations(db: Session) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CREATION_TTL_HOURS)
    db.execute(delete(ModuleCreation).where(ModuleCreation.created_at < cutoff))
    db.commit()
