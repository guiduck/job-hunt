from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.email import BulkBatchStatus, BulkSendBatch
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.email import BulkPreviewRequest, EmailDraftCreate
from app.services.auth_service import ensure_default_local_user
from app.services.email_constants import is_valid_email
from app.services.email_draft_service import create_draft
from app.services.email_send_service import approve_draft_send, has_successful_job_application


def preview_bulk_send(db: Session, payload: BulkPreviewRequest, user: User | None = None) -> BulkSendBatch:
    user = user or ensure_default_local_user(db)
    items: list[dict[str, object]] = []
    counts = {
        "sendable_count": 0,
        "skipped_missing_contact_count": 0,
        "skipped_duplicate_count": 0,
        "blocked_invalid_contact_count": 0,
        "limit_blocked_count": 0,
    }
    for opportunity_id in payload.opportunity_ids:
        opportunity = db.get(Opportunity, opportunity_id)
        email = None
        if opportunity and opportunity.user_id != user.id:
            opportunity = None
        if opportunity and opportunity.job_detail:
            email = opportunity.job_detail.contact_email or opportunity.job_detail.contact_channel_value
        if not email:
            outcome = "skipped_missing_contact"
            reason = "Missing recipient email."
            counts["skipped_missing_contact_count"] += 1
        elif has_successful_job_application(db, opportunity_id, user_id=user.id):
            outcome = "skipped_duplicate"
            reason = "A job_application send already succeeded."
            counts["skipped_duplicate_count"] += 1
        elif not is_valid_email(email):
            outcome = "blocked_invalid_contact"
            reason = "Recipient email is invalid."
            counts["blocked_invalid_contact_count"] += 1
        else:
            outcome = "sendable"
            reason = None
            counts["sendable_count"] += 1
        items.append({"opportunity_id": opportunity_id, "recipient_email": email, "outcome": outcome, "reason": reason, "draft_id": None})

    batch = BulkSendBatch(
        user_id=user.id,
        template_id=payload.template_id,
        resume_attachment_id=payload.resume_attachment_id,
        selected_count=len(payload.opportunity_ids),
        items=items,
        status=BulkBatchStatus.PREVIEWED.value,
        **counts,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def approve_bulk_send(db: Session, batch_id: str, user: User | None = None) -> BulkSendBatch:
    user = user or ensure_default_local_user(db)
    batch = db.get(BulkSendBatch, batch_id)
    if not batch or batch.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk batch not found")

    updated_items: list[dict[str, object]] = []
    for item in batch.items:
        if item.get("outcome") != "sendable":
            updated_items.append(item)
            continue
        draft = create_draft(
            db,
            EmailDraftCreate(
                opportunity_id=str(item["opportunity_id"]),
                template_id=batch.template_id,
                resume_attachment_id=batch.resume_attachment_id,
            ),
            user=user,
        )
        request = approve_draft_send(db, draft, user=user)
        request.bulk_batch_id = batch.id
        db.add(request)
        updated_items.append({**item, "draft_id": draft.id, "send_request_id": request.id})

    batch.items = updated_items
    batch.status = BulkBatchStatus.APPROVED.value
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch
