from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.opportunity import OpportunityType, new_id
from app.models.user import DEFAULT_LOCAL_USER_ID


class JobSearchPreference(Base):
    __tablename__ = "job_search_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_type", name="uq_job_search_preferences_user_opportunity_type"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    opportunity_type: Mapped[str] = mapped_column(String(50), default=OpportunityType.JOB.value, nullable=False)
    last_search_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    last_search_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
