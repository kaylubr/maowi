from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.config import settings
from server.db.session import get_db
from server.modules import models, service
from server.modules.parsing import UnsupportedFileTypeError, file_type_from_filename
from server.modules.schemas import ModuleCreationRead, ModuleRead, ModuleUpdate
from server.modules.tasks import Upload, create_module_from_files
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


def get_owned_creation(
    db: Session, user_id: int, creation_id: int
) -> models.ModuleCreation:
    creation = service.get_user_creation(db, user_id, creation_id)
    if creation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module creation not found",
        )
    return creation


def read_upload(upload: UploadFile) -> Upload:
    filename = upload.filename or "untitled"
    try:
        file_type = file_type_from_filename(filename)
    except UnsupportedFileTypeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {filename}",
        )

    content = upload.file.read()
    exceeds_size = len(content) > settings.max_upload_file_bytes
    if exceeds_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{filename} is larger than {settings.max_upload_file_megabytes} MB",
        )

    return filename, file_type, content


@router.get("", response_model=list[ModuleRead])
def list_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.Module]:
    return service.list_modules(db, current_user.id)


@router.post(
    "/creations",
    response_model=ModuleCreationRead,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_module_creation(
    background_tasks: BackgroundTasks,
    name: str = Form(min_length=1, max_length=255),
    uploads: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.ModuleCreation:
    exceeds_limit = len(uploads) > settings.max_files_per_upload
    if exceeds_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At most {settings.max_files_per_upload} files per module",
        )

    prepared = [read_upload(upload) for upload in uploads]

    service.reap_stale_creations(db)
    creation = service.create_creation(db, current_user.id)
    background_tasks.add_task(create_module_from_files, creation.id, name, prepared)

    return creation


@router.get("/creations/{creation_id}", response_model=ModuleCreationRead)
def read_module_creation(
    creation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.ModuleCreation:
    return get_owned_creation(db, current_user.id, creation_id)


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
