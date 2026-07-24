from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class CareerPageSource:
    key: str
    name: str
    domain: str
    active: bool = True
    enabled_by_default: bool = True


CURATED_CAREER_SOURCES: tuple[CareerPageSource, ...] = (
    CareerPageSource("inhire", "InHire", "inhire.app"),
    CareerPageSource("ashby", "Ashby", "jobs.ashbyhq.com"),
    CareerPageSource("lever", "Lever", "jobs.lever.co"),
    CareerPageSource("greenhouse", "Greenhouse", "boards.greenhouse.io"),
    CareerPageSource("smartrecruiters", "SmartRecruiters", "jobs.smartrecruiters.com"),
    CareerPageSource("trampos", "Trampos", "trampos.co"),
    CareerPageSource("catho", "Catho", "catho.com.br"),
    CareerPageSource("teamtailor", "Teamtailor", "jobs.teamtailor.com", active=False, enabled_by_default=False),
)


def list_curated_career_sources() -> list[dict[str, object]]:
    return [
        {
            "key": source.key,
            "name": source.name,
            "domain": source.domain,
            "active": source.active,
            "enabled_by_default": source.enabled_by_default and source.active,
        }
        for source in CURATED_CAREER_SOURCES
    ]


def source_by_key() -> dict[str, CareerPageSource]:
    return {source.key: source for source in CURATED_CAREER_SOURCES}


def active_source_keys() -> list[str]:
    return [source.key for source in CURATED_CAREER_SOURCES if source.active]


def validate_source_keys(source_keys: list[str] | None) -> list[str]:
    requested = source_keys or active_source_keys()
    known = {source.key for source in CURATED_CAREER_SOURCES}
    unknown = [key for key in requested if key not in known]
    if unknown:
        raise ValueError(f"Unknown curated source(s): {', '.join(unknown)}")
    active = {source.key for source in CURATED_CAREER_SOURCES if source.active}
    inactive = [key for key in requested if key not in active]
    if inactive:
        raise ValueError(f"Inactive curated source(s): {', '.join(inactive)}")
    deduped: list[str] = []
    for key in requested:
        if key not in deduped:
            deduped.append(key)
    if not deduped:
        raise ValueError("At least one curated source is required")
    return deduped


def match_curated_source(url: str, selected_source_keys: list[str] | None = None) -> CareerPageSource | None:
    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    hostname = (parsed.hostname or "").lower().removeprefix("www.")
    if not hostname:
        return None
    try:
        selected = set(validate_source_keys(selected_source_keys)) if selected_source_keys is not None else set(active_source_keys())
    except ValueError:
        return None
    for source in CURATED_CAREER_SOURCES:
        domain = source.domain.lower().removeprefix("www.")
        if source.key in selected and source.active and (hostname == domain or hostname.endswith(f".{domain}")):
            return source
    return None
