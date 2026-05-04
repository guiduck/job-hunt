from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import User
from app.services.password_service import hash_password, verify_password


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == normalize_email(email)).one_or_none()


def create_user(db: Session, *, email: str, password: str, display_name: str) -> User:
    user = User(
        email=normalize_email(email),
        password_hash=hash_password(password),
        display_name=display_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def ensure_default_local_user(db: Session) -> User:
    settings = get_settings()
    existing = get_user_by_email(db, settings.default_local_user_email)
    if existing:
        return existing

    # The default user is only for local data backfill/seed compatibility.
    return create_user(
        db,
        email=settings.default_local_user_email,
        password="LocalPassword123!",
        display_name=settings.default_local_user_display_name,
    )
