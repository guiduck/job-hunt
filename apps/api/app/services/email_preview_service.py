from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.email import EmailTemplate, ResumeAttachment
from app.models.opportunity import Opportunity
from app.services.email_constants import SUPPORTED_TEMPLATE_VARIABLES, TEMPLATE_VAR_RE


def render_template_text(template_text: str, values: dict[str, object]) -> tuple[str, list[str], dict[str, object]]:
    warnings: list[str] = []

    def replace(match) -> str:
        key = str(match.group(1))
        if key not in SUPPORTED_TEMPLATE_VARIABLES:
            warnings.append(f"Unsupported template variable: {key}")
            return f"[unsupported: {key}]"
        value = values.get(key)
        if value is None or value == "" or value == []:
            warnings.append(f"Missing template value: {key}")
            return f"[missing: {key}]"
        if isinstance(value, list):
            return ", ".join(str(item) for item in value)
        return str(value)

    return TEMPLATE_VAR_RE.sub(replace, template_text), warnings, values


def build_preview_values(
    *,
    opportunity: Opportunity | None = None,
    resume: ResumeAttachment | None = None,
    sample_values: dict[str, object] | None = None,
) -> dict[str, object]:
    sample_values = dict(sample_values or {})
    detail = opportunity.job_detail if opportunity else None
    values: dict[str, object] = {
        "company_name": detail.company_name if detail else None,
        "job_title": detail.role_title or detail.post_headline if detail else None,
        "author_name": None,
        "matched_keywords": detail.matched_keywords if detail else [],
        "source_url": opportunity.source_url if opportunity else None,
        "resume_name": resume.display_name if resume else None,
        "operator_name": None,
        "operator_email": None,
    }
    values.update(sample_values)
    return values


def render_template_preview(
    db: Session,
    template: EmailTemplate,
    *,
    opportunity: Opportunity | None = None,
    resume_attachment_id: str | None = None,
    sample_values: dict[str, object] | None = None,
) -> dict[str, object]:
    resume = db.get(ResumeAttachment, resume_attachment_id) if resume_attachment_id else None
    values = build_preview_values(opportunity=opportunity, resume=resume, sample_values=sample_values)
    subject, subject_warnings, rendered_variables = render_template_text(template.subject_template, values)
    body, body_warnings, _ = render_template_text(template.body_template, values)
    warnings = list(dict.fromkeys(subject_warnings + body_warnings))
    return {
        "subject": subject,
        "body": body,
        "warnings": warnings,
        "rendered_variables": rendered_variables,
    }
