from __future__ import annotations

from dataclasses import asdict
import re
from urllib.parse import parse_qs, unquote, urlparse, urlunparse

from app.services.career_page_search_provider import CareerPageProviderResult
from app.services.job_review_analyzer import analyze_candidate

EMAIL_RE = re.compile(r"(?<![\w.+-])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}(?![\w.-])")
STALE_RE = re.compile(r"\b(encerrad[ao]|closed|expired|vaga encerrada|no longer accepting)\b", re.IGNORECASE)


TRACKING_QUERY_PREFIXES = ("utm_",)
TRACKING_QUERY_KEYS = {"trk", "ref", "refid", "src", "source", "li_fat_id", "lipi"}
LINKEDIN_REDIRECT_HOSTS = {"www.linkedin.com", "linkedin.com"}


def decode_linkedin_safety_redirect(url: str) -> str | None:
    try:
        parsed = urlparse(url.strip())
    except ValueError:
        return None
    host = (parsed.hostname or "").lower()
    if host not in LINKEDIN_REDIRECT_HOSTS:
        return url.strip() or None
    if not any(part in parsed.path.lower() for part in ("/safety/", "/redir/", "/comm/jobs/view/")):
        return url.strip() or None
    query = parse_qs(parsed.query)
    for key in ("url", "target", "u"):
        values = query.get(key)
        if values:
            decoded = unquote(values[0]).strip()
            if decoded.startswith(("http://", "https://")):
                return decoded
    return None


def canonicalize_external_application_url(url: str) -> str | None:
    decoded = decode_linkedin_safety_redirect(url)
    if not decoded:
        return None
    try:
        parsed = urlparse(decoded.strip())
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return None
    query_pairs = parse_qs(parsed.query, keep_blank_values=True)
    kept_pairs: list[tuple[str, str]] = []
    for key in sorted(query_pairs):
        lower_key = key.lower()
        if lower_key in TRACKING_QUERY_KEYS or any(lower_key.startswith(prefix) for prefix in TRACKING_QUERY_PREFIXES):
            continue
        for value in query_pairs[key]:
            kept_pairs.append((key, value))
    query = "&".join(f"{key}={value}" for key, value in kept_pairs)
    path = parsed.path.rstrip("/") or "/"
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, "", query, ""))


def match_external_job_source(url: str, selected_source_keys: list[str] | None = None) -> str | None:
    from app.services.career_page_sources import match_curated_source

    source = match_curated_source(url, selected_source_keys)
    return source.key if source else None

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
