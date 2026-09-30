import re

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.users.models import OAuthAccount, User

USERNAME_PATTERN = re.compile(r"^[a-z0-9_]+$")
USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 30
INVALID_USERNAME_DETAIL = (
    "Username must be 3-30 characters using letters, numbers and underscores"
)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_username(username: str) -> str:
    return username.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(
    db: Session,
    email: str,
    password_hash: str | None,
    username: str | None,
) -> User:
    user = User(
        email=normalize_email(email),
        password_hash=password_hash,
        username=username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def username_is_valid(username: str) -> bool:
    has_valid_length = USERNAME_MIN_LENGTH <= len(username) <= USERNAME_MAX_LENGTH
    return has_valid_length and USERNAME_PATTERN.fullmatch(username) is not None


def username_is_taken(
    db: Session, username: str, excluding_user: User | None
) -> bool:
    statement = select(User).where(User.username == username)
    if excluding_user is not None:
        statement = statement.where(User.id != excluding_user.id)
    return db.scalar(statement) is not None


def validate_username(
    db: Session,
    raw_username: str,
    excluding_user: User | None = None,
) -> str:
    username = normalize_username(raw_username)
    if not username_is_valid(username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=INVALID_USERNAME_DETAIL,
        )
    if username_is_taken(db, username, excluding_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    return username


def update_username(db: Session, user: User, raw_username: str) -> User:
    user.username = validate_username(db, raw_username, excluding_user=user)
    db.commit()
    db.refresh(user)
    return user


def update_avatar_url(db: Session, user: User, avatar_url: str | None) -> User:
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return user


def get_oauth_account(
    db: Session, provider: str, provider_account_id: str
) -> OAuthAccount | None:
    return db.scalar(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == provider_account_id,
        )
    )


def link_oauth_account(
    db: Session, user: User, provider: str, provider_account_id: str
) -> OAuthAccount:
    account = OAuthAccount(
        user_id=user.id,
        provider=provider,
        provider_account_id=provider_account_id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account
