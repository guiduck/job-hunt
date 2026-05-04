from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.db.session import get_db
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.email import EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate, RenderedPreview, TemplatePreviewRequest
from app.services.email_preview_service import render_template_preview
from app.services.email_template_service import create_template, get_template, list_templates, update_template

router = APIRouter(prefix="/email-templates", tags=["email-templates"])


@router.get("", response_model=list[EmailTemplate])
def list_email_templates(
    mode: str = Query(default="full_time"),
    template_kind: str | None = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[EmailTemplate]:
    return list_templates(db, mode=mode, template_kind=template_kind, active_only=active_only, user=user)


@router.post("", response_model=EmailTemplate, status_code=status.HTTP_201_CREATED)
def create_email_template(
    payload: EmailTemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> EmailTemplate:
    try:
        return create_template(db, payload, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.patch("/{template_id}", response_model=EmailTemplate)
def update_email_template(
    template_id: str,
    payload: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> EmailTemplate:
    template = get_template(db, template_id, user=user)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return update_template(db, template, payload, user=user)


@router.post("/{template_id}/preview", response_model=RenderedPreview)
def preview_email_template(
    template_id: str,
    payload: TemplatePreviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, object]:
    template = get_template(db, template_id, user=user)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    opportunity = db.get(Opportunity, payload.opportunity_id) if payload.opportunity_id else None
    if opportunity and opportunity.user_id != user.id:
        opportunity = None
    return render_template_preview(
        db,
        template,
        opportunity=opportunity,
        resume_attachment_id=payload.resume_attachment_id,
        sample_values=payload.sample_values,
    )
