from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_settings import UserSettings
from app.models.user import User
from app.schemas.user_settings import UserSettingsUpdate
from app.services.auth_service import ensure_default_local_user


def get_or_create_user_settings(db: Session, user: User | None = None) -> UserSettings:
    user = user or ensure_default_local_user(db)
    settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user.id).order_by(UserSettings.created_at.asc()))
    if settings:
        return settings
    settings = UserSettings(user_id=user.id, default_mode="full_time")
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_user_settings(db: Session, payload: UserSettingsUpdate, user: User | None = None) -> UserSettings:
    settings = get_or_create_user_settings(db, user=user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
