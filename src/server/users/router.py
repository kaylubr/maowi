from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.auth.dependencies import get_current_user
from server.db.session import get_db
from server.users import service
from server.users.models import User
from server.users.schemas import UserRead, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
def update_current_user(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return service.update_username(db, current_user, payload.username)
