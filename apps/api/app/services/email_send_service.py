from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.email import EmailDraft, OutreachEvent, SendRequest, SendRequestStatus, TemplateKind
from app.models.opportunity import JobStage, Opportunity
from app.models.user import User


def has_successful_job_application(db: Session, opportunity_id: str, user_id: str | None = None) -> bool:
    conditions = [
        SendRequest.opportunity_id == opportunity_id,
        SendRequest.template_kind == TemplateKind.JOB_APPLICATION.value,
        SendRequest.status == SendRequestStatus.SENT.value,
    ]
    if user_id:
        conditions.append(SendRequest.user_id == user_id)
    return bool(
        db.scalar(
            select(SendRequest.id).where(*conditions)
        )
    )


def approve_draft_send(db: Session, draft: EmailDraft, user: User | None = None, *, allow_duplicate: bool = False) -> SendRequest:
    if user and draft.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    if not allow_duplicate and draft.template_kind == TemplateKind.JOB_APPLICATION.value and has_successful_job_application(
        db,
        draft.opportunity_id,
        user_id=draft.user_id,
    ):
        event = OutreachEvent(
            user_id=draft.user_id,
            opportunity_id=draft.opportunity_id,
            draft_id=draft.id,
            recipient_email=draft.to_email,
            template_id=draft.template_id,
            template_kind=draft.template_kind,
            resume_attachment_id=draft.resume_attachment_id,
            subject=draft.subject,
            event_type=SendRequestStatus.SKIPPED_DUPLICATE.value,
            status=SendRequestStatus.SKIPPED_DUPLICATE.value,
            error_message="A job application email was already sent successfully for this opportunity.",
        )
        db.add(event)
        db.commit()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate job_application send blocked")

    send_request = SendRequest(
        user_id=draft.user_id,
        draft_id=draft.id,
        opportunity_id=draft.opportunity_id,
        template_id=draft.template_id,
        template_kind=draft.template_kind,
        resume_attachment_id=draft.resume_attachment_id,
        recipient_email=draft.to_email,
        subject_snapshot=draft.subject,
        body_snapshot=draft.body,
        resume_snapshot={},
        status=SendRequestStatus.APPROVED.value,
        approved_at=datetime.now(UTC),
    )
    draft.status = "approved"
    db.add(send_request)
    db.flush()
    event = OutreachEvent(
        user_id=draft.user_id,
        opportunity_id=draft.opportunity_id,
        draft_id=draft.id,
        send_request_id=send_request.id,
        recipient_email=draft.to_email,
        template_id=draft.template_id,
        template_kind=draft.template_kind,
        resume_attachment_id=draft.resume_attachment_id,
        subject=draft.subject,
        event_type="queued",
        status=SendRequestStatus.APPROVED.value,
        payload={"approved_in_api": True},
    )
    db.add_all([draft, event])
    db.commit()
    db.refresh(send_request)
    return send_request


def record_send_success(db: Session, send_request: SendRequest, provider_message_id: str | None = None) -> SendRequest:
    send_request.status = SendRequestStatus.SENT.value
    send_request.sent_at = datetime.now(UTC)
    send_request.provider_message_id = provider_message_id
    opportunity = db.get(Opportunity, send_request.opportunity_id)
    if opportunity and opportunity.job_detail and send_request.template_kind == TemplateKind.JOB_APPLICATION.value:
        opportunity.job_detail.job_stage = JobStage.APPLIED.value
    db.add(
        OutreachEvent(
            opportunity_id=send_request.opportunity_id,
            user_id=send_request.user_id,
            draft_id=send_request.draft_id,
            send_request_id=send_request.id,
            recipient_email=send_request.recipient_email,
            provider_name="gmail",
            provider_message_id=provider_message_id,
            template_id=send_request.template_id,
            template_kind=send_request.template_kind,
            resume_attachment_id=send_request.resume_attachment_id,
            subject=send_request.subject_snapshot,
            event_type="sent",
            status=SendRequestStatus.SENT.value,
        )
    )
    db.commit()
    db.refresh(send_request)
    return send_request


def record_send_failure(db: Session, send_request: SendRequest, error_code: str, error_message: str) -> SendRequest:
    send_request.status = SendRequestStatus.FAILED.value
    send_request.failed_at = datetime.now(UTC)
    send_request.error_code = error_code
    send_request.error_message = error_message
    db.add(
        OutreachEvent(
            opportunity_id=send_request.opportunity_id,
            user_id=send_request.user_id,
            draft_id=send_request.draft_id,
            send_request_id=send_request.id,
            recipient_email=send_request.recipient_email,
            provider_name="gmail",
            template_id=send_request.template_id,
            template_kind=send_request.template_kind,
            resume_attachment_id=send_request.resume_attachment_id,
            subject=send_request.subject_snapshot,
            event_type="failed",
            status=SendRequestStatus.FAILED.value,
            error_code=error_code,
            error_message=error_message,
        )
    )
    db.commit()
    db.refresh(send_request)
    return send_request
