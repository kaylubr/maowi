from sqlalchemy import select, update
from sqlalchemy.orm import Session

from server.files.models import File
from server.modules.models import Module, ModuleStatus
from server.questions.models import Question


def as_int(value: object) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def list_modules(db: Session, user_id: int) -> list[Module]:
    statement = (
        select(Module).where(Module.user_id == user_id).order_by(Module.id)
    )
    return list(db.scalars(statement))


def get_user_module(db: Session, user_id: int, module_id: int) -> Module | None:
    statement = select(Module).where(
        Module.id == module_id, Module.user_id == user_id
    )
    return db.scalar(statement)


def create_module(db: Session, user_id: int, name: str) -> Module:
    module = Module(user_id=user_id, name=name, status=ModuleStatus.draft)
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


def rename_module(db: Session, module: Module, name: str) -> Module:
    module.name = name
    db.commit()
    db.refresh(module)
    return module


def assign_files_to_module(db: Session, files: list[File], module: Module) -> Module:
    for file in files:
        file.module_id = module.id
    db.commit()
    db.refresh(module)
    return module


def merge_modules(db: Session, source: Module, target: Module) -> Module:
    db.execute(
        update(File).where(File.module_id == source.id).values(module_id=target.id)
    )
    db.execute(
        update(Question)
        .where(Question.module_id == source.id)
        .values(module_id=target.id)
    )
    db.delete(source)
    db.commit()
    db.refresh(target)
    return target


def apply_assignments(db: Session, user_id: int, assignments: list[dict]) -> None:
    own_module_ids = {module.id for module in list_modules(db, user_id)}
    modules_by_name: dict[str, Module] = {}

    for assignment in assignments:
        if not isinstance(assignment, dict):
            continue

        file_id = as_int(assignment.get("file_id"))
        if file_id is None:
            continue

        file = db.scalar(
            select(File).where(File.id == file_id, File.user_id == user_id)
        )
        if file is None:
            continue

        existing_module_id = as_int(assignment.get("existing_module_id"))
        if existing_module_id in own_module_ids:
            file.module_id = existing_module_id
            continue

        new_module_name = assignment.get("new_module_name")
        if not isinstance(new_module_name, str):
            continue
        name = new_module_name.strip()
        if not name:
            continue

        module = modules_by_name.get(name)
        if module is None:
            module = create_module(db, user_id, name)
            modules_by_name[name] = module

        file.module_id = module.id

    db.commit()
