import logging

from sqlalchemy import update

from server.db import session as db_session_module
from server.modules.models import Module, ModuleCreation, ModuleCreationStatus
from server.modules.parsing import extract_text
from server.questions import generation
from server.questions import service as questions_service

logger = logging.getLogger(__name__)

GENERATION_ATTEMPTS = 3
INTERRUPTED_MESSAGE = "Module creation was interrupted by a server restart"
EMPTY_RESULT_MESSAGE = "The AI did not return any usable questions"

Upload = tuple[str, str, bytes]


def create_module_from_files(
    creation_id: int,
    name: str,
    uploads: list[Upload],
) -> None:
    with db_session_module.SessionLocal() as db:
        creation = db.get(ModuleCreation, creation_id)
        if creation is None:
            return

        try:
            material = parse_uploads(uploads)
        except UploadParsingError as error:
            fail_creation(db, creation, str(error))
            return

        generated, error_message = generate_with_retries(material)
        if not generated:
            fail_creation(db, creation, error_message or EMPTY_RESULT_MESSAGE)
            return

        module = Module(user_id=creation.user_id, name=name)
        db.add(module)
        db.flush()

        creation.status = ModuleCreationStatus.ready
        creation.error_message = None
        creation.module_id = module.id

        questions_service.create_questions(db, module, generated)


class UploadParsingError(Exception):
    pass


def parse_uploads(uploads: list[Upload]) -> str:
    texts: list[str] = []
    for filename, file_type, content in uploads:
        try:
            texts.append(extract_text(content, file_type))
        except Exception as error:
            raise UploadParsingError(f"Could not read {filename}: {error}") from error
    return "\n\n".join(texts)


def generate_with_retries(material: str) -> tuple[list[dict], str | None]:
    last_error: str | None = None
    for attempt in range(GENERATION_ATTEMPTS):
        try:
            generated = generation.generate_questions(material)
        except Exception as error:
            last_error = str(error)
            logger.exception("Question generation attempt %s failed", attempt + 1)
            continue
        if generated:
            return generated, None
        return [], EMPTY_RESULT_MESSAGE
    return [], last_error or EMPTY_RESULT_MESSAGE


def fail_creation(db, creation: ModuleCreation, message: str) -> None:
    creation.status = ModuleCreationStatus.error
    creation.error_message = message
    db.commit()


def sweep_orphaned_creations() -> None:
    with db_session_module.SessionLocal() as db:
        db.execute(
            update(ModuleCreation)
            .where(ModuleCreation.status == ModuleCreationStatus.generating)
            .values(
                status=ModuleCreationStatus.error,
                error_message=INTERRUPTED_MESSAGE,
            )
        )
        db.commit()
