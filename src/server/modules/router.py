from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.files import service as files_service
from server.modules import models, service
from server.modules.schemas import (
    ModuleCreate,
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


@router.post("", response_model=ModuleRead, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Module:
    files = files_service.get_user_files_by_ids(db, current_user.id, payload.file_ids)
    if len(files) != len(set(payload.file_ids)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return service.create_module(db, current_user.id, payload.name, files)


@router.patch("/{module_id}", response_model=ModuleRead)
def rename_module(
    module_id: int,
    payload: ModuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Module:
    module = get_owned_module(db, current_user.id, module_id)
    return service.rename_module(db, module, payload.name)


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    module = get_owned_module(db, current_user.id, module_id)
    service.delete_module(db, module)


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
