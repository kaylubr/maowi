from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.dashboard import service
from server.dashboard.schemas import DashboardSummaryRead
from server.db.session import get_db
from server.users.models import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryRead)
def read_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummaryRead:
    return service.get_summary(db, current_user.id)
