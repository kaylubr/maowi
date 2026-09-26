from server.db import session
from server.files.models import File, FileStatus
from server.files.parsing import extract_text


def parse_file(file_id: int, content: bytes) -> None:
    with session.SessionLocal() as db:
        file = db.get(File, file_id)
        if file is None:
            return

        file.status = FileStatus.parsing
        db.commit()

        try:
            parsed_text = extract_text(content, file.file_type)
        except Exception as error:
            file.status = FileStatus.failed
            file.error_message = str(error)
        else:
            file.parsed_text = parsed_text
            file.status = FileStatus.parsed

        db.commit()
