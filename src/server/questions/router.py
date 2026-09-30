from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.members import service as members_service
from server.questions import service
from server.questions.schemas import QuestionMode, QuestionRead
from server.users.models import User

router = APIRouter(prefix="/api/modules", tags=["questions"])


@router.get("/{module_id}/questions", response_model=list[QuestionRead])
def list_questions(
    module_id: int,
    mode: QuestionMode,
    count: int | None = Query(default=None, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    module = members_service.get_accessible_module(db, current_user.id, module_id)
    questions = service.list_module_questions(db, module.id, count)
    return [service.serialize_question(question, mode) for question in questions]
