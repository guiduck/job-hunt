from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.email import ProviderAuthStatus, SendingProviderAccount
from app.models.user import User
from app.services.auth_service import ensure_default_local_user


def get_provider_account_status(db: Session, user: User | None = None) -> SendingProviderAccount:
    user = user or ensure_default_local_user(db)
    settings = get_settings()
    account = (
        db.query(SendingProviderAccount)
        .filter(SendingProviderAccount.user_id == user.id, SendingProviderAccount.provider_name == "gmail")
        .one_or_none()
    )
    if not account:
        account = SendingProviderAccount(user_id=user.id, provider_name="gmail")
        db.add(account)

    if settings.email_provider != "gmail":
        account.auth_status = ProviderAuthStatus.NOT_CONFIGURED.value
        db.commit()
        db.refresh(account)
        return account

    client_secret_exists = bool(settings.gmail_oauth_client_config_json) or (
        bool(settings.gmail_oauth_client_secrets_file) and Path(settings.gmail_oauth_client_secrets_file).exists()
    )
    token_exists = bool(account.token_json) or (
        bool(settings.gmail_oauth_token_file) and Path(settings.gmail_oauth_token_file).exists()
    )
    if not client_secret_exists:
        account.auth_status = ProviderAuthStatus.NOT_CONFIGURED.value
    elif not token_exists:
        account.auth_status = ProviderAuthStatus.AUTHORIZATION_REQUIRED.value
    elif account.auth_status not in {ProviderAuthStatus.FAILED.value, ProviderAuthStatus.EXPIRED.value}:
        account.auth_status = ProviderAuthStatus.AUTHORIZED.value
    db.commit()
    db.refresh(account)
    return account
