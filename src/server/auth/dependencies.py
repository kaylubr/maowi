from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from server.auth.security import COOKIE_NAME, decode_access_token
from server.db.session import get_db
from server.users.models import User
from server.users.service import get_user_by_id


def not_authenticated() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if token is None:
        raise not_authenticated()

    user_id = decode_access_token(token)
    if user_id is None:
        raise not_authenticated()

    user = get_user_by_id(db, user_id)
    if user is None:
        raise not_authenticated()

    return user
