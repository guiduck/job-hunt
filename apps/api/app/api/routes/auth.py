from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import bearer_token, current_user
from app.api.errors import bad_request, conflict, unauthorized
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthSessionResponse,
    LoginRequest,
    PasswordResetAccepted,
    PasswordResetConfirmRequest,
    PasswordResetRequestIn,
    RegisterRequest,
    UserPublic,
)
from app.services.auth_service import authenticate_user, create_user, get_user_by_email
from app.services.auth_session_service import create_session, revoke_session
from app.services.password_reset_service import consume_password_reset, request_password_reset

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthSessionResponse:
    if get_user_by_email(db, payload.email):
        raise conflict("Email is already registered")

    user = create_user(db, email=str(payload.email), password=payload.password, display_name=payload.display_name)
    _, token = create_session(db, user)
    return AuthSessionResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post("/login", response_model=AuthSessionResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthSessionResponse:
    user = authenticate_user(db, email=str(payload.email), password=payload.password)
    if not user:
        raise unauthorized("Invalid email or password")

    _, token = create_session(db, user)
    return AuthSessionResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(token: str = Depends(bearer_token), db: Session = Depends(get_db)) -> Response:
    revoke_session(db, token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(current_user)) -> UserPublic:
    return UserPublic.model_validate(user)


@router.post("/password-reset/request", response_model=PasswordResetAccepted)
def password_reset_request(payload: PasswordResetRequestIn, db: Session = Depends(get_db)) -> PasswordResetAccepted:
    request_password_reset(db, str(payload.email))
    return PasswordResetAccepted()


@router.post("/password-reset/confirm", response_model=UserPublic)
def password_reset_confirm(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)) -> UserPublic:
    user = consume_password_reset(db, payload.token, payload.password)
    if not user:
        raise bad_request("Invalid or expired password reset token")
    return UserPublic.model_validate(user)
