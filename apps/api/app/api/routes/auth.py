import json
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import bearer_token, current_user
from app.core.config import get_settings
from app.api.errors import bad_request, conflict, unauthorized
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthSessionResponse,
    GooglePrimaryAuthStartResponse,
    LoginRequest,
    PasswordResetAccepted,
    PasswordResetConfirmRequest,
    PasswordResetRequestIn,
    RegisterRequest,
    UserPublic,
)
from app.services.auth_service import authenticate_user, create_user, get_user_by_email
from app.services.auth_session_service import create_session, revoke_session
from app.services.google_primary_auth_service import (
    build_google_primary_auth_url,
    complete_google_primary_auth,
    google_auth_success_redirect_from_state,
)
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


@router.get("/google/start", response_model=GooglePrimaryAuthStartResponse)
def google_auth_start(success_redirect_url: str | None = Query(default=None)) -> GooglePrimaryAuthStartResponse:
    return GooglePrimaryAuthStartResponse(auth_url=build_google_primary_auth_url(success_redirect_url=success_redirect_url))


@router.get("/google/callback", response_model=AuthSessionResponse)
def google_auth_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> AuthSessionResponse | RedirectResponse:
    success_url = google_auth_success_redirect_from_state(state) or get_settings().google_auth_success_redirect_url
    if error:
        return _google_auth_error_response(success_url, f"Google sign-in was not completed: {error}")
    if not code:
        return _google_auth_error_response(success_url, "Google sign-in did not return an authorization code.")
    try:
        user, token = complete_google_primary_auth(db, code)
    except HTTPException as exc:
        return _google_auth_error_response(success_url, str(exc.detail), status_code=exc.status_code)
    session = AuthSessionResponse(access_token=token, user=UserPublic.model_validate(user))
    if success_url and not success_url.rstrip("/").endswith("/health"):
        fragment = urlencode(
            {
                "access_token": session.access_token,
                "token_type": session.token_type,
                "user": json.dumps(session.user.model_dump(mode="json")),
            }
        )
        return RedirectResponse(f"{success_url}#{fragment}")
    return session


def _google_auth_error_response(success_url: str | None, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> RedirectResponse:
    if success_url and not success_url.rstrip("/").endswith("/health"):
        return RedirectResponse(f"{success_url}#{urlencode({'error': message})}")
    raise HTTPException(status_code=status_code, detail=message)


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
