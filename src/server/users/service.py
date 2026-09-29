from sqlalchemy import select
from sqlalchemy.orm import Session

from server.users.models import OAuthAccount, User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(
    db: Session, email: str, password_hash: str | None
) -> User:
    user = User(email=normalize_email(email), password_hash=password_hash)
    db.add(user)
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
