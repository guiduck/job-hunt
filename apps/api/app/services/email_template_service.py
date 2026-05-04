from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.email import EmailTemplate
from app.models.user import User
from app.schemas.email import EmailTemplateCreate, EmailTemplateUpdate
from app.services.auth_service import ensure_default_local_user
from app.services.email_constants import FULL_TIME_MODE, SUPPORTED_TEMPLATE_KINDS


def list_templates(
    db: Session,
    *,
    mode: str = FULL_TIME_MODE,
    template_kind: str | None = None,
    active_only: bool = False,
    user: User | None = None,
) -> list[EmailTemplate]:
    user = user or ensure_default_local_user(db)
    query = select(EmailTemplate).where(EmailTemplate.user_id == user.id, EmailTemplate.mode == mode)
    if template_kind:
        query = query.where(EmailTemplate.template_kind == template_kind)
    if active_only:
        query = query.where(EmailTemplate.is_active.is_(True))
    return list(db.scalars(query.order_by(EmailTemplate.created_at.desc())).all())


def create_template(db: Session, payload: EmailTemplateCreate, user: User | None = None) -> EmailTemplate:
    user = user or ensure_default_local_user(db)
    if payload.mode.value != FULL_TIME_MODE or payload.template_kind.value not in SUPPORTED_TEMPLATE_KINDS:
        raise ValueError("Only Full-time job_application and job_follow_up templates are supported.")

    template = EmailTemplate(
        user_id=user.id,
        mode=payload.mode.value,
        template_kind=payload.template_kind.value,
        name=payload.name,
        subject_template=payload.subject_template,
        body_template=payload.body_template,
        variables_schema=payload.variables_schema,
        is_active=payload.is_active,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def get_template(db: Session, template_id: str, user: User | None = None) -> EmailTemplate | None:
    template = db.get(EmailTemplate, template_id)
    if user and (not template or template.user_id != user.id):
        return None
    return template


def update_template(db: Session, template: EmailTemplate, payload: EmailTemplateUpdate, user: User | None = None) -> EmailTemplate:
    if user and template.user_id != user.id:
        raise ValueError("Template not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template
