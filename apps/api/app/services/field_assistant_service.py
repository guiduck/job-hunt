from __future__ import annotations

import re
from datetime import UTC, datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.field_assistant import FieldAnswerGeneration, FieldAssistantActivation, FieldResponseSuggestion
from app.models.user import User
from app.schemas.field_assistant import (
    FieldAnswerGenerateRequest,
    FieldAnswerGenerateResponse,
    FieldAssistantActivationCreate,
    FieldAssistantActivationUpdate,
    FieldResponseSuggestionCreate,
)
from app.services.ai_email_generation_service import AIEmailGenerationError, generate_field_answer
from app.services.resume_service import build_resume_context, get_field_assistant_context_resumes
from app.services.user_settings_service import get_or_create_user_settings

TRACKING_QUERY_PREFIXES = ("utm_",)
TRACKING_QUERY_KEYS = {"fbclid", "gclid", "msclkid"}
UNSAFE_FIELD_TERMS = {
    "password",
    "senha",
    "otp",
    "2fa",
    "card",
    "cartao",
    "cartão",
    "payment",
    "pagamento",
    "document",
    "documento",
    "cpf",
    "ssn",
    "phone",
    "telefone",
    "search",
    "busca",
}


def normalize_keyword(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9_ -]+", " ", value.strip().lower())
    normalized = re.sub(r"[\s-]+", "_", normalized).strip("_")
    return normalized[:120] or "general"


def normalize_scope_value(scope_type: str, value: str) -> str:
    parsed = urlparse(value.strip())
    if scope_type == "base_domain":
        host = (parsed.netloc or parsed.path).split("/")[0].lower()
        if host.startswith("www."):
            host = host[4:]
        if not host or "." not in host:
            raise ValueError("scope_value must include a valid domain")
        return host
    if scope_type == "exact_page":
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("scope_value must be a valid http(s) URL")
        host = parsed.netloc.lower()
        query_items = [
            (key, val)
            for key, val in parse_qsl(parsed.query, keep_blank_values=False)
            if key.lower() not in TRACKING_QUERY_KEYS and not key.lower().startswith(TRACKING_QUERY_PREFIXES)
        ]
        path = parsed.path or "/"
        return urlunparse((parsed.scheme.lower(), host, path, "", urlencode(query_items), ""))
    raise ValueError("scope_type must be base_domain or exact_page")


def create_activation(db: Session, payload: FieldAssistantActivationCreate, *, user: User) -> FieldAssistantActivation:
    scope_value = normalize_scope_value(payload.scope_type, payload.scope_value)
    existing = db.scalar(
        select(FieldAssistantActivation).where(
            FieldAssistantActivation.user_id == user.id,
            FieldAssistantActivation.scope_type == payload.scope_type,
            FieldAssistantActivation.scope_value == scope_value,
        )
    )
    if existing:
        existing.enabled = True
        existing.display_name = payload.display_name or existing.display_name
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    activation = FieldAssistantActivation(
        user_id=user.id,
        scope_type=payload.scope_type,
        scope_value=scope_value,
        display_name=payload.display_name,
        enabled=True,
    )
    db.add(activation)
    db.commit()
    db.refresh(activation)
    return activation


def list_activations(db: Session, *, user: User) -> list[FieldAssistantActivation]:
    return list(
        db.scalars(
            select(FieldAssistantActivation)
            .where(FieldAssistantActivation.user_id == user.id)
            .order_by(FieldAssistantActivation.created_at.desc())
        ).all()
    )


