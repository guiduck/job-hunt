from __future__ import annotations

import re
from typing import Any


SENIORITY_PATTERNS = {
    "senior": [r"\bsenior\b", r"\bsr\.?\b", r"\blead\b", r"\bstaff\b"],
    "mid": [r"\bmid\b", r"\bpleno\b", r"\bpl\b"],
    "junior": [r"\bjunior\b", r"\bjr\.?\b", r"\bentry[- ]level\b"],
}
MODALITY_PATTERNS = {
    "remote": [r"\bremote\b", r"\bremoto\b", r"\bwork from home\b"],
    "hybrid": [r"\bhybrid\b", r"\bhibrido\b", r"\bhíbrido\b"],
    "onsite": [r"\bonsite\b", r"\bon-site\b", r"\bpresencial\b"],
}
LOCATION_RE = re.compile(r"\b(?:in|em|based in|localizado em)\s+([A-Z][A-Za-zÀ-ÿ .,-]{2,80})")


def _text(candidate: dict[str, object]) -> str:
    return " ".join(
        str(candidate.get(key) or "")
        for key in ["company_name", "role_title", "post_headline", "job_description", "source_evidence", "raw_excerpt"]
    )


def _first_match(patterns: dict[str, list[str]], text: str) -> str | None:
    for value, regexes in patterns.items():
        if any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in regexes):
            return value
    return None


def detect_seniority(candidate: dict[str, object]) -> str | None:
    return _first_match(SENIORITY_PATTERNS, _text(candidate))


def detect_modality(candidate: dict[str, object]) -> str | None:
    return _first_match(MODALITY_PATTERNS, _text(candidate))


def detect_location(candidate: dict[str, object]) -> str | None:
    match = LOCATION_RE.search(_text(candidate))
    if not match:
        return None
    return match.group(1).strip(" .,")


def missing_keywords(candidate: dict[str, object], requested_keywords: list[str] | None = None) -> list[str]:
    matched = {str(keyword).lower() for keyword in candidate.get("matched_keywords", []) if keyword}
    requested = requested_keywords or [str(keyword) for keyword in candidate.get("requested_keywords", []) if keyword]
    return [keyword for keyword in requested if keyword.lower() not in matched]


def clamp_score(value: int) -> int:
    return max(0, min(100, value))


def calculate_historical_similarity_signals(outcomes: list[str]) -> dict[str, object]:
    positive = sum(1 for outcome in outcomes if outcome in {"saved", "responded", "interview"})
    negative = sum(1 for outcome in outcomes if outcome in {"rejected", "ignored"})
    adjustment = max(-20, min(20, positive * 5 - negative * 5))
    return {
        "comparable_count": positive + negative,
        "positive_outcome_count": positive,
        "negative_outcome_count": negative,
        "adjustment": adjustment,
    }


def build_review_profile(
    candidate: dict[str, object],
    requested_keywords: list[str] | None = None,
    *,
    analysis_status: str = "deterministic_only",
    analysis_error_code: str | None = None,
    analysis_error_message: str | None = None,
    historical_similarity_signals: dict[str, Any] | None = None,
) -> dict[str, object]:
    matched_keywords = [str(keyword) for keyword in candidate.get("matched_keywords", []) if keyword]
    missing = missing_keywords(candidate, requested_keywords)
    has_contact = bool(str(candidate.get("contact_channel_value") or ""))
    has_evidence = bool(str(candidate.get("source_evidence") or ""))
    provider_status = str(candidate.get("provider_status") or "collected")
    historical = historical_similarity_signals or {"comparable_count": 0, "adjustment": 0}
    historical_adjustment = int(historical.get("adjustment") or 0)

    score = 20
    score += min(len(matched_keywords), 5) * 12
    score -= min(len(missing), 5) * 6
    score += 12 if has_contact else -20
    score += 10 if has_evidence else -15
    if provider_status != "collected":
        score -= 20
    score += max(-20, min(20, historical_adjustment))
    score = clamp_score(score)

    positive = [f"Matched keyword: {keyword}" for keyword in matched_keywords]
    if has_contact:
        positive.append("Public contact channel available")
    if has_evidence:
        positive.append("Source evidence available")
    if historical_adjustment > 0:
        positive.append("Similar historical outcomes improved score")

    negative = [f"Missing keyword: {keyword}" for keyword in missing]
    if not has_contact:
        negative.append("No public contact channel")
    if not has_evidence:
        negative.append("Missing source evidence")
    if historical_adjustment < 0:
        negative.append("Similar historical outcomes lowered score")

    explanation_parts = []
    if matched_keywords:
        explanation_parts.append(f"Matched {len(matched_keywords)} keyword(s): {', '.join(matched_keywords)}.")
    if missing:
        explanation_parts.append(f"Missing keyword(s): {', '.join(missing)}.")
    explanation_parts.append("Public contact is available." if has_contact else "No public contact is available.")
    explanation_parts.append("Source evidence is present." if has_evidence else "Source evidence is missing.")
    if historical_adjustment:
        explanation_parts.append(f"Historical comparable outcomes adjusted score by {historical_adjustment}.")

    return {
        "review_status": "unreviewed",
        "match_score": score,
        "score_explanation": " ".join(explanation_parts),
        "score_factors": {
            "positive": positive,
            "negative": negative,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing,
            "evidence_refs": ["source_evidence"] if has_evidence else [],
            "historical_adjustment": historical_adjustment,
        },
        "analysis_status": analysis_status,
        "analysis_confidence": "medium" if score >= 50 else "low",
        "analysis_error_code": analysis_error_code,
        "analysis_error_message": analysis_error_message,
        "normalized_company_name": str(candidate.get("company_name") or "").strip() or None,
        "normalized_role_title": str(candidate.get("role_title") or candidate.get("post_headline") or "").strip() or None,
        "detected_seniority": detect_seniority(candidate),
        "detected_modality": detect_modality(candidate),
        "detected_location": detect_location(candidate),
        "missing_keywords": missing,
        "historical_similarity_signals": historical,
    }
