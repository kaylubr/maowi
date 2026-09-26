from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.config import settings
from server.db.session import get_db
from server.files import models, service
from server.files.parsing import UnsupportedFileTypeError, file_type_from_filename
from server.files.schemas import FileRead, FileStatusRead, FileUpdate
from server.files.tasks import parse_file
from server.users.models import User

router = APIRouter(prefix="/api/files", tags=["files"])


def get_owned_file(db: Session, user_id: int, file_id: int) -> models.File:
    file = service.get_user_file(db, user_id, file_id)
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    return file


@router.post("", response_model=list[FileRead], status_code=status.HTTP_201_CREATED)
def upload_files(
    background_tasks: BackgroundTasks,
    uploads: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.File]:
    exceeds_limit = len(uploads) > settings.max_files_per_upload
    if exceeds_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At most {settings.max_files_per_upload} files per upload",
        )

    prepared: list[tuple[str, str, bytes]] = []
    for upload in uploads:
        filename = upload.filename or "untitled"
        try:
            file_type = file_type_from_filename(filename)
        except UnsupportedFileTypeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {filename}",
            )
        prepared.append((filename, file_type, upload.file.read()))

    files = service.create_files(
        db,
        current_user.id,
        [(filename, file_type) for filename, file_type, _ in prepared],
    )

    for file, (_, _, content) in zip(files, prepared):
        background_tasks.add_task(parse_file, file.id, content)

    return files


@router.get("/{file_id}/status", response_model=FileStatusRead)
def read_file_status(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.File:
    return get_owned_file(db, current_user.id, file_id)


@router.patch("/{file_id}", response_model=FileRead)
def update_file(
    file_id: int,
    payload: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.File:
    file = get_owned_file(db, current_user.id, file_id)
    return service.set_file_module(db, file, payload.module_id)
