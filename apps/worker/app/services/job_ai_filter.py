from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
import json
import re
import unicodedata
from urllib import error, request

CONFIDENCE_THRESHOLD = 0.70
PROMPT_VERSION = "job-ai-filter-v3"

SKIPPED_OUTCOMES = {
    "duplicate",
    "rejected_no_contact",
    "rejected_weak_match",
    "rejected_missing_evidence",
    "failed_parse",
    "failed_provider",
    "blocked_source",
    "inaccessible_source",
    "empty_source",
}


@dataclass(frozen=True)
class AIFilterSettings:
    remote_only: bool = False
    exclude_onsite: bool = False
    accepted_regions: list[str] = field(default_factory=list)
    excluded_regions: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class AIFilterDecision:
    passes_ai_filter: bool | None
    ai_filter_status: str
    ai_filter_reason: str
    ai_filter_confidence: float | None = None
    ai_filter_signals: dict[str, object] = field(default_factory=dict)
    ai_filter_error_code: str | None = None
    ai_filter_error_message: str | None = None
    ai_filter_model_name: str | None = None
    ai_filter_prompt_version: str = PROMPT_VERSION


def normalize_ai_filter_settings(value: object) -> AIFilterSettings:
    if not isinstance(value, dict):
        return AIFilterSettings()
    return AIFilterSettings(
        remote_only=bool(value.get("remote_only")),
        exclude_onsite=bool(value.get("exclude_onsite")),
        accepted_regions=normalize_terms(value.get("accepted_regions")),
        excluded_regions=normalize_terms(value.get("excluded_regions")),
    )


