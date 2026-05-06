from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.user import DEFAULT_LOCAL_USER_ID


def new_id() -> str:
    return str(uuid4())


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    operator_name: Mapped[str | None] = mapped_column(String(255))
    operator_email: Mapped[str | None] = mapped_column(String(320))
    portfolio_url: Mapped[str | None] = mapped_column(String(2048))
    default_mode: Mapped[str] = mapped_column(String(50), default="full_time", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
