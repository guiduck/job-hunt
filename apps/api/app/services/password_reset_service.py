from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import PasswordResetRequest
from app.services.auth_service import get_user_by_email
from app.services.password_service import hash_password
from app.services.session_token_service import generate_token, hash_token


def request_password_reset(db: Session, email: str) -> str | None:
    user = get_user_by_email(db, email)
    if not user:
        return None

    token = generate_token()
    now = datetime.utcnow()
    reset_request = PasswordResetRequest(
        user_id=user.id,
        token_hash=hash_token(token),
        requested_email=email.strip().lower(),
        expires_at=now + timedelta(minutes=get_settings().password_reset_token_ttl_minutes),
    )
    db.add(reset_request)
    db.commit()
    return token


def consume_password_reset(db: Session, token: str, new_password: str):
    now = datetime.utcnow()
    reset_request = (
        db.query(PasswordResetRequest)
        .filter(PasswordResetRequest.token_hash == hash_token(token))
        .one_or_none()
    )
    if not reset_request or reset_request.used_at is not None or reset_request.expires_at <= now:
        return None

    reset_request.user.password_hash = hash_password(new_password)
    reset_request.used_at = now
    db.commit()
    db.refresh(reset_request.user)
    return reset_request.user