def normalize_terms(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        raw_values = value.replace("\n", ",").split(",")
    elif isinstance(value, list):
        raw_values = value
    else:
        return []
    seen: set[str] = set()
    terms: list[str] = []
    for item in raw_values:
        term = str(item).strip()
        key = term.lower()
        if term and key not in seen:
            seen.add(key)
            terms.append(term)
    return terms


def build_ai_filter_input(
    candidate: dict[str, object],
    settings: AIFilterSettings,
    profile_context: dict[str, object] | None = None,
) -> dict[str, object]:
    return {
        "title": str(candidate.get("role_title") or candidate.get("post_headline") or ""),
        "headline": str(candidate.get("post_headline") or ""),
        "description": str(candidate.get("job_description") or ""),
        "source_url": str(candidate.get("source_url") or ""),
        "source_query": str(candidate.get("source_query") or ""),
        "source_evidence": str(candidate.get("source_evidence") or candidate.get("raw_excerpt") or ""),
        "contact_channel_type": str(candidate.get("contact_channel_type") or ""),
        "contact_channel_value": str(candidate.get("contact_channel_value") or ""),
        "filter_settings": settings.__dict__,
        "candidate_profile": profile_context or {},
        "schema": {
            "passes": "boolean",
            "reason": "string",
            "confidence": "number from 0 to 1",
            "signals": {
                "detected_work_mode": "remote|hybrid|onsite|presential|unknown|mixed",
                "accepted_regions": "string[]",
                "accepted_countries": "string[]",
                "accepted_timezones": "string[]",
                "rejected_regions": "string[]",
                "speaker_type": "employer|recruiter|hiring_manager|job_seeker|unknown",
                "is_job_seeker_post": "boolean",
                "has_real_job_opening": "boolean",
                "job_opening_evidence": "string[]",
                "evidence_quotes": "string[]",
            },
        },
    }


def evaluate_ai_filter(
    candidate: dict[str, object],
    settings: AIFilterSettings,
    *,
    enabled: bool,
    provider: Callable[[dict[str, object]], dict[str, object]] | None = None,
    model_name: str | None = None,
    profile_context: dict[str, object] | None = None,
) -> AIFilterDecision:
    if str(candidate.get("outcome") or "accepted") in SKIPPED_OUTCOMES:
        return AIFilterDecision(None, "skipped", "Skipped because an earlier deterministic outcome already decided this candidate.")

    if not enabled:
        return deterministic_fallback(candidate, settings, error_code="ai_filters_disabled", error_message="AI filters are disabled.")

    job_seeker_decision = reject_obvious_job_seeker_post(candidate, model_name=model_name)
    if job_seeker_decision is not None:
        log_ai_filter_decision(candidate, settings, job_seeker_decision, provider_output=None)
        return job_seeker_decision

    if provider is None:
        decision = deterministic_fallback(
            candidate,
            settings,
            error_code="ai_not_configured",
            error_message="AI filters are enabled but no provider is configured.",
        )
        log_ai_filter_decision(candidate, settings, decision, provider_output=None)
        return decision

    try:
        output = provider(build_ai_filter_input(candidate, settings, profile_context))
    except TimeoutError:
        decision = deterministic_fallback(candidate, settings, error_code="ai_timeout", error_message="AI filter provider timed out.")
        log_ai_filter_decision(candidate, settings, decision, provider_output=None)
        return decision
    except Exception as exc:  # noqa: BLE001 - provider failures must not break capture.
        decision = deterministic_fallback(candidate, settings, error_code="ai_unavailable", error_message=str(exc))
        log_ai_filter_decision(candidate, settings, decision, provider_output=None)
        return decision

    validated = validate_ai_filter_output(output)
    if validated is None:
        decision = deterministic_fallback(
            candidate,
            settings,
            error_code="invalid_ai_output",
            error_message="AI filter provider returned invalid structured output.",
        )
        log_ai_filter_decision(candidate, settings, decision, provider_output=output)
        return decision

    confidence = float(validated["confidence"])
    if confidence < CONFIDENCE_THRESHOLD:
        decision = deterministic_fallback(
            candidate,
            settings,
            confidence=confidence,
            signals=dict(validated.get("signals") or {}),
            error_code="low_confidence",
            error_message="AI filter confidence was below 0.70.",
        )
        log_ai_filter_decision(candidate, settings, decision, provider_output=output)
        return decision

    passes = bool(validated["passes"])
    decision = AIFilterDecision(
        passes_ai_filter=passes,
        ai_filter_status="passed" if passes else "rejected",
        ai_filter_reason=str(validated["reason"]),
        ai_filter_confidence=confidence,
        ai_filter_signals=dict(validated.get("signals") or {}),
        ai_filter_model_name=model_name,
    )
    log_ai_filter_decision(candidate, settings, decision, provider_output=output)
    return decision


def deterministic_fallback(
    candidate: dict[str, object],
    settings: AIFilterSettings,
    *,
    confidence: float | None = None,
    signals: dict[str, object] | None = None,
    error_code: str,
    error_message: str,
) -> AIFilterDecision:
    text = candidate_text(candidate)
    local_signals = detect_local_signals(text, settings)
    merged_signals = {**local_signals, **(signals or {})}
    return AIFilterDecision(
        passes_ai_filter=True,
        ai_filter_status="fallback",
        ai_filter_reason=(
            "Used legacy deterministic fallback after an uncertain AI filter result; "
            "the candidate already passed the existing public-contact checks."
        ),
        ai_filter_confidence=confidence,
        ai_filter_signals=merged_signals,
        ai_filter_error_code=error_code,
        ai_filter_error_message=error_message,
    )


JOB_SEEKER_PATTERNS = [
    r"\bestou (?:em busca|procurando|buscando) (?:de )?(?:uma )?(?:oportunidade|vaga|recoloca[cç][aã]o)\b",
    r"\b(?:busco|procuro|procurando) (?:uma )?(?:oportunidade|vaga|recoloca[cç][aã]o)\b",
    r"\b(?:open to work|looking for (?:a )?(?:job|role|opportunit)|seeking (?:a )?(?:job|role|opportunit))\b",
    r"\bme (?:candidato|coloco .*disposi[cç][aã]o)\b",
    r"\bcurr[ií]culo\b.*\b(?:anexo|segue|dispon[ií]vel)\b",
]


def reject_obvious_job_seeker_post(candidate: dict[str, object], *, model_name: str | None = None) -> AIFilterDecision | None:
    text = candidate_text(candidate)
    for pattern in JOB_SEEKER_PATTERNS:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return AIFilterDecision(
                passes_ai_filter=False,
                ai_filter_status="rejected",
                ai_filter_reason="Rejected because the post appears to be from a person seeking a job, not an employer hiring.",
                ai_filter_confidence=0.95,
                ai_filter_signals={
                    "is_job_seeker_post": True,
                    "matched_job_seeker_pattern": pattern,
                    "evidence_quotes": [match.group(0)[:160]],
                },
                ai_filter_model_name=model_name,
            )
    return None


JOB_SEEKER_STRONG_PATTERNS = [
    r"\bopen to work\b",
    r"\blooking for (?:a )?(?:job|role|opportunit|work)\b",
    r"\bseeking (?:a )?(?:job|role|opportunit|work)\b",
    r"\bnot a hiring post\b",
    r"\bnao e (?:um )?post de contratacao\b",
    r"\bnao eh (?:um )?post de contratacao\b",
]
JOB_SEEKER_SEEKING_PATTERNS = [
    r"\bestou (?:em busca|procurando|buscando|a procura|focado em encontrar)\b.{0,90}\b(?:oportunidade|vaga|recolocacao|trabalho|emprego)\b",
    r"\b(?:busco|procuro|procurando|buscando|em busca de|a procura de)\b.{0,90}\b(?:oportunidade|vaga|recolocacao|trabalho|emprego)\b",
    r"\bencontrar (?:uma )?(?:oportunidade|vaga|recolocacao|trabalho|emprego)\b",
    r"\boportunidade\b.{0,80}\bonde eu possa\b",
    r"\bme candidato\b",
    r"\bme coloco\b.{0,80}\bdisposicao\b",
]
JOB_SEEKER_SELF_MARKERS = [
    "meu curriculo",
    "segue meu cv",
    "segue meu curriculo",
    "meu portfolio",
    "meu linkedin",
    "meu email",
    "meu contato",
    "minhas linguagens",
    "minhas skills",
    "minhas experiencias",
    "tenho experiencia",
    "tenho vivencia",
    "meu tecnico atual",
    "sou desenvolvedor",
    "sou developer",
    "sou frontend",
    "sou full stack",
    "estou cursando",
]


def reject_obvious_job_seeker_post(candidate: dict[str, object], *, model_name: str | None = None) -> AIFilterDecision | None:
    text = candidate_text(candidate)
    strong_patterns = []
    seeking_patterns = []
    self_markers = [marker for marker in JOB_SEEKER_SELF_MARKERS if marker in text]
    for pattern in JOB_SEEKER_STRONG_PATTERNS:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            strong_patterns.append(match.group(0)[:160])
    for pattern in JOB_SEEKER_SEEKING_PATTERNS:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            seeking_patterns.append(match.group(0)[:160])
    if strong_patterns or (seeking_patterns and self_markers):
        return AIFilterDecision(
            passes_ai_filter=False,
            ai_filter_status="rejected",
            ai_filter_reason="Rejected because the post appears to be from a person seeking a job, not an employer hiring.",
            ai_filter_confidence=0.96,
            ai_filter_signals={
                "speaker_type": "job_seeker",
                "is_job_seeker_post": True,
                "has_real_job_opening": False,
                "matched_job_seeker_patterns": strong_patterns + seeking_patterns,
                "matched_self_markers": self_markers,
                "evidence_quotes": (strong_patterns + seeking_patterns + self_markers)[:5],
            },
            ai_filter_model_name=model_name,
        )
    return None


def deterministic_filter_result(settings: AIFilterSettings, signals: dict[str, object]) -> tuple[bool, str]:
    work_mode = str(signals.get("detected_work_mode") or "unknown")
    rejected_regions = [str(item) for item in signals.get("rejected_regions", []) if item]
    if rejected_regions:
        return False, f"Deterministic fallback matched excluded region(s): {', '.join(rejected_regions)}."
    if settings.exclude_onsite and work_mode in {"onsite", "hybrid", "presential", "mixed"}:
        return False, f"Deterministic fallback detected disallowed work mode: {work_mode}."
    if settings.remote_only and work_mode not in {"remote", "mixed"}:
        return False, "Deterministic fallback could not confirm remote work."
    return True, "Used deterministic fallback; existing local rules allowed this candidate to continue."


def log_ai_filter_decision(
    candidate: dict[str, object],
    settings: AIFilterSettings,
    decision: AIFilterDecision,
    *,
    provider_output: object,
) -> None:
    print(
        "[job-ai-filter] "
        + json.dumps(
            {
                "status": decision.ai_filter_status,
                "passes": decision.passes_ai_filter,
                "confidence": decision.ai_filter_confidence,
                "reason": decision.ai_filter_reason,
                "error_code": decision.ai_filter_error_code,
                "signals": decision.ai_filter_signals,
                "settings": settings.__dict__,
                "candidate": {
                    "title": str(candidate.get("role_title") or candidate.get("post_headline") or "")[:160],
                    "company": str(candidate.get("company_name") or "")[:120],
                    "contact": str(candidate.get("contact_channel_value") or "")[:120],
                    "source_url": str(candidate.get("source_url") or "")[:240],
                    "evidence_preview": str(candidate.get("source_evidence") or candidate.get("raw_excerpt") or "")[:500],
                },
                "provider_output": provider_output,
            },
            ensure_ascii=False,
            default=str,
        ),
        flush=True,
    )


def validate_ai_filter_output(output: object) -> dict[str, object] | None:
    if not isinstance(output, dict):
        return None
    confidence = output.get("confidence")
    reason = output.get("reason")
    passes = output.get("passes")
    if not isinstance(passes, bool):
        return None
    if not isinstance(reason, str) or not reason.strip():
        return None
    if not isinstance(confidence, int | float) or confidence < 0 or confidence > 1:
        return None
    signals = output.get("signals")
    if isinstance(signals, dict) and signals.get("is_job_seeker_post") is True:
        return {
            "passes": False,
            "reason": "AI identified this as a job seeker post rather than an employer/recruiter hiring post.",
            "confidence": float(confidence),
            "signals": signals,
        }
    return {
        "passes": passes,
        "reason": reason.strip(),
        "confidence": float(confidence),
        "signals": signals if isinstance(signals, dict) else {},
    }


def candidate_text(candidate: dict[str, object]) -> str:
    text = " ".join(
        str(candidate.get(key) or "")
        for key in ("role_title", "post_headline", "job_description", "source_evidence", "raw_excerpt")
    ).lower()
    return normalize_for_matching(text)


def normalize_for_matching(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = "".join(char for char in normalized if not unicodedata.combining(char))
    return ascii_text.encode("ascii", "ignore").decode("ascii").lower()


def detect_local_signals(text: str, settings: AIFilterSettings) -> dict[str, object]:
    work_mode = "unknown"
    if any(term in text for term in ("remote", "remoto", "remota", "work from home", "wfh", "home office")):
        work_mode = "remote"
    if any(term in text for term in ("hybrid", "hibrido", "híbrido")):
        work_mode = "mixed" if work_mode == "remote" else "hybrid"
    if any(term in text for term in ("onsite", "on-site", "presencial", "presential")):
        work_mode = "mixed" if work_mode in {"remote", "hybrid"} else "onsite"

    rejected_regions = [term for term in settings.excluded_regions if term.lower() in text]
    accepted_regions = [term for term in settings.accepted_regions if term.lower() in text]
    return {
        "detected_work_mode": work_mode,
        "accepted_regions": accepted_regions,
        "accepted_countries": [],
        "accepted_timezones": [],
        "rejected_regions": rejected_regions,
        "evidence_quotes": [],
    }


def apply_decision(candidate: dict[str, object], decision: AIFilterDecision) -> dict[str, object]:
    return {
        **candidate,
        "passes_ai_filter": decision.passes_ai_filter,
        "ai_filter_status": decision.ai_filter_status,
        "ai_filter_reason": decision.ai_filter_reason,
        "ai_filter_confidence": decision.ai_filter_confidence,
        "ai_filter_signals": decision.ai_filter_signals,
        "ai_filter_error_code": decision.ai_filter_error_code,
        "ai_filter_error_message": decision.ai_filter_error_message,
        "ai_filter_model_name": decision.ai_filter_model_name,
        "ai_filter_prompt_version": decision.ai_filter_prompt_version,
    }


AI_FILTER_SYSTEM_PROMPT = (
    "You are reviewing LinkedIn search results for a person looking for remote software job opportunities. "
    "Think like a careful human triaging posts, not like a keyword matcher. Return only valid JSON with "
    "fields: passes boolean, reason string, confidence number 0..1, and signals object. First decide who "
    "is speaking: employer, recruiter, hiring_manager, job_seeker, or unknown. Reject with high confidence "
    "when the post is a person advertising themselves, sharing a portfolio/CV, saying they are looking for "
    "a job/opportunity, or saying it is not a hiring post. Words like hiring, contratacao, vaga, recruiter, "
    "or opportunity do not matter by themselves; use the full meaning of the post. Pass only when there is "
    "at least one real hiring opportunity from a company, recruiter, founder, hiring manager, or team. For "
    "the user's filters, prefer remote opportunities and reject India/India-timezone roles. Do not require "
    "the exact word remote if the post is otherwise plausibly worldwide/LATAM/Brazil/Europe/Portugal-friendly, "
    "but reject when it clearly says onsite, hybrid-only, presential, relocation required, or India. If a post "
    "contains multiple roles, pass only if at least one role plausibly matches the requested stack and remote/"
    "region filters. Put explicit evidence in signals: speaker_type, is_job_seeker_post, has_real_job_opening, "
    "detected_work_mode, rejected_regions, candidate_fit_summary, missing_or_unclear_requirements, "
    "job_opening_evidence, evidence_quotes. "
    "If you are unsure, lower confidence below 0.70 so the system can fall back."
)


def openai_ai_filter_provider(api_key: str, model_name: str) -> Callable[[dict[str, object]], dict[str, object]]:
    def provider(payload: dict[str, object]) -> dict[str, object]:
        http_payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Evaluate whether a LinkedIn job candidate passes the requested filters. Return only valid JSON "
                        "with fields: passes boolean, reason string, confidence number 0..1, and signals object. "
                        "Pass only posts that appear to be from a company, recruiter, founder, hiring manager, or team "
                        "sharing at least one real job opening. Reject posts from people looking for work, portfolio/CV "
                        "posts, and posts that say they are not hiring, even if they contain words like hiring or "
                        "contratação. Treat excluded keywords as context-sensitive: reject only when the keyword describes "
                        "the role requirement or location, not when it appears in an unrelated sentence. If remote_only is "
                        "enabled, do not reject solely because the post omits the word remote; reject only when the evidence "
                        "clearly says onsite, hybrid, presential, relocation required, or a rejected region. If a post has "
                        "multiple roles and at least one plausible role matches the requested stack/region/work mode, pass "
                        "with the matching signals. Use fallback-friendly uncertainty: if evidence is ambiguous, use lower "
                        "confidence rather than inventing facts."
                    ),
                },
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }
        http_payload["messages"][0]["content"] = AI_FILTER_SYSTEM_PROMPT
        http_request = request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(http_payload).encode("utf-8"),
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(http_request, timeout=45) as response:
                raw_response = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            if exc.code == 429:
                raise RuntimeError("AI filter provider was rate-limited.") from exc
            raise RuntimeError(f"AI filter provider request failed with status {exc.code}.") from exc
        content = raw_response["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        if not isinstance(parsed, dict):
            raise RuntimeError("AI filter provider returned a non-object response.")
        return parsed

    return provider
