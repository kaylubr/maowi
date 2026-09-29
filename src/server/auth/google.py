from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from server.config import settings


class InvalidGoogleCredentialError(Exception):
    pass


@dataclass(frozen=True)
class GoogleIdentity:
    subject: str
    email: str
    email_verified: bool


def verify_google_id_token(credential: str) -> GoogleIdentity:
    try:
        claims = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as error:
        raise InvalidGoogleCredentialError() from error

    return GoogleIdentity(
        subject=claims["sub"],
        email=claims["email"],
        email_verified=bool(claims.get("email_verified")),
    )
