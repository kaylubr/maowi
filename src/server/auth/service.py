from sqlalchemy.orm import Session

from server.auth.security import hash_password, verify_password
from server.users.models import User
from server.users.service import create_user, get_user_by_email


class EmailAlreadyRegisteredError(Exception):
    pass


def register_user(db: Session, email: str, password: str) -> User:
    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(email)
    return create_user(db, email, hash_password(password))


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