def update_activation(
    db: Session,
    activation_id: str,
    payload: FieldAssistantActivationUpdate,
    *,
    user: User,
) -> FieldAssistantActivation:
    activation = _get_activation_or_404(db, activation_id, user=user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(activation, field, value)
    db.add(activation)
    db.commit()
    db.refresh(activation)
    return activation


def delete_activation(db: Session, activation_id: str, *, user: User) -> None:
    activation = _get_activation_or_404(db, activation_id, user=user)
    db.delete(activation)
    db.commit()


def _get_activation_or_404(db: Session, activation_id: str, *, user: User) -> FieldAssistantActivation:
    activation = db.get(FieldAssistantActivation, activation_id)
    if not activation or activation.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field assistant activation not found")
    return activation


def ensure_safe_generation_request(payload: FieldAnswerGenerateRequest) -> None:
    haystack = " ".join(
        part
        for part in [
            payload.keyword,
            payload.field_context.label_text,
            payload.field_context.placeholder or "",
            payload.page_context.page_title or "",
        ]
        if part
    ).lower()
    if any(term in haystack for term in UNSAFE_FIELD_TERMS):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field context is not safe for assistant generation")
    if len(payload.field_context.label_text.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field context is insufficient")


def generate_answer(db: Session, payload: FieldAnswerGenerateRequest, *, user: User) -> FieldAnswerGenerateResponse:
    ensure_safe_generation_request(payload)
    settings = get_or_create_user_settings(db, user=user)
    resumes = get_field_assistant_context_resumes(db, user.id)
    context = {
        "keyword": normalize_keyword(payload.keyword),
        "field": payload.field_context.model_dump(),
        "page": payload.page_context.model_dump(),
        "template_hint": payload.template_hint,
        "operator": {
            "name": settings.operator_name,
            "email": settings.operator_email,
            "portfolio_url": settings.portfolio_url,
            "linkedin_url": settings.operator_linkedin_url,
        },
        "resumes": [build_resume_context(resume, excerpt_limit=5000) for resume in resumes],
        "resume_context_policy": (
            "Treat selected resume text as the strongest source of truth. Prefer concrete examples from these resumes "
            "when the form asks about experience, projects, tools, methods, or achievements. Do not claim anything absent "
            "from resume/operator context; if the relevant detail is missing, answer conservatively."
        ),
    }
    try:
        result = generate_field_answer(context)
        status_value = "drafted"
        error_message = None
    except AIEmailGenerationError as exc:
        result = {
            "answer_text": "",
            "rationale": None,
            "missing_context": [str(exc)],
        }
        status_value = "failed"
        error_message = str(exc)
    generation = FieldAnswerGeneration(
        user_id=user.id,
        keyword=normalize_keyword(payload.keyword),
        field_label=payload.field_context.label_text,
        page_origin=payload.page_context.origin,
        status=status_value,
        answer_text=str(result.get("answer_text") or ""),
        error_message=error_message,
    )
    db.add(generation)
    db.commit()
    if status_value == "failed":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=error_message or "Could not generate answer")
    return FieldAnswerGenerateResponse(
        answer_text=str(result["answer_text"]).strip(),
        keyword=normalize_keyword(payload.keyword),
        rationale=str(result.get("rationale") or "") or None,
        missing_context=[str(item) for item in result.get("missing_context", [])],
        save_default=False,
    )


def list_suggestions(db: Session, *, keyword: str, user: User) -> list[FieldResponseSuggestion]:
    normalized_keyword = normalize_keyword(keyword)
    return list(
        db.scalars(
            select(FieldResponseSuggestion)
            .where(FieldResponseSuggestion.user_id == user.id, FieldResponseSuggestion.keyword == normalized_keyword)
            .order_by(FieldResponseSuggestion.last_used_at.desc().nullslast(), FieldResponseSuggestion.created_at.desc())
            .limit(3)
        ).all()
    )


def save_suggestion(db: Session, payload: FieldResponseSuggestionCreate, *, user: User) -> FieldResponseSuggestion:
    suggestion = FieldResponseSuggestion(
        user_id=user.id,
        keyword=normalize_keyword(payload.keyword),
        response_text=payload.response_text.strip(),
        source=payload.source,
        field_label=payload.field_label,
        field_context_summary=payload.field_context_summary,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    prune_suggestions(db, user_id=user.id, keyword=suggestion.keyword, keep_id=suggestion.id)
    db.refresh(suggestion)
    return suggestion


def record_suggestion_used(db: Session, suggestion_id: str, *, user: User) -> FieldResponseSuggestion:
    suggestion = db.get(FieldResponseSuggestion, suggestion_id)
    if not suggestion or suggestion.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field response suggestion not found")
    suggestion.used_count += 1
    suggestion.last_used_at = datetime.now(UTC)
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion


def prune_suggestions(db: Session, *, user_id: str, keyword: str, keep_id: str | None = None) -> None:
    suggestions = list(
        db.scalars(
            select(FieldResponseSuggestion)
            .where(FieldResponseSuggestion.user_id == user_id, FieldResponseSuggestion.keyword == keyword)
            .order_by(FieldResponseSuggestion.last_used_at.desc().nullslast(), FieldResponseSuggestion.created_at.desc())
        ).all()
    )
    keepers = suggestions[:3]
    if keep_id and all(suggestion.id != keep_id for suggestion in keepers):
        kept = db.get(FieldResponseSuggestion, keep_id)
        if kept:
            keepers = [kept, *keepers[:2]]
    keeper_ids = {suggestion.id for suggestion in keepers}
    for stale in suggestions:
        if stale.id in keeper_ids:
            continue
        db.delete(stale)
    db.commit()
