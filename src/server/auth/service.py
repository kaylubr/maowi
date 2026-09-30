from sqlalchemy.orm import Session

from server.auth.google import GoogleIdentity
from server.auth.security import hash_password, verify_password
from server.users.models import User
from server.users.service import (
    create_user,
    get_oauth_account,
    get_user_by_email,
    get_user_by_id,
    link_oauth_account,
    update_avatar_url,
    validate_username,
)

GOOGLE_PROVIDER = "google"


class EmailAlreadyRegisteredError(Exception):
    pass


class GoogleEmailNotVerifiedError(Exception):
    pass


def register_user(db: Session, email: str, password: str, username: str) -> User:
    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(email)
    normalized_username = validate_username(db, username)
    return create_user(db, email, hash_password(password), normalized_username)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if user.password_hash is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def authenticate_with_google(db: Session, identity: GoogleIdentity) -> User:
    if not identity.email_verified:
        raise GoogleEmailNotVerifiedError()

    account = get_oauth_account(db, GOOGLE_PROVIDER, identity.subject)
    if account is not None:
        user = get_user_by_id(db, account.user_id)
    else:
        user = get_user_by_email(db, identity.email)
        if user is None:
            user = create_user(db, identity.email, None, None)
        link_oauth_account(db, user, GOOGLE_PROVIDER, identity.subject)

    return update_avatar_url(db, user, identity.picture)
