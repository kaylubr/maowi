from fastapi import APIRouter, Depends

from server.auth.dependencies import get_current_user
from server.users.models import User
from server.users.schemas import UserRead

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
