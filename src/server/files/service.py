from sqlalchemy import select
from sqlalchemy.orm import Session

from server.files.models import File, FileStatus


def create_files(
    db: Session,
    user_id: int,
    uploads: list[tuple[str, str]],
) -> list[File]:
    files = [
        File(
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            status=FileStatus.uploaded,
        )
        for filename, file_type in uploads
    ]
    db.add_all(files)
    db.commit()
    for file in files:
        db.refresh(file)
    return files


def get_user_file(db: Session, user_id: int, file_id: int) -> File | None:
    return db.scalar(
        select(File).where(File.id == file_id, File.user_id == user_id)
    )


def set_file_module(db: Session, file: File, module_id: int | None) -> File:
    file.module_id = module_id
    db.commit()
    db.refresh(file)
    return file
