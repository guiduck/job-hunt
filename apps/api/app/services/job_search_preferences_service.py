from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.job_search_preferences import JobSearchPreference
from app.models.opportunity import KeywordSet, KeywordSource, OpportunityType
from app.models.user import User
from app.schemas.job_search_preferences import JobSearchPreferenceRead, JobSearchPreferenceUpdate

MAX_SAVED_SEARCH_KEYWORDS = 30
DEFAULT_INTENT_TERMS = {"hiring", "contratando", "contratamos", "vaga", "vagas", "job", "jobs"}
SAVED_JOB_KEYWORD_SET_NAME = "Saved Full-time Search Keywords"


def normalize_search_keywords(input_text: str, *, fallback_to_text: bool = False) -> list[str]:
    keywords: list[str] = []
    seen: set[str] = set()
    for token in input_text.replace(",", " ").replace("\n", " ").replace("/", " ").split():
        normalized = token.strip().lower()
        if not normalized or normalized in DEFAULT_INTENT_TERMS or normalized in seen:
            continue
        seen.add(normalized)
        keywords.append(normalized)
    if keywords or not fallback_to_text:
        return keywords
    fallback = input_text.strip()
    return [fallback] if fallback else []


def merge_saved_search_keywords(existing: list[str], incoming: list[str], limit: int = MAX_SAVED_SEARCH_KEYWORDS) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for keyword in [*existing, *incoming]:
        normalized = keyword.strip().lower()
        if not normalized or normalized in DEFAULT_INTENT_TERMS or normalized in seen:
            continue
        seen.add(normalized)
        merged.append(normalized)
        if len(merged) >= limit:
            break
    return merged


def get_or_create_saved_keyword_set(db: Session, user: User) -> KeywordSet:
    keyword_set = db.scalar(
        select(KeywordSet).where(
            KeywordSet.user_id == user.id,
            KeywordSet.opportunity_type == OpportunityType.JOB.value,
            KeywordSet.source == KeywordSource.MANUAL.value,
            KeywordSet.is_active.is_(True),
            KeywordSet.is_default.is_(True),
        )
    )
    if keyword_set is not None:
        return keyword_set

    keyword_set = KeywordSet(
        user_id=user.id,
        name=SAVED_JOB_KEYWORD_SET_NAME,
        source=KeywordSource.MANUAL.value,
        opportunity_type=OpportunityType.JOB.value,
        terms=[],
        is_active=True,
        is_default=True,
    )
    db.add(keyword_set)
    db.commit()
    db.refresh(keyword_set)
    return keyword_set


def get_or_create_job_search_preference(db: Session, user: User) -> JobSearchPreference:
    preference = db.scalar(
        select(JobSearchPreference).where(
            JobSearchPreference.user_id == user.id,
            JobSearchPreference.opportunity_type == OpportunityType.JOB.value,
        )
    )
    if preference is not None:
        return preference

    preference = JobSearchPreference(user_id=user.id, opportunity_type=OpportunityType.JOB.value)
    db.add(preference)
    db.commit()
    db.refresh(preference)
    return preference


def read_job_search_preference(db: Session, user: User) -> JobSearchPreferenceRead:
    preference = get_or_create_job_search_preference(db, user)
    keyword_set = get_or_create_saved_keyword_set(db, user)
    return _to_read_model(preference, list(keyword_set.terms))


def update_job_search_preference(
    db: Session,
    payload: JobSearchPreferenceUpdate,
    user: User,
) -> JobSearchPreferenceRead:
    preference = get_or_create_job_search_preference(db, user)
    keyword_set = get_or_create_saved_keyword_set(db, user)
    search_text = payload.search_text.strip()
    keywords = normalize_search_keywords(search_text)

    if search_text:
        preference.last_search_text = search_text
        preference.last_search_keywords = keywords
    keyword_set.terms = merge_saved_search_keywords(list(keyword_set.terms), keywords)
    db.commit()
    db.refresh(preference)
    db.refresh(keyword_set)
    return _to_read_model(preference, list(keyword_set.terms))


def delete_saved_search_keyword(db: Session, keyword: str, user: User) -> JobSearchPreferenceRead | None:
    preference = get_or_create_job_search_preference(db, user)
    keyword_set = get_or_create_saved_keyword_set(db, user)
    target = keyword.strip().lower()
    existing = list(keyword_set.terms)
    remaining = [term for term in existing if term.strip().lower() != target]
    if len(remaining) == len(existing):
        return None
    keyword_set.terms = remaining
    db.commit()
    db.refresh(preference)
    db.refresh(keyword_set)
    return _to_read_model(preference, list(keyword_set.terms))


def _to_read_model(preference: JobSearchPreference, saved_keywords: list[str]) -> JobSearchPreferenceRead:
    return JobSearchPreferenceRead(
        opportunity_type="job",
        last_search_text=preference.last_search_text,
        last_search_keywords=list(preference.last_search_keywords),
        saved_keywords=saved_keywords[:MAX_SAVED_SEARCH_KEYWORDS],
        max_saved_keywords=MAX_SAVED_SEARCH_KEYWORDS,
        updated_at=preference.updated_at,
    )
