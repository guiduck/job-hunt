from __future__ import annotations

from dataclasses import asdict
import re

from app.services.career_page_search_provider import CareerPageProviderResult
from app.services.job_review_analyzer import analyze_candidate

EMAIL_RE = re.compile(r"(?<![\w.+-])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}(?![\w.-])")
STALE_RE = re.compile(r"\b(encerrad[ao]|closed|expired|vaga encerrada|no longer accepting)\b", re.IGNORECASE)


def extract_email(text: str) -> str | None:
    match = EMAIL_RE.search(text)
    return match.group(0).strip().lower() if match else None


def normalize_external_job_result(
    result: CareerPageProviderResult,
    *,
    requested_keywords: list[str],
    ai_enabled: bool,
    ai_provider=None,
    max_age_days: int = 31,
) -> dict[str, object]:
    text = " ".join(part for part in [result.title, result.snippet, result.link] if part)
    email = extract_email(text)
    matched_keywords = [keyword for keyword in requested_keywords if keyword.lower() in text.lower()]
    contact_value = email or result.link
    contact_type = "email" if email else "other_public_contact"
    analysis_result = analyze_candidate(
        {
            "company_name": result.source_name,
            "role_title": result.title,
            "post_headline": result.title,
            "job_description": result.snippet,
            "source_evidence": result.snippet or result.title,
            "matched_keywords": matched_keywords,
            "contact_channel_value": contact_value,
        },
        requested_keywords,
        ai_enabled=ai_enabled,
        ai_provider=ai_provider,
    )
    review_profile = analysis_result.review_profile
    stale_reason = None
    if STALE_RE.search(text):
        stale_reason = "Result appears stale or closed"
    elif result.result_age_days is not None and result.result_age_days > max_age_days:
        stale_reason = f"Result is older than {max_age_days} days"

    if stale_reason:
        return {
            **asdict(result),
            "provider_status": "collected",
            "provider_name": "serpapi",
            "contact_channel_type": contact_type,
            "contact_channel_value": contact_value,
            "contact_email": email,
            "application_url": result.link,
            "application_kind": "email" if email else "external_application",
            "company_name": result.source_name,
            "role_title": result.title,
            "post_headline": result.title,
            "job_description": result.snippet,
            "source_url": result.link,
            "source_evidence": result.snippet or result.title,
            "matched_keywords": matched_keywords,
            "review_profile": review_profile,
            "raw_excerpt": text[:1000],
            "provider_metadata": {"position": result.position, "date_text": result.date_text, "result_age_days": result.result_age_days},
            "external_job_id": result.external_job_id,
            "outcome_hint": "rejected_weak_match",
            "rejection_reason": stale_reason,
        }
    return {
        **asdict(result),
        "provider_status": "collected",
        "provider_name": "serpapi",
        "contact_channel_type": contact_type,
        "contact_channel_value": contact_value,
        "contact_email": email,
        "application_url": result.link,
        "application_kind": "email" if email else "external_application",
        "company_name": result.source_name,
        "role_title": result.title,
        "post_headline": result.title,
        "job_description": result.snippet,
        "source_url": result.link,
        "source_evidence": result.snippet or result.title,
        "source_query": result.source_query,
        "selected_source_key": result.source_key,
        "source_name": result.source_name,
        "matched_keywords": matched_keywords,
        "review_profile": review_profile,
        "raw_excerpt": text[:1000],
        "provider_metadata": {"position": result.position, "date_text": result.date_text, "result_age_days": result.result_age_days},
        "external_job_id": result.external_job_id,
        "ai_model_name": "deterministic" if not ai_enabled else None,
        "ai_prompt_version": "external-job-review-v1",
    }
