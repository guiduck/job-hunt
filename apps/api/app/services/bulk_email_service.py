from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.email import BulkBatchStatus, BulkSendBatch, EmailTemplate, OutreachEvent, ResumeAttachment, SendRequest, SendRequestStatus, TemplateKind
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.email import BulkAIGenerateRequest, BulkPreviewRequest, BulkSendItemUpdate, EmailDraftCreate
from app.services.ai_email_generation_service import AIEmailGenerationError, generate_job_application_email
from app.services.auth_service import ensure_default_local_user
from app.services.email_constants import is_valid_email
from app.services.email_draft_service import create_draft
from app.services.email_send_service import approve_draft_send, has_successful_job_application
from app.services.resume_service import get_newest_available_resume, get_resume
from app.services.user_settings_service import get_or_create_user_settings


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


def generate_ai_bulk_send(db: Session, payload: BulkAIGenerateRequest, user: User | None = None) -> BulkSendBatch:
    user = user or ensure_default_local_user(db)
    resume = None
    if payload.resume_attachment_id:
        resume = get_resume(db, payload.resume_attachment_id, user=user)
        if not resume or not resume.is_available:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    else:
        resume = get_newest_available_resume(db, user_id=user.id)

    template = None
    if payload.template_id:
        template = db.get(EmailTemplate, payload.template_id)
        if not template or template.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    settings = get_or_create_user_settings(db, user=user)
    resume_context = _resume_context(resume)
    template_context = _template_context(template)
    items: list[dict[str, object]] = []
    for opportunity_id in payload.opportunity_ids:
        opportunity = db.get(Opportunity, opportunity_id)
        if opportunity and opportunity.user_id != user.id:
            opportunity = None
        email = _recipient_email(opportunity)
        base_item = {"opportunity_id": opportunity_id, "recipient_email": email, "draft_id": None, "is_skipped": False}
        if not opportunity or not opportunity.job_detail:
            items.append({**base_item, "outcome": "skipped_missing_contact", "reason": "Opportunity not found or not a job."})
            continue
        if not email:
            items.append({**base_item, "outcome": "skipped_missing_contact", "reason": "Missing recipient email."})
            continue
        if has_successful_job_application(db, opportunity_id, user_id=user.id):
            items.append({**base_item, "outcome": "skipped_duplicate", "reason": "A job_application send already succeeded."})
            continue
        if not is_valid_email(email):
            items.append({**base_item, "outcome": "blocked_invalid_contact", "reason": "Recipient email is invalid."})
            continue

        try:
            generated = generate_job_application_email(
                _ai_generation_context(
                    opportunity,
                    settings=settings,
                    resume_context=resume_context,
                    template_context=template_context,
                    recipient_email=email,
                )
            )
        except AIEmailGenerationError as exc:
            items.append(
                {
                    **base_item,
                    "outcome": "ai_generation_failed",
                    "reason": str(exc),
                    "ai_error_code": exc.code,
                    "retryable": exc.retryable,
                }
            )
            continue
        items.append({**base_item, **generated, "outcome": "sendable", "reason": None})

    batch = BulkSendBatch(
        user_id=user.id,
        template_id=None,
        resume_attachment_id=resume.id if resume else None,
        selected_count=len(payload.opportunity_ids),
        items=items,
        status=BulkBatchStatus.PREVIEWED.value,
        **_count_items(items),
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def update_bulk_send_item(db: Session, batch_id: str, opportunity_id: str, payload: BulkSendItemUpdate, user: User | None = None) -> BulkSendBatch:
    user = user or ensure_default_local_user(db)
    batch = db.get(BulkSendBatch, batch_id)
    if not batch or batch.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk batch not found")

    updated = False
    items: list[dict[str, object]] = []
    for item in batch.items:
        next_item = dict(item)
        if str(next_item.get("opportunity_id")) == opportunity_id:
            updated = True
            for field, value in payload.model_dump(exclude_unset=True).items():
                next_item[field] = value
            next_item = _validate_review_item(db, next_item, user_id=user.id)
        items.append(next_item)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk item not found")

    batch.items = items
    for field, value in _count_items(items).items():
        setattr(batch, field, value)
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
        if item.get("is_skipped"):
            updated_items.append({**item, "outcome": "skipped_by_user", "reason": "Skipped during review."})
            continue
        item = _validate_review_item(db, dict(item), user_id=user.id)
        if item.get("outcome") != "sendable":
            updated_items.append(item)
            continue
        if batch.template_id:
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
        else:
            request = _create_ai_send_request(db, batch, item, user=user)
            updated_items.append({**item, "send_request_id": request.id})

    batch.items = updated_items
    batch.status = BulkBatchStatus.APPROVED.value
    batch.approved_at = datetime.now(UTC)
    for field, value in _count_items(updated_items).items():
        setattr(batch, field, value)
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def _recipient_email(opportunity: Opportunity | None) -> str | None:
    if not opportunity or not opportunity.job_detail:
        return None
    return opportunity.job_detail.contact_email or opportunity.job_detail.contact_channel_value


def _ai_generation_context(
    opportunity: Opportunity,
    *,
    settings,
    resume_context: dict[str, object] | None,
    template_context: dict[str, object] | None,
    recipient_email: str,
) -> dict[str, object]:
    job_detail = opportunity.job_detail
    return {
        "opportunity": {
            "id": opportunity.id,
            "title": opportunity.title or job_detail.role_title,
            "company": opportunity.organization_name or job_detail.company_name,
            "source_name": opportunity.source_name,
            "source_url": opportunity.source_url or job_detail.linkedin_url or job_detail.application_url,
            "source_evidence": opportunity.source_evidence,
            "job_description": job_detail.job_description,
            "contact_context": {
                "recipient_email": recipient_email,
                "poster_profile_url": job_detail.poster_profile_url,
                "contact_channel_type": job_detail.contact_channel_type,
            },
        },
        "operator": {
            "name": settings.operator_name,
            "email": settings.operator_email,
            "portfolio_url": settings.portfolio_url,
        },
        "resume": resume_context,
        "template_reference": template_context,
        "language": _job_post_language_context(opportunity),
        "strict_claim_rules": [
            "Only claim skills, technologies, domains, and years of experience present in resume text or operator profile.",
            "If a requested job skill is absent from resume/profile context, do not pretend the candidate has it.",
            "Do not mention .NET or any other technology unless it appears in resume/profile context.",
            "Prefer matching confirmed strengths to the job instead of covering every job requirement.",
            "Write the email in the detected job post language unless the user edits it manually during review.",
        ],
    }


def _job_post_language_context(opportunity: Opportunity) -> dict[str, object]:
    language, confidence, signals = _detect_job_post_language(opportunity)
    return {
        "detected_language": language,
        "confidence": confidence,
        "signals": signals,
        "instruction": f"Write the subject and body in {language}. Match the job post language, not the resume language.",
    }


def _detect_job_post_language(opportunity: Opportunity) -> tuple[str, str, list[str]]:
    job_detail = opportunity.job_detail
    text = " ".join(
        part
        for part in [
            opportunity.title,
            opportunity.organization_name,
            opportunity.source_evidence,
            job_detail.role_title if job_detail else None,
            job_detail.post_headline if job_detail else None,
            job_detail.job_description if job_detail else None,
        ]
        if part
    ).lower()
    scores = {
        "English": _language_score(
            text,
            [
                "we are hiring",
                "hiring",
                "frontend developer",
                "full stack",
                "remote",
                "experience",
                "skills",
                "requirements",
                "responsibilities",
                "apply",
                "team",
            ],
        ),
        "Spanish": _language_score(
            text,
            [
                "estamos contratando",
                "buscamos",
                "desarrollador",
                "desarrolladora",
                "experiencia",
                "habilidades",
                "requisitos",
                "responsabilidades",
                "equipo",
                "remoto",
                "postúlate",
                "ubicación",
                "años",
                "conocimientos",
            ],
        ),
        "Portuguese": _language_score(
            text,
            [
                "estamos contratando",
                "procuramos",
                "desenvolvedor",
                "desenvolvedora",
                "experiência",
                "habilidades",
                "requisitos",
                "responsabilidades",
                "equipe",
                "remoto",
                "candidate-se",
                "localização",
                "anos",
                "conhecimentos",
            ],
        ),
    }
    language = max(scores, key=scores.get)
    score = scores[language]
    if score <= 0:
        return "English", "low", []
    confidence = "high" if score >= 3 else "medium"
    return language, confidence, [f"{name}:{value}" for name, value in scores.items() if value > 0]


def _language_score(text: str, markers: list[str]) -> int:
    return sum(1 for marker in markers if marker in text)


def _template_context(template: EmailTemplate | None) -> dict[str, object] | None:
    if not template:
        return None
    return {
        "name": template.name,
        "template_kind": template.template_kind,
        "subject_template": template.subject_template,
        "body_template": template.body_template,
        "note": "Use this as writing style, structure, and reusable phrasing guidance. Do not copy placeholders literally.",
    }


def _resume_context(resume: ResumeAttachment | None) -> dict[str, object] | None:
    if not resume:
        return None
    text, status_message = _extract_resume_text(resume)
    return {
        "display_name": resume.display_name,
        "file_name": resume.file_name,
        "mime_type": resume.mime_type,
        "text_extraction_status": status_message,
        "text_excerpt": text[:8000] if text else None,
        "note": (
            "Resume text is the candidate truth source. If extraction is unavailable or a skill is not present here, "
            "do not infer or invent it."
        ),
    }


def _extract_resume_text(resume: ResumeAttachment) -> tuple[str | None, str]:
    if resume.mime_type != "application/pdf" and not resume.file_name.lower().endswith(".pdf"):
        return None, "Resume is not a PDF; only metadata is available."
    try:
        content = resume.file_content if resume.file_content is not None else Path(resume.file_path).read_bytes()
    except OSError:
        return None, "Resume file could not be read; only metadata is available."
    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(content))
        page_text = [page.extract_text() or "" for page in reader.pages[:8]]
    except Exception:
        return None, "PDF text extraction failed; only metadata is available."
    text = "\n".join(part.strip() for part in page_text if part.strip()).strip()
    if not text:
        return None, "PDF text extraction returned no text; only metadata is available."
    return text, "PDF text extracted successfully."


