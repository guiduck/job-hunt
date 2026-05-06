from __future__ import annotations

import json
from urllib import error, request

from app.core.config import get_settings


class AIEmailGenerationError(RuntimeError):
    def __init__(self, message: str, *, code: str = "ai_generation_failed", retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


def generate_job_application_email(context: dict[str, object]) -> dict[str, str]:
    settings = get_settings()
    if not settings.openai_api_key or settings.openai_api_key == "sk-your-openai-api-key":
        raise AIEmailGenerationError(
            "OPENAI_API_KEY is missing or still using the placeholder value. Add a real backend key and recreate the API container.",
            code="openai_key_missing",
        )

    payload = {
        "model": settings.ai_email_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You write concise job application emails. Return only valid JSON with string fields "
                    "'subject' and 'body'. Sound natural, direct, and human-written. Treat the resume text and "
                    "operator profile as the only source of truth about the candidate. Do not invent experience, "
                    "years of experience, technologies, company details, compensation, availability, or personal facts. "
                    "If the job asks for a skill that is not present in the resume/profile context, do not claim it; "
                    "instead focus on relevant confirmed strengths. Never mention .NET, Java, Python, or any other "
                    "technology unless it appears in the resume/profile context. If a template reference is provided, "
                    "use it for tone and structure, but still obey the no-false-claims rule. Write the email in the "
                    "detected job post language from the provided language context. If portfolio_url is present, include "
                    "it naturally in the closing or signature."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(context, ensure_ascii=False),
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.6,
    }
    http_request = request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(http_request, timeout=45) as response:
            raw_response = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        openai_detail = _openai_error_detail(exc)
        if exc.code == 401:
            raise AIEmailGenerationError(
                "OpenAI rejected OPENAI_API_KEY (401). Confirm the key is valid, active, and the API container was recreated after changing `.env.local`.",
                code="openai_unauthorized",
            ) from exc
        if exc.code == 403:
            raise AIEmailGenerationError(
                f"OpenAI denied access to the request (403). {openai_detail or 'Check project permissions and model access.'}",
                code="openai_forbidden",
            ) from exc
        if exc.code == 429:
            raise AIEmailGenerationError(
                f"OpenAI rate limit or quota blocked generation (429). {openai_detail or 'Check billing, quota, and rate limits.'}",
                code="openai_rate_limited",
                retryable=True,
            ) from exc
        if exc.code == 400:
            raise AIEmailGenerationError(
                f"OpenAI rejected the generation request (400). {openai_detail or 'Check AI_EMAIL_MODEL and request format.'}",
                code="openai_bad_request",
            ) from exc
        raise AIEmailGenerationError(
            f"OpenAI request failed with HTTP {exc.code}. {openai_detail}".strip(),
            code=f"openai_http_{exc.code}",
            retryable=exc.code >= 500,
        ) from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise AIEmailGenerationError(f"Could not reach or parse OpenAI response: {exc}", code="openai_connection_failed", retryable=True) from exc

    content = raw_response.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(content, str):
        raise AIEmailGenerationError("OpenAI response did not include message content.")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise AIEmailGenerationError("OpenAI response was not valid JSON.") from exc

    subject = str(parsed.get("subject") or "").strip()
    body = str(parsed.get("body") or "").strip()
    if not subject or not body:
        raise AIEmailGenerationError("OpenAI response did not include both subject and body.")
    return {"subject": subject, "body": body}


def _openai_error_detail(exc: error.HTTPError) -> str:
    try:
        raw_body = exc.read().decode("utf-8")
        parsed = json.loads(raw_body)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return ""
    error_payload = parsed.get("error")
    if not isinstance(error_payload, dict):
        return ""
    message = error_payload.get("message")
    error_type = error_payload.get("type")
    error_code = error_payload.get("code")
    details = [str(part) for part in [message, error_type, error_code] if part]
    return " | ".join(details)
