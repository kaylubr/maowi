from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.modules import service as modules_service
from server.modules.models import Module
from server.questions import service
from server.questions.schemas import QuestionMode, QuestionRead
from server.users.models import User

router = APIRouter(prefix="/api/modules", tags=["questions"])


def get_owned_module(db: Session, user_id: int, module_id: int) -> Module:
    module = modules_service.get_user_module(db, user_id, module_id)
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return module


@router.get("/{module_id}/questions", response_model=list[QuestionRead])
def list_questions(
    module_id: int,
    mode: QuestionMode,
    count: int | None = Query(default=None, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    module = get_owned_module(db, current_user.id, module_id)
    questions = service.list_module_questions(db, module.id, count)
    return [service.serialize_question(question, mode) for question in questions]