def _validate_review_item(db: Session, item: dict[str, object], *, user_id: str) -> dict[str, object]:
    opportunity_id = str(item.get("opportunity_id") or "")
    if item.get("is_skipped"):
        return {**item, "outcome": "skipped_by_user", "reason": "Skipped during review."}
    recipient = str(item.get("recipient_email") or "").strip()
    subject = str(item.get("subject") or "").strip()
    body = str(item.get("body") or "").strip()
    if has_successful_job_application(db, opportunity_id, user_id=user_id):
        return {**item, "outcome": "skipped_duplicate", "reason": "A job_application send already succeeded."}
    if not recipient:
        return {**item, "outcome": "skipped_missing_contact", "reason": "Missing recipient email."}
    if not is_valid_email(recipient):
        return {**item, "outcome": "blocked_invalid_contact", "reason": "Recipient email is invalid."}
    if "subject" in item and not subject:
        return {**item, "outcome": "blocked_missing_subject", "reason": "Subject is required."}
    if "body" in item and not body:
        return {**item, "outcome": "blocked_missing_body", "reason": "Body is required."}
    return {**item, "recipient_email": recipient, "subject": subject or item.get("subject"), "body": body or item.get("body"), "outcome": "sendable", "reason": None}


def _create_ai_send_request(db: Session, batch: BulkSendBatch, item: dict[str, object], *, user: User) -> SendRequest:
    send_request = SendRequest(
        user_id=user.id,
        draft_id=None,
        opportunity_id=str(item["opportunity_id"]),
        template_id=None,
        template_kind=TemplateKind.JOB_APPLICATION.value,
        resume_attachment_id=batch.resume_attachment_id,
        recipient_email=str(item["recipient_email"]),
        subject_snapshot=str(item["subject"]),
        body_snapshot=str(item["body"]),
        resume_snapshot={},
        status=SendRequestStatus.APPROVED.value,
        bulk_batch_id=batch.id,
        approved_at=datetime.now(UTC),
    )
    db.add(send_request)
    db.flush()
    db.add(
        OutreachEvent(
            user_id=user.id,
            opportunity_id=send_request.opportunity_id,
            send_request_id=send_request.id,
            bulk_batch_id=batch.id,
            recipient_email=send_request.recipient_email,
            template_kind=send_request.template_kind,
            resume_attachment_id=send_request.resume_attachment_id,
            subject=send_request.subject_snapshot,
            event_type="queued",
            status=SendRequestStatus.APPROVED.value,
            payload={"approved_in_api": True, "bulk_ai_generated": True},
        )
    )
    return send_request


def _count_items(items: list[dict[str, object]]) -> dict[str, int]:
    return {
        "sendable_count": sum(1 for item in items if item.get("outcome") == "sendable" and not item.get("is_skipped")),
        "skipped_missing_contact_count": sum(1 for item in items if item.get("outcome") == "skipped_missing_contact"),
        "skipped_duplicate_count": sum(1 for item in items if item.get("outcome") == "skipped_duplicate"),
        "blocked_invalid_contact_count": sum(1 for item in items if item.get("outcome") == "blocked_invalid_contact"),
        "limit_blocked_count": sum(1 for item in items if item.get("outcome") == "blocked_limit"),
    }
