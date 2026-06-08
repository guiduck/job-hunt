from dataclasses import dataclass


@dataclass(frozen=True)
class CareerPageSource:
    key: str
    name: str
    domain: str
    active: bool = True


CURATED_CAREER_SOURCES: tuple[CareerPageSource, ...] = (
    CareerPageSource("inhire", "InHire", "inhire.app"),
    CareerPageSource("ashby", "Ashby", "jobs.ashbyhq.com"),
    CareerPageSource("lever", "Lever", "jobs.lever.co"),
    CareerPageSource("greenhouse", "Greenhouse", "boards.greenhouse.io"),
    CareerPageSource("smartrecruiters", "SmartRecruiters", "jobs.smartrecruiters.com"),
    CareerPageSource("trampos", "Trampos", "trampos.co"),
    CareerPageSource("catho", "Catho", "catho.com.br"),
)


def source_by_key() -> dict[str, CareerPageSource]:
    return {source.key: source for source in CURATED_CAREER_SOURCES}


def active_source_keys() -> list[str]:
    return [source.key for source in CURATED_CAREER_SOURCES if source.active]
