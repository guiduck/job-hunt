from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import json
import re
from urllib import error, parse, request

from app.core.config import WorkerSettings
from app.services.career_page_sources import CareerPageSource


@dataclass(frozen=True)
class CareerPageProviderResult:
    title: str
    link: str
    snippet: str
    source_key: str
    source_name: str
    source_query: str
    position: int | None = None
    external_job_id: str | None = None
    date_text: str | None = None
    result_age_days: int | None = None


RELATIVE_DATE_RE = re.compile(
    r"(?:\bha\s+|\bh[áa]\s+)?(\d+)\s+"
    r"(minute|minutes|minuto|minutos|hour|hours|hora|horas|day|days|dia|dias|week|weeks|semana|semanas|"
    r"month|months|mes|m[eê]s|meses|year|years|ano|anos)",
    re.IGNORECASE,
)


def result_age_days(date_text: str | None) -> int | None:
    if not date_text:
        return None
    text = date_text.strip().lower()
    match = RELATIVE_DATE_RE.search(text)
    if match:
        amount = int(match.group(1))
        unit = match.group(2)
        if unit.startswith(("minute", "minuto", "hour", "hora")):
            return 0
        if unit.startswith(("day", "dia")):
            return amount
        if unit.startswith(("week", "semana")):
            return amount * 7
        if unit.startswith(("month", "mes", "mês")):
            return amount * 30
        if unit.startswith(("year", "ano")):
            return amount * 365

    for fmt in ("%b %d, %Y", "%B %d, %Y", "%Y-%m-%d"):
        try:
            parsed = datetime.strptime(date_text.strip(), fmt).replace(tzinfo=UTC)
        except ValueError:
            continue
        return max(0, (datetime.now(UTC).date() - parsed.date()).days)

    return None


def build_recency_tbs(max_age_days: int) -> str:
    if max_age_days <= 1:
        return "qdr:d"
    if max_age_days <= 7:
        return "qdr:w"
    if max_age_days <= 31:
        return "qdr:m"
    if max_age_days <= 365:
        return "qdr:y"
    return ""


def build_source_query(source: CareerPageSource, keywords: list[str], search_query: str | None = None) -> str:
    terms = (search_query or " ".join(keywords)).strip()
    return f"site:{source.domain} {terms}".strip()


def fetch_serpapi_results(
    *,
    source: CareerPageSource,
    keywords: list[str],
    settings: WorkerSettings,
    search_query: str | None = None,
) -> list[CareerPageProviderResult]:
    if not settings.serpapi_api_key:
        raise RuntimeError("SERPAPI_API_KEY is not configured")

    query = build_source_query(source, keywords, search_query)
    params = parse.urlencode(
        {
            "engine": "google",
            "q": query,
            "api_key": settings.serpapi_api_key,
            "num": "10",
            "tbs": build_recency_tbs(settings.career_page_result_max_age_days),
        }
    )
    url = f"https://serpapi.com/search.json?{params}"
    try:
        with request.urlopen(url, timeout=settings.career_page_request_timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except error.URLError as exc:
        raise RuntimeError(str(exc)) from exc

    organic = payload.get("organic_results") if isinstance(payload, dict) else None
    if not isinstance(organic, list):
        return []
    results: list[CareerPageProviderResult] = []
    for item in organic:
        if not isinstance(item, dict):
            continue
        link = str(item.get("link") or "").strip()
        title = str(item.get("title") or "").strip()
        snippet = str(item.get("snippet") or item.get("rich_snippet", "") or "").strip()
        date_text = str(item.get("date") or "").strip() or None
        if not link:
            continue
        results.append(
            CareerPageProviderResult(
                title=title,
                link=link,
                snippet=snippet,
                source_key=source.key,
                source_name=source.name,
                source_query=query,
                position=item.get("position") if isinstance(item.get("position"), int) else None,
                external_job_id=str(item.get("job_id") or item.get("cached_page_link") or "") or None,
                date_text=date_text,
                result_age_days=result_age_days(date_text),
            )
        )
    return results
