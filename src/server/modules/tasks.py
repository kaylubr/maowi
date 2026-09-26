import logging

from server.db import session as db_session_module
from server.files.models import File, FileStatus
from server.modules import clustering, service

logger = logging.getLogger(__name__)


def assign_files_to_modules(user_id: int, file_ids: list[int]) -> None:
    with db_session_module.SessionLocal() as db:
        files = [
            file
            for file in (db.get(File, file_id) for file_id in file_ids)
            if file is not None and file.status == FileStatus.parsed
        ]
        if not files:
            return

        existing_modules = service.list_modules(db, user_id)
        try:
            assignments = clustering.cluster_files(existing_modules, files)
        except Exception:
            logger.exception("Clustering failed for user %s", user_id)
            return

        service.apply_assignments(db, user_id, assignments)
