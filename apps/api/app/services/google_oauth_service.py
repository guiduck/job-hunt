from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.email import ProviderAuthStatus, SendingProviderAccount
from app.models.user import User
from app.services.auth_service import ensure_default_local_user

logger = logging.getLogger(__name__)


def build_google_oauth_url(user: User | None = None) -> str:
    settings = get_settings()
    if not _has_client_config(settings):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Configure GMAIL_OAUTH_CLIENT_CONFIG_JSON or GMAIL_OAUTH_CLIENT_SECRETS_FILE before connecting Google.",
        )

    flow = _build_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=user.id if user else None,
    )
    return auth_url


def complete_google_oauth(db: Session, code: str, user_id: str | None = None) -> SendingProviderAccount:
    flow = _build_flow()
    try:
        flow.fetch_token(code=code)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google OAuth authorization failed. Start the connection from Opportunity Desk again and complete it in the same browser session.",
        ) from exc
    credentials = flow.credentials
    token_json = json.loads(credentials.to_json())

    user = db.get(User, user_id) if user_id else ensure_default_local_user(db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google OAuth user state is invalid. Please log in again.")
    profile = _get_gmail_profile_or_fallback(credentials, user.email)
    account = (
        db.query(SendingProviderAccount)
        .filter(SendingProviderAccount.user_id == user.id, SendingProviderAccount.provider_name == "gmail")
        .one_or_none()
    )
    if not account:
        account = SendingProviderAccount(user_id=user.id, provider_name="gmail")
        db.add(account)

    account.auth_status = ProviderAuthStatus.AUTHORIZED.value
    account.display_email = profile.get("emailAddress")
    account.display_name = profile.get("emailAddress")
    account.token_json = token_json
    account.token_updated_at = datetime.now(UTC)
    account.last_checked_at = datetime.now(UTC)
    db.commit()
    db.refresh(account)
    return account


def disconnect_google_oauth(db: Session, user: User | None = None) -> SendingProviderAccount:
    user = user or ensure_default_local_user(db)
    account = (
        db.query(SendingProviderAccount)
        .filter(SendingProviderAccount.user_id == user.id, SendingProviderAccount.provider_name == "gmail")
        .one_or_none()
    )
    if not account:
        account = SendingProviderAccount(user_id=user.id, provider_name="gmail")
        db.add(account)
    account.auth_status = ProviderAuthStatus.AUTHORIZATION_REQUIRED.value
    account.token_json = None
    account.token_updated_at = None
    account.display_email = None
    account.display_name = None
    db.commit()
    db.refresh(account)
    return account


def _build_flow():
    from google_auth_oauthlib.flow import Flow

    settings = get_settings()
    scopes = [scope.strip() for scope in settings.gmail_oauth_scopes.split(",") if scope.strip()]
    if settings.gmail_oauth_client_config_json:
        return Flow.from_client_config(
            json.loads(settings.gmail_oauth_client_config_json),
            scopes=scopes,
            redirect_uri=settings.gmail_oauth_redirect_uri,
            autogenerate_code_verifier=False,
        )
    return Flow.from_client_secrets_file(
        settings.gmail_oauth_client_secrets_file,
        scopes=scopes,
        redirect_uri=settings.gmail_oauth_redirect_uri,
        autogenerate_code_verifier=False,
    )


def _has_client_config(settings) -> bool:
    if settings.gmail_oauth_client_config_json:
        return True
    return bool(settings.gmail_oauth_client_secrets_file) and Path(settings.gmail_oauth_client_secrets_file).exists()


def _get_gmail_profile(credentials) -> dict[str, str]:
    from googleapiclient.discovery import build

    service = build("gmail", "v1", credentials=credentials)
    return service.users().getProfile(userId="me").execute()


def _get_gmail_profile_or_fallback(credentials, fallback_email: str) -> dict[str, str]:
    try:
        return _get_gmail_profile(credentials)
    except Exception as exc:
        logger.warning("Could not fetch Gmail profile after OAuth; using current user email as display email: %s", exc)
        return {"emailAddress": fallback_email}
