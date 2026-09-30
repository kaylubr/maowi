from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from server.auth import google, service
from server.auth.schemas import GoogleLoginRequest, LoginRequest, RegisterRequest
from server.auth.security import clear_auth_cookie, create_access_token, set_auth_cookie
from server.db.session import get_db
from server.users.models import User
from server.users.schemas import UserRead

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register", response_model=UserRead, status_code=status.HTTP_201_CREATED
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    try:
        return service.register_user(
            db, payload.email, payload.password, payload.username
        )
    except service.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )


@router.post("/login", response_model=UserRead)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    user = service.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    set_auth_cookie(response, create_access_token(user.id))
    return user


@router.post("/google", response_model=UserRead)
def google_login(
    payload: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    try:
        identity = google.verify_google_id_token(payload.credential)
    except google.InvalidGoogleCredentialError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )

    try:
        user = service.authenticate_with_google(db, identity)
    except service.GoogleEmailNotVerifiedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google email not verified",
        )

    set_auth_cookie(response, create_access_token(user.id))
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    clear_auth_cookie(response)
