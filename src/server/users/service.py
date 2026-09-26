from sqlalchemy import select
from sqlalchemy.orm import Session

from server.users.models import User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, email: str, password_hash: str) -> User:
    user = User(email=normalize_email(email), password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
