from dataclasses import dataclass
from enum import StrEnum
from html import unescape
import re
from urllib.parse import quote_plus

import httpx


DEFAULT_HIRING_INTENT_TERMS = ["hiring", "contratando", "contratamos"]
DEFAULT_COLLECTION_SOURCE_TYPES = ["automatic_publication_search"]


class CollectionSourceType(StrEnum):
    AUTOMATIC_PUBLICATION_SEARCH = "automatic_publication_search"
    PROVIDED_URL = "provided_url"
    PROVIDED_PUBLIC_CONTENT = "provided_public_content"
    AUTHENTICATED_BROWSER_SEARCH = "authenticated_browser_search"


class ProviderStatus(StrEnum):
    NOT_STARTED = "not_started"
    COLLECTED = "collected"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    INACCESSIBLE = "inaccessible"
    EMPTY = "empty"
    FAILED = "failed"


class ContactPriority(StrEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"


@dataclass(frozen=True)
class CollectionInput:
    source_type: str
    source_url: str = ""
    provided_text: str = ""
    label: str = ""


class LinkedInProviderError(Exception):
    def __init__(self, status: ProviderStatus, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.status = status
        self.code = code or status.value


def build_publication_queries(
    keywords: list[str],
    hiring_intent_terms: list[str] | None = None,
) -> list[dict[str, str]]:
    terms = hiring_intent_terms or DEFAULT_HIRING_INTENT_TERMS
    queries: list[dict[str, str]] = []
    for term in terms:
        for keyword in keywords:
            normalized_term = term.strip()
            normalized_keyword = keyword.strip()
            if normalized_term and normalized_keyword:
                queries.append(
                    {
                        "hiring_intent_term": normalized_term,
                        "keyword": normalized_keyword,
                        "source_query": f"{normalized_term} {normalized_keyword}",
                    }
                )
    return queries


def normalize_collection_inputs(inputs: list[dict[str, object]] | None) -> list[CollectionInput]:
    normalized: list[CollectionInput] = []
    for item in inputs or []:
        source_type = str(item.get("source_type") or "").strip()
        if source_type not in {
            CollectionSourceType.PROVIDED_URL.value,
            CollectionSourceType.PROVIDED_PUBLIC_CONTENT.value,
            CollectionSourceType.AUTHENTICATED_BROWSER_SEARCH.value,
        }:
            continue
        normalized.append(
            CollectionInput(
                source_type=source_type,
                source_url=str(item.get("source_url") or ""),
                provided_text=str(item.get("provided_text") or ""),
                label=str(item.get("label") or ""),
            )
        )
    return normalized


def candidate_from_provided_input(item: CollectionInput, requested_keywords: list[str]) -> dict[str, object]:
    text = item.provided_text or item.label or item.source_url
    provider_name = (
        "linkedin_authenticated_browser"
        if item.source_type == CollectionSourceType.AUTHENTICATED_BROWSER_SEARCH.value
        else "user_provided"
    )
    return {
        "collection_source_type": item.source_type,
        "provider_name": provider_name,
        "provider_status": ProviderStatus.COLLECTED.value if text else ProviderStatus.EMPTY.value,
        "source_url": item.source_url,
        "source_query": item.label or item.source_url or "provided_public_content",
        "source_evidence": text,
        "raw_excerpt": text[:1000],
        "job_description": text,
        "matched_keywords": [keyword for keyword in requested_keywords if keyword.lower() in text.lower()],
    }


def text_from_html(html: str) -> str:
    without_scripts = re.sub(r"<(script|style).*?</\1>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    without_tags = re.sub(r"<[^>]+>", " ", without_scripts)
    return re.sub(r"\s+", " ", unescape(without_tags)).strip()


def is_linkedin_login_wall(text: str) -> bool:
    normalized = text.lower()
    login_markers = [
        "linkedin login, sign in",
        "sign in with apple",
        "sign in with a passkey",
        "new to linkedin? join now",
        "we've emailed a one-time link",
        "email or phone password",
    ]
    return "linkedin" in normalized and any(marker in normalized for marker in login_markers)


def fetch_public_text(url: str, timeout_seconds: float = 10.0, user_agent: str | None = None) -> str:
    headers = {"User-Agent": user_agent or "scrapper-freelance-worker/0.1"}
    try:
        response = httpx.get(url, headers=headers, timeout=timeout_seconds, follow_redirects=True)
    except httpx.TimeoutException as exc:
        raise LinkedInProviderError(ProviderStatus.INACCESSIBLE, "LinkedIn source timed out", "timeout") from exc
    except httpx.HTTPError as exc:
        raise LinkedInProviderError(ProviderStatus.FAILED, "LinkedIn source request failed", "request_failed") from exc

    if response.status_code in {401, 403, 429}:
        raise LinkedInProviderError(ProviderStatus.BLOCKED, f"LinkedIn source blocked with HTTP {response.status_code}")
    if response.status_code >= 400:
        raise LinkedInProviderError(ProviderStatus.INACCESSIBLE, f"LinkedIn source returned HTTP {response.status_code}")

    text = text_from_html(response.text)
    if not text:
        raise LinkedInProviderError(ProviderStatus.EMPTY, "LinkedIn source returned no readable text")
    if is_linkedin_login_wall(text):
        raise LinkedInProviderError(
            ProviderStatus.BLOCKED,
            "LinkedIn requires an authenticated browser session for this source",
            "login_required",
        )
    return text


def candidate_from_publication_query(
    query: dict[str, str],
    requested_keywords: list[str],
    timeout_seconds: float = 10.0,
    user_agent: str | None = None,
) -> dict[str, object]:
    search_url = (
        "https://www.linkedin.com/search/results/content/"
        f"?keywords={quote_plus(query['source_query'])}&origin=FACETED_SEARCH&sortBy=date_posted"
    )
    try:
        text = fetch_public_text(search_url, timeout_seconds=timeout_seconds, user_agent=user_agent)
    except LinkedInProviderError as exc:
        return {
            "collection_source_type": CollectionSourceType.AUTOMATIC_PUBLICATION_SEARCH.value,
            "hiring_intent_term": query["hiring_intent_term"],
            "provider_name": "linkedin_public_search",
            "provider_status": exc.status.value,
            "provider_error_code": exc.code,
            "source_url": search_url,
            "source_query": query["source_query"],
            "source_evidence": "",
            "raw_excerpt": "",
            "matched_keywords": [],
            "rejection_reason": str(exc),
        }

    return {
        "collection_source_type": CollectionSourceType.AUTOMATIC_PUBLICATION_SEARCH.value,
        "hiring_intent_term": query["hiring_intent_term"],
        "provider_name": "linkedin_public_search",
        "provider_status": ProviderStatus.COLLECTED.value,
        "source_url": search_url,
        "source_query": query["source_query"],
        "source_evidence": text[:1000],
        "raw_excerpt": text[:1000],
        "job_description": text,
        "matched_keywords": [keyword for keyword in requested_keywords if keyword.lower() in text.lower()],
    }


def collect_candidates(
    requested_keywords: list[str],
    hiring_intent_terms: list[str] | None = None,
    collection_inputs: list[dict[str, object]] | None = None,
    collection_source_types: list[str] | None = None,
    candidate_limit: int | None = None,
    timeout_seconds: float = 10.0,
    user_agent: str | None = None,
) -> list[dict[str, object]]:
    enabled_source_types = set(collection_source_types or [CollectionSourceType.AUTOMATIC_PUBLICATION_SEARCH.value])
    candidates: list[dict[str, object]] = []
    for item in normalize_collection_inputs(collection_inputs):
        if item.source_type not in enabled_source_types:
            continue
        if candidate_limit is not None and len(candidates) >= candidate_limit:
            break
        candidates.append(candidate_from_provided_input(item, requested_keywords))

    if CollectionSourceType.AUTOMATIC_PUBLICATION_SEARCH.value in enabled_source_types:
        for query in build_publication_queries(requested_keywords, hiring_intent_terms):
            if candidate_limit is not None and len(candidates) >= candidate_limit:
                break
            candidates.append(
                candidate_from_publication_query(
                    query,
                    requested_keywords,
                    timeout_seconds=timeout_seconds,
                    user_agent=user_agent,
                )
            )
    return candidates
