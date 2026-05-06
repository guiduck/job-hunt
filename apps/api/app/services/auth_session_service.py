from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import AuthSession, User
from app.services.session_token_service import generate_token, hash_token


def utc_now() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def create_session(db: Session, user: User) -> tuple[AuthSession, str]:
    token = generate_token()
    now = utc_now()
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_token(token),
        last_used_at=now,
        expires_at=now + timedelta(hours=get_settings().auth_session_ttl_hours),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session, token


def get_session_user(db: Session, token: str) -> User | None:
    now = utc_now()
    session = db.query(AuthSession).filter(AuthSession.token_hash == hash_token(token)).one_or_none()
    if not session or session.revoked_at is not None or as_utc(session.expires_at) <= now:
        return None
    session.last_used_at = now
    db.commit()
    return session.user


def revoke_session(db: Session, token: str) -> None:
    session = db.query(AuthSession).filter(AuthSession.token_hash == hash_token(token)).one_or_none()
    if not session or session.revoked_at is not None:
        return
    session.revoked_at = utc_now()
    db.commit()
