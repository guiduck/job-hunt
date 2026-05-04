from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.email import EmailDraft, EmailTemplate, TemplateKind
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.email import EmailDraftCreate, EmailDraftUpdate
from app.services.auth_service import ensure_default_local_user
from app.services.email_constants import is_valid_email
from app.services.email_preview_service import render_template_preview
from app.services.resume_service import get_newest_available_resume


def create_draft(db: Session, payload: EmailDraftCreate, user: User | None = None) -> EmailDraft:
    user = user or ensure_default_local_user(db)
    opportunity = db.get(Opportunity, payload.opportunity_id)
    template = db.get(EmailTemplate, payload.template_id)
    if not opportunity or opportunity.user_id != user.id or not opportunity.job_detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    if not template or template.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    resume_id = payload.resume_attachment_id
    if resume_id is None:
        resume = get_newest_available_resume(db, user_id=user.id)
        resume_id = resume.id if resume else None

    recipient = opportunity.job_detail.contact_email or opportunity.job_detail.contact_channel_value
    if not is_valid_email(recipient):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Opportunity has no valid recipient email")

    preview = render_template_preview(db, template, opportunity=opportunity, resume_attachment_id=resume_id)
    warnings = list(preview["warnings"])
    if template.template_kind == TemplateKind.JOB_APPLICATION.value and not resume_id:
        warnings.append("No resume attached for job_application.")

    draft = EmailDraft(
        user_id=user.id,
        opportunity_id=opportunity.id,
        template_id=template.id,
        template_kind=template.template_kind,
        resume_attachment_id=resume_id,
        to_email=recipient,
        subject=str(preview["subject"]),
        body=str(preview["body"]),
        rendered_variables=dict(preview["rendered_variables"]),
        warnings=warnings,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def update_draft(db: Session, draft: EmailDraft, payload: EmailDraftUpdate, user: User | None = None) -> EmailDraft:
    if user and draft.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(draft, field, value)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft
