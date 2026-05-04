from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.email import OutreachEvent
from app.models.user import User


def list_opportunity_email_history(db: Session, opportunity_id: str, user: User | None = None) -> list[OutreachEvent]:
    conditions = [OutreachEvent.opportunity_id == opportunity_id]
    if user:
        conditions.append(OutreachEvent.user_id == user.id)
    return list(
        db.scalars(
            select(OutreachEvent)
            .where(*conditions)
            .order_by(OutreachEvent.occurred_at.desc())
        ).all()
    )
