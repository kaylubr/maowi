from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.modules import models, service
from server.modules.schemas import (
    ModuleMergeRequest,
    ModuleRead,
    ModuleStatusRead,
    ModuleUpdate,
)
from server.users.models import User

router = APIRouter(prefix="/api/modules", tags=["modules"])


def get_owned_module(db: Session, user_id: int, module_id: int) -> models.Module:
    module = service.get_user_module(db, user_id, module_id)
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return module


@router.get("", response_model=list[ModuleRead])
def list_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.Module]:
    return service.list_modules(db, current_user.id)


@router.patch("/{module_id}", response_model=ModuleRead)
def rename_module(
    module_id: int,
    payload: ModuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Module:
    module = get_owned_module(db, current_user.id, module_id)
    return service.rename_module(db, module, payload.name)


@router.post("/{module_id}/merge", response_model=ModuleRead)
def merge_module(
    module_id: int,
    payload: ModuleMergeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Module:
    source = get_owned_module(db, current_user.id, module_id)
    target = get_owned_module(db, current_user.id, payload.target_module_id)

    if source.id == target.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot merge a module into itself",
        )

    return service.merge_modules(db, source, target)


@router.get("/{module_id}/status", response_model=ModuleStatusRead)
def read_module_status(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Module:
    return get_owned_module(db, current_user.id, module_id)
