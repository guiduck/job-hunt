from sqlalchemy.orm import Session

from app.models.email import EmailTemplate
from app.models.user import User
from app.services.auth_service import ensure_default_local_user
from app.services.opportunity_service import ensure_default_keyword_set


def seed_defaults(db: Session) -> None:
    user = ensure_default_local_user(db)
    ensure_default_keyword_set(db, user=user)
    ensure_default_email_template(db, user=user)


def ensure_default_email_template(db: Session, *, user: User) -> EmailTemplate:
    existing = (
        db.query(EmailTemplate)
        .filter(
            EmailTemplate.user_id == user.id,
            EmailTemplate.mode == "full_time",
            EmailTemplate.template_kind == "job_application",
            EmailTemplate.name == "Default Full-time Application",
        )
        .one_or_none()
    )
    if existing:
        return existing

    template = EmailTemplate(
        user_id=user.id,
        mode="full_time",
        template_kind="job_application",
        name="Default Full-time Application",
        subject_template="Application for {{job_title}} at {{company_name}}",
        body_template=(
            "Hi {{author_name}},\n\n"
            "I found the {{job_title}} opportunity at {{company_name}} and wanted to reach out.\n"
            "My background is a strong match for {{matched_keywords}}.\n\n"
            "Source: {{source_url}}\n"
            "Resume: {{resume_name}}\n\n"
            "Best,\n{{operator_name}}"
        ),
        variables_schema={},
        is_active=True,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template
