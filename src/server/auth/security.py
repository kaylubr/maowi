from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Response
from passlib.context import CryptContext

from server.config import settings

ALGORITHM = "HS256"
COOKIE_NAME = "access_token"

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_context.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expire_minutes
    )
    claims = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(claims, settings.jwt_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int | None:
    try:
        claims = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None

    subject = claims.get("sub")
    if subject is None:
        return None

    try:
        return int(subject)
    except ValueError:
        return None


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.jwt_expire_minutes * 60,
        httponly=True,
        samesite="strict",
        secure=settings.cookie_secure,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        samesite="strict",
        secure=settings.cookie_secure,
        path="/",
    )
