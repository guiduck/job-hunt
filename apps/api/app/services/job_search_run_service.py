from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import json
import re

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.job_search_run import (
    AIFilterStatus,
    JobCandidateOutcome,
    JobSearchCandidate,
    JobSearchKind,
    JobSearchRun,
    JobSearchRunStatus,
    LinkedInCollectionInput,
    ProviderStatus,
    SearchSortOrder,
)
from app.models.opportunity import ContactChannelType
from app.models.user import User
from app.schemas.job_search_run import CareerPageSearchRunCreate, JobSearchRunCreate, LinkedInJobsExternalCandidateCreate, LinkedInJobsExternalCandidateResult, LinkedInJobsExternalComplete, LinkedInJobsExternalProgressUpdate, LinkedInJobsExternalRunCreate, SearchAggregate, SearchHistoryResponse, SearchHistoryRun
from app.schemas.opportunity import JobDetailCreate, OpportunityCreate
from app.core.config import get_settings
from app.services.auth_service import ensure_default_local_user
from app.services.career_page_sources import match_curated_source, validate_source_keys
from app.services.job_dedupe import build_job_dedupe_key
from app.services.job_review_scoring import default_review_profile
from app.services.opportunity_service import create_opportunity, get_active_job_keywords, get_opportunity_by_dedupe_key


LINKEDIN_JOBS_EXTERNAL_STALE_AFTER = timedelta(minutes=5)

POSTER_NAME_PREFIXES = ("Publicação no feed ", "Publicacao no feed ", "PublicaÃ§Ã£o no feed ")


def extract_poster_name_from_evidence(text: str) -> str:
    value = text.strip()
    for prefix in POSTER_NAME_PREFIXES:
        if not value.startswith(prefix):
            continue
        remainder = value[len(prefix) :]
        if " - " in remainder:
            remainder = remainder.split(" - ", 1)[0]
            return dedupe_repeated_name(remainder.strip().rstrip("."))[:500]
        for separator in (" •", " â€¢"):
            if separator in remainder:
                remainder = remainder.split(separator, 1)[0]
                break
        else:
            parts = remainder.split()
            digit_index = next((index for index, part in enumerate(parts) if part[:1].isdigit()), None)
            remainder = " ".join(parts[:digit_index]) if digit_index is not None else remainder
        return dedupe_repeated_name(remainder.strip().rstrip("."))[:500]
    match = re.match(
        r"^Publica(?:ç|c)[aã]o no feed\s*(.+?)(?:\s+[-•]|\s+Seguir\b|\s+Follow\b|\s+\d|\s*$)",
        value,
        re.IGNORECASE,
    )
    if match:
        return dedupe_repeated_name(match.group(1).strip().rstrip("."))[:500]
    return ""


def dedupe_repeated_name(name: str) -> str:
    compact = name.strip()
    if len(compact) % 2 == 0:
        midpoint = len(compact) // 2
        first_half = compact[:midpoint]
        second_half = compact[midpoint:]
        if first_half.lower() == second_half.lower():
            return first_half.strip()

    parts = [part for part in name.split() if part]
    if len(parts) % 2 != 0:
        return name

    midpoint = len(parts) // 2
    first_half = " ".join(parts[:midpoint])
    second_half = " ".join(parts[midpoint:])
    return first_half if first_half == second_half else name


LINKEDIN_JOBS_REJECTED_OUTCOMES = {
    JobCandidateOutcome.SKIPPED_EASY_APPLY.value,
    JobCandidateOutcome.UNSUPPORTED_SOURCE.value,
    JobCandidateOutcome.FAILED_DECODE.value,
    JobCandidateOutcome.MISSING_EXTERNAL_APPLY.value,
    JobCandidateOutcome.INSPECTION_FAILED.value,
}


def _linkedin_jobs_diagnostics_from_payload(payload: object) -> dict[str, object]:
    data = payload.model_dump(mode="json") if hasattr(payload, "model_dump") else {}
    safe_keys = {
        "navigation_method",
        "pages_visited",
        "jobs_inspected",
        "external_links_found",
        "accepted",
        "skipped_easy_apply",
        "unsupported_source",
        "duplicates",
        "failures",
        "safe_message",
        "terminal_reason",
    }
    return {key: value for key, value in data.items() if key in safe_keys and value is not None}


def _utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def _is_stale_linkedin_jobs_external_run(run: JobSearchRun, now: datetime) -> bool:
    heartbeat = _utc(run.updated_at) or _utc(run.started_at) or _utc(run.created_at)
    return heartbeat is not None and now - heartbeat >= LINKEDIN_JOBS_EXTERNAL_STALE_AFTER


def _fail_stale_linkedin_jobs_external_run(run: JobSearchRun, now: datetime) -> None:
    run.status = JobSearchRunStatus.FAILED.value
    run.provider_status = ProviderStatus.FAILED.value
    run.provider_error_code = "stale_browser_capture"
    run.provider_error_message = "LinkedIn Jobs browser capture was interrupted before it could finalize."
    run.stop_reason = "stale_browser_capture"
    run.completed_at = now
    _merge_run_diagnostics(
        run,
        {
            "terminal_reason": "stale_browser_capture",
            "safe_message": "Previous LinkedIn Jobs browser capture was interrupted and marked failed before starting a new run.",
        },
    )

def _merge_run_diagnostics(run: JobSearchRun, diagnostics: dict[str, object]) -> None:
    current = dict(run.source_diagnostics or {})
    linkedin_jobs = dict(current.get("linkedin_jobs_external") or {})
    linkedin_jobs.update(diagnostics)
    current["linkedin_jobs_external"] = linkedin_jobs
    run.source_diagnostics = current
    if "navigation_method" in linkedin_jobs or "terminal_reason" in linkedin_jobs:
        metadata = dict(run.provider_metadata or {})
        metadata.update(
            {
                key: linkedin_jobs[key]
                for key in ("navigation_method", "terminal_reason")
                if key in linkedin_jobs
            }
        )
        run.provider_metadata = metadata


def _apply_linkedin_jobs_counters(run: JobSearchRun, diagnostics: dict[str, object]) -> None:
    if "jobs_inspected" in diagnostics:
        run.inspected_count = max(run.inspected_count, int(diagnostics["jobs_inspected"] or 0))
    if "accepted" in diagnostics:
        run.accepted_count = max(run.accepted_count, int(diagnostics["accepted"] or 0))
    if "duplicates" in diagnostics:
        run.duplicate_count = max(run.duplicate_count, int(diagnostics["duplicates"] or 0))
    rejected = sum(int(diagnostics.get(key) or 0) for key in ("skipped_easy_apply", "unsupported_source", "failures"))
    if rejected:
        run.rejected_count = max(run.rejected_count, rejected)


def create_linkedin_jobs_external_run(
    db: Session, payload: LinkedInJobsExternalRunCreate, user: User | None = None
) -> JobSearchRun:
    user = user or ensure_default_local_user(db)
    active_run = db.scalar(
        select(JobSearchRun)
        .where(
            JobSearchRun.user_id == user.id,
            JobSearchRun.search_kind == JobSearchKind.LINKEDIN_JOBS_EXTERNAL.value,
            JobSearchRun.status.in_([JobSearchRunStatus.PENDING.value, JobSearchRunStatus.RUNNING.value]),
        )
        .order_by(JobSearchRun.updated_at.desc())
    )
    if active_run:
        now = datetime.now(UTC)
        if not _is_stale_linkedin_jobs_external_run(active_run, now):
            raise ValueError("A LinkedIn Jobs external search is already pending or running")
        _fail_stale_linkedin_jobs_external_run(active_run, now)
        db.flush()
    selected_source_keys = validate_source_keys(payload.selected_source_keys)
    query_terms = list(payload.query_terms or [])
    search_text = (payload.search_text or "").strip()
    if not query_terms and search_text:
        query_terms = [term for term in re.split(r"[\s,;]+", search_text) if term]

    run = JobSearchRun(
        user_id=user.id,
        search_kind=JobSearchKind.LINKEDIN_JOBS_EXTERNAL.value,
        status=JobSearchRunStatus.PENDING.value,
        requested_keywords=query_terms,
        search_query=search_text,
        search_sort_order=SearchSortOrder.RELEVANT.value,
        selected_source_keys=selected_source_keys,
        source_diagnostics={
            "linkedin_jobs_external": {
                "pages_visited": 0,
                "jobs_inspected": 0,
                "external_links_found": 0,
                "accepted": 0,
                "skipped_easy_apply": 0,
                "unsupported_source": 0,
                "duplicates": 0,
                "failures": 0,
                "navigation_method": "unknown",
            }
        },
        source_name="LinkedIn Jobs",
        candidate_limit=None,
        accepted_limit=None,
        inspected_cap=payload.max_pages,
        provider_status=ProviderStatus.NOT_STARTED.value,
        provider_metadata={
            "search_mode": payload.search_mode.value,
            "query_terms": query_terms,
            "date_posted": payload.date_posted.value,
            "sort": payload.sort.value,
            "max_pages": payload.max_pages,
            "assisted_search_enabled": payload.assisted_search_enabled,
        },
        ai_filters_enabled=False,
        ai_filter_settings={},
        ai_filter_status=AIFilterStatus.SKIPPED.value,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def update_linkedin_jobs_external_run(
    db: Session, run: JobSearchRun, payload: LinkedInJobsExternalProgressUpdate
) -> JobSearchRun:
    if run.search_kind != JobSearchKind.LINKEDIN_JOBS_EXTERNAL.value:
        raise ValueError("Run is not a LinkedIn Jobs external search")
    if payload.status in {JobSearchRunStatus.PENDING, JobSearchRunStatus.RUNNING}:
        run.status = payload.status.value
    run.started_at = run.started_at or datetime.now(UTC)
    run.provider_status = ProviderStatus.PARTIAL.value
    diagnostics = _linkedin_jobs_diagnostics_from_payload(payload)
    _merge_run_diagnostics(run, diagnostics)
    _apply_linkedin_jobs_counters(run, diagnostics)
    db.commit()
    db.refresh(run)
    return run


def record_linkedin_jobs_external_candidate(
    db: Session, run: JobSearchRun, payload: LinkedInJobsExternalCandidateCreate
) -> LinkedInJobsExternalCandidateResult:
    if run.search_kind != JobSearchKind.LINKEDIN_JOBS_EXTERNAL.value:
        raise ValueError("Run is not a LinkedIn Jobs external search")

    outcome = payload.outcome.value
    canonical_url = (payload.canonical_apply_url or payload.decoded_apply_url or "").strip()
    source_key = payload.source_key
    source = match_curated_source(canonical_url, run.selected_source_keys) if canonical_url else None
    if outcome == JobCandidateOutcome.ACCEPTED.value:
        if not canonical_url or source is None:
            outcome = JobCandidateOutcome.UNSUPPORTED_SOURCE.value if canonical_url else JobCandidateOutcome.MISSING_EXTERNAL_APPLY.value
        else:
            source_key = source.key

    opportunity_id = None
    duplicate_id = None
    dedupe_key = build_job_dedupe_key(
        payload.company_name or "",
        payload.job_title or "",
        payload.job_title or "",
        list(run.requested_keywords or []),
        canonical_url,
        payload.linkedin_job_url or canonical_url,
    )
    existing = get_opportunity_by_dedupe_key(db, dedupe_key, user_id=run.user_id) if canonical_url else None
    if outcome == JobCandidateOutcome.ACCEPTED.value and existing is not None:
        outcome = JobCandidateOutcome.DUPLICATE.value
        opportunity_id = existing.id
        duplicate_id = existing.id
    elif outcome == JobCandidateOutcome.ACCEPTED.value:
        evidence = {
            "discovery_source": "linkedin_jobs_external",
            "run_id": run.id,
            "linkedin_job_url": payload.linkedin_job_url,
            "decoded_apply_url": payload.decoded_apply_url or canonical_url,
            "canonical_apply_url": canonical_url,
            "selected_source_key": source_key,
            "search_mode": (run.provider_metadata or {}).get("search_mode"),
            "page_number": payload.page_number,
            "position_on_page": payload.position_on_page,
        }
        opportunity = create_opportunity(
            db,
            OpportunityCreate(
                title=payload.job_title or "LinkedIn Jobs external application",
                organization_name=payload.company_name or "",
                source_name=f"LinkedIn Jobs / {source.name if source else source_key}",
                source_url=payload.linkedin_job_url or canonical_url,
                source_query=run.search_query or "LinkedIn Jobs default browse",
                source_evidence=json.dumps(evidence, sort_keys=True),
                job_detail=JobDetailCreate(
                    company_name=payload.company_name or "",
                    role_title=payload.job_title or "",
                    post_headline=payload.job_title or "LinkedIn Jobs external application",
                    job_description=payload.location_text or "",
                    contact_channel_type=ContactChannelType.OTHER_PUBLIC_CONTACT,
                    contact_channel_value=canonical_url,
                    application_url=canonical_url,
                    linkedin_url=payload.linkedin_job_url or "",
                    collection_source_type="linkedin_jobs_external",
                    matched_keywords=list(run.requested_keywords or []),
                    dedupe_key=dedupe_key,
                    review_profile=default_review_profile(matched_keywords=list(run.requested_keywords or [])),
                ),
            ),
            user_id=run.user_id,
        )
        opportunity_id = opportunity.id

    row = JobSearchCandidate(
        user_id=run.user_id,
        run_id=run.id,
        opportunity_id=opportunity_id,
        outcome=outcome,
        company_name=payload.company_name or "",
        role_title=payload.job_title or "",
        contact_channel_type=ContactChannelType.OTHER_PUBLIC_CONTACT.value if canonical_url else None,
        contact_channel_value=canonical_url or None,
        collection_source_type="linkedin_jobs_external",
        provider_name="extension",
        provider_status=ProviderStatus.COLLECTED.value if outcome == JobCandidateOutcome.ACCEPTED.value else ProviderStatus.EMPTY.value,
        application_url=canonical_url or None,
        application_kind="external_application" if canonical_url else None,
        selected_source_key=source_key,
        source_name="LinkedIn Jobs",
        provider_metadata={
            "apply_button_kind": payload.apply_button_kind.value,
            "raw_apply_href": payload.raw_apply_href,
            "decoded_apply_url": payload.decoded_apply_url,
            "canonical_apply_url": canonical_url or None,
            "page_number": payload.page_number,
            "position_on_page": payload.position_on_page,
            "location_text": payload.location_text,
            "duplicate_of_opportunity_id": duplicate_id,
        },
        source_url=payload.linkedin_job_url or canonical_url or "",
        source_query=run.search_query or "LinkedIn Jobs default browse",
        source_evidence=payload.skip_reason or payload.decoded_apply_url or canonical_url or None,
        matched_keywords=list(run.requested_keywords or []),
        analysis_status="skipped" if outcome != JobCandidateOutcome.ACCEPTED.value else "deterministic_only",
        ai_filter_status=AIFilterStatus.SKIPPED.value,
        normalized_company_name=payload.company_name or None,
        normalized_role_title=payload.job_title or None,
        raw_excerpt=payload.location_text or None,
        dedupe_key=dedupe_key if canonical_url else None,
        rejection_reason=payload.skip_reason if outcome != JobCandidateOutcome.ACCEPTED.value else None,
        inspected_at=datetime.now(UTC),
    )
    db.add(row)
    db.flush()
    db.expire(run, ["candidates"])
    reconcile_run_counters(run)
    db.commit()
    db.refresh(row)
    return LinkedInJobsExternalCandidateResult(
        candidate_id=row.id,
        outcome=JobCandidateOutcome(outcome),
        opportunity_id=opportunity_id,
        duplicate_of_opportunity_id=duplicate_id,
    )


def complete_linkedin_jobs_external_run(
    db: Session, run: JobSearchRun, payload: LinkedInJobsExternalComplete
) -> JobSearchRun:
    if run.search_kind != JobSearchKind.LINKEDIN_JOBS_EXTERNAL.value:
        raise ValueError("Run is not a LinkedIn Jobs external search")
    diagnostics = _linkedin_jobs_diagnostics_from_payload(payload)
    _merge_run_diagnostics(run, diagnostics)
    reconcile_run_counters(run)
    _apply_linkedin_jobs_counters(run, diagnostics)
    run.stop_reason = payload.terminal_reason
    run.completed_at = datetime.now(UTC)
    if payload.status == JobSearchRunStatus.FAILED:
        run.status = JobSearchRunStatus.FAILED.value
        run.provider_status = ProviderStatus.FAILED.value
        run.provider_error_code = payload.terminal_reason
    elif payload.status == JobSearchRunStatus.CANCELLED:
        run.status = JobSearchRunStatus.CANCELLED.value
        run.provider_status = ProviderStatus.PARTIAL.value
    elif run.accepted_count > 0:
        run.status = JobSearchRunStatus.COMPLETED.value
        run.provider_status = ProviderStatus.COLLECTED.value
    else:
        run.status = JobSearchRunStatus.COMPLETED_NO_RESULTS.value
        run.provider_status = ProviderStatus.EMPTY.value
    db.commit()
    db.refresh(run)
    return run

def create_job_search_run(db: Session, payload: JobSearchRunCreate, user: User | None = None) -> JobSearchRun:
    user = user or ensure_default_local_user(db)
    keyword_set = None
    keywords = payload.keywords
    if not keywords:
        keyword_set, keywords = get_active_job_keywords(db, user=user)

    run = JobSearchRun(
        user_id=user.id,
        search_kind=JobSearchKind.LINKEDIN.value,
        status=JobSearchRunStatus.PENDING.value,
        keyword_set_id=payload.keyword_set_id or (keyword_set.id if keyword_set else None),
        requested_keywords=list(keywords),
        search_query=payload.search_query or " ".join(keywords),
        search_sort_order=payload.search_sort_order.value,
        hiring_intent_terms=list(payload.hiring_intent_terms),
        collection_source_types=[source_type.value for source_type in payload.collection_source_types],
        provided_source_count=len(payload.collection_inputs),
        candidate_limit=payload.candidate_limit,
        provider_status=ProviderStatus.NOT_STARTED.value,
        raw_linkedin_result_count=payload.raw_linkedin_result_count,
        raw_linkedin_result_count_source=payload.raw_linkedin_result_count_source,
        ai_filters_enabled=payload.ai_filters_enabled,
        ai_filter_settings=payload.ai_filter_settings.model_dump() if payload.ai_filters_enabled else {},
        ai_filter_status=AIFilterStatus.SKIPPED.value,
    )
    db.add(run)
    for collection_input in payload.collection_inputs:
        db.add(
            LinkedInCollectionInput(
                user_id=user.id,
                run=run,
                source_type=collection_input.source_type.value,
                source_url=collection_input.source_url,
                provided_text=collection_input.provided_text,
                label=collection_input.label,
            )
        )
    db.commit()
    db.refresh(run)
    return run


def create_career_page_search_run(db: Session, payload: CareerPageSearchRunCreate, user: User | None = None) -> JobSearchRun:
    settings = get_settings()
    if settings.career_page_search_provider == "serpapi" and not settings.serpapi_api_key:
        raise RuntimeError("Career-page search provider is not configured")

    user = user or ensure_default_local_user(db)
    active_run = db.scalar(
        select(JobSearchRun).where(
            JobSearchRun.user_id == user.id,
            JobSearchRun.search_kind == JobSearchKind.CAREER_PAGE.value,
            JobSearchRun.status.in_([JobSearchRunStatus.PENDING.value, JobSearchRunStatus.RUNNING.value]),
        )
    )
    if active_run:
        raise ValueError("A career-page search is already pending or running")

    keyword_set = None
    keywords = payload.keywords
    if not keywords:
        keyword_set, keywords = get_active_job_keywords(db, user=user)
    selected_source_keys = validate_source_keys(payload.selected_source_keys)
    accepted_limit = payload.accepted_limit or settings.career_page_default_accepted_limit
    inspected_cap = payload.inspected_cap or settings.career_page_default_inspected_cap

    run = JobSearchRun(
        user_id=user.id,
        search_kind=JobSearchKind.CAREER_PAGE.value,
        status=JobSearchRunStatus.PENDING.value,
        keyword_set_id=payload.keyword_set_id or (keyword_set.id if keyword_set else None),
        requested_keywords=list(keywords),
        search_query=payload.search_query or " ".join(keywords),
        hiring_intent_terms=[],
        collection_source_types=[],
        selected_source_keys=selected_source_keys,
        source_diagnostics={key: {"status": "pending"} for key in selected_source_keys},
        source_name="Career pages",
        candidate_limit=inspected_cap,
        accepted_limit=accepted_limit,
        inspected_cap=inspected_cap,
        provider_status=ProviderStatus.NOT_STARTED.value,
        provider_metadata={"provider": settings.career_page_search_provider},
        ai_filters_enabled=payload.ai_filters_enabled,
        ai_filter_settings=payload.ai_filter_settings.model_dump() if payload.ai_filters_enabled else {},
        ai_filter_status=AIFilterStatus.SKIPPED.value,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def list_job_search_runs(
    db: Session,
    status: str | None = None,
    limit: int = 20,
    provider_status: str | None = None,
    analysis_status: str | None = None,
    ai_filter_status: str | None = None,
    user: User | None = None,
) -> list[JobSearchRun]:
    statement = select(JobSearchRun).order_by(JobSearchRun.created_at.desc()).limit(limit)
    if user:
        statement = statement.where(JobSearchRun.user_id == user.id)
    if status:
        statement = statement.where(JobSearchRun.status == status)
    if provider_status:
        statement = statement.where(JobSearchRun.provider_status == provider_status)
    if analysis_status:
        statement = statement.where(JobSearchRun.analysis_status == analysis_status)
    if ai_filter_status:
        statement = statement.where(JobSearchRun.ai_filter_status == ai_filter_status)
    return list(db.scalars(statement))


def get_job_search_run(db: Session, run_id: str, user: User | None = None) -> JobSearchRun | None:
    statement = (
        select(JobSearchRun)
        .options(selectinload(JobSearchRun.candidates), selectinload(JobSearchRun.collection_inputs))
        .where(JobSearchRun.id == run_id)
    )
    if user:
        statement = statement.where(JobSearchRun.user_id == user.id)
    return db.scalar(statement)


def get_latest_job_search_run(
    db: Session,
    *,
    search_kind: str,
    user: User | None = None,
) -> JobSearchRun | None:
    statement = (
        select(JobSearchRun)
        .options(selectinload(JobSearchRun.collection_inputs))
        .where(JobSearchRun.search_kind == search_kind)
        .order_by(JobSearchRun.created_at.desc())
        .limit(1)
    )
    if user:
        statement = statement.where(JobSearchRun.user_id == user.id)
    return db.scalar(statement)



@dataclass
class _AggregateBucket:
    value: str
    run_count: int = 0
    total_raw: int = 0
    known_raw_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0
    duplicate_count: int = 0
    latest_run_at: datetime | None = None

    def add_run(self, run: JobSearchRun) -> None:
        self.run_count += 1
        if run.raw_linkedin_result_count is not None:
            self.total_raw += run.raw_linkedin_result_count
            self.known_raw_count += 1
        self.accepted_count += run.accepted_count
        self.rejected_count += run.rejected_count
        self.duplicate_count += run.duplicate_count
        run_at = run.completed_at or run.started_at or run.created_at
        if self.latest_run_at is None or run_at > self.latest_run_at:
            self.latest_run_at = run_at

    def to_schema(self) -> SearchAggregate:
        total_raw = self.total_raw if self.known_raw_count > 0 else None
        average_raw = round(self.total_raw / self.known_raw_count, 2) if self.known_raw_count > 0 else None
        return SearchAggregate(
            value=self.value,
            run_count=self.run_count,
            total_raw_linkedin_results=total_raw,
            average_raw_linkedin_results=average_raw,
            latest_run_at=self.latest_run_at,
            accepted_count=self.accepted_count,
            rejected_count=self.rejected_count,
            duplicate_count=self.duplicate_count,
        )


def _safe_diagnostic_message(run: JobSearchRun) -> str | None:
    message = run.error_message or run.provider_error_message or run.provider_error_code or run.stop_reason
    if not message:
        return None
    return str(message)[:500]


def _query_label(run: JobSearchRun) -> str:
    query = (run.search_query or "").strip()
    if query:
        return query.lower()
    return " ".join(run.requested_keywords or []).strip().lower()


def _keyword_tokens(run: JobSearchRun) -> list[str]:
    raw_terms = list(run.requested_keywords or [])
    if not raw_terms and run.search_query:
        raw_terms = re.split(r"[\s,;]+", run.search_query)
    seen: set[str] = set()
    tokens: list[str] = []
    for term in raw_terms:
        token = re.sub(r"^[^\w+#.-]+|[^\w+#.-]+$", "", str(term).strip().lower())
        if token and token not in seen:
            seen.add(token)
            tokens.append(token)
    return tokens


def _rank_aggregates(buckets: dict[str, _AggregateBucket], limit: int) -> list[SearchAggregate]:
    ranked = sorted(
        buckets.values(),
        key=lambda bucket: (
            bucket.total_raw if bucket.known_raw_count > 0 else -1,
            bucket.run_count,
            bucket.accepted_count,
            bucket.latest_run_at or datetime.min.replace(tzinfo=UTC),
            bucket.value,
        ),
        reverse=True,
    )
    return [bucket.to_schema() for bucket in ranked[:limit]]


def get_linkedin_search_history(
    db: Session,
    *,
    limit: int = 20,
    aggregate_limit: int = 20,
    status: str | None = None,
    q: str | None = None,
    user: User | None = None,
) -> SearchHistoryResponse:
    user = user or ensure_default_local_user(db)
    statement = (
        select(JobSearchRun)
        .where(JobSearchRun.user_id == user.id, JobSearchRun.search_kind == JobSearchKind.LINKEDIN.value)
        .order_by(JobSearchRun.created_at.desc())
    )
    if status:
        statement = statement.where(JobSearchRun.status == status)

    all_runs = list(db.scalars(statement))
    query_filter = q.strip().lower() if q else ""
    visible_runs = [
        run
        for run in all_runs
        if not query_filter
        or query_filter in (run.search_query or "").lower()
        or any(query_filter in keyword.lower() for keyword in (run.requested_keywords or []))
    ]

    history_runs = [
        SearchHistoryRun(
            id=run.id,
            status=JobSearchRunStatus(run.status),
            search_query=run.search_query,
            requested_keywords=run.requested_keywords or [],
            search_sort_order=SearchSortOrder(run.search_sort_order),
            raw_linkedin_result_count=run.raw_linkedin_result_count,
            raw_linkedin_result_count_source=run.raw_linkedin_result_count_source,
            inspected_count=run.inspected_count,
            accepted_count=run.accepted_count,
            rejected_count=run.rejected_count,
            duplicate_count=run.duplicate_count,
            ai_filter_inspected_count=run.ai_filter_inspected_count,
            ai_filter_passed_count=run.ai_filter_passed_count,
            ai_filter_rejected_count=run.ai_filter_rejected_count,
            ai_filter_fallback_count=run.ai_filter_fallback_count,
            ai_filter_failed_count=run.ai_filter_failed_count,
            ai_filter_skipped_count=run.ai_filter_skipped_count,
            provider_status=ProviderStatus(run.provider_status),
            diagnostic_message=_safe_diagnostic_message(run),
            started_at=run.started_at,
            completed_at=run.completed_at,
            created_at=run.created_at,
        )
        for run in visible_runs[:limit]
    ]

    query_buckets: dict[str, _AggregateBucket] = {}
    keyword_buckets: dict[str, _AggregateBucket] = {}
    for run in all_runs:
        query_label = _query_label(run)
        if query_label:
            query_buckets.setdefault(query_label, _AggregateBucket(query_label)).add_run(run)
        for token in _keyword_tokens(run):
            keyword_buckets.setdefault(token, _AggregateBucket(token)).add_run(run)

    return SearchHistoryResponse(
        runs=history_runs,
        query_aggregates=_rank_aggregates(query_buckets, aggregate_limit),
        keyword_aggregates=_rank_aggregates(keyword_buckets, aggregate_limit),
    )

def list_candidates(
    db: Session,
    run_id: str,
    outcome: str | None = None,
    collection_source_type: str | None = None,
    analysis_status: str | None = None,
    ai_filter_status: str | None = None,
    min_score: int | None = None,
    user: User | None = None,
) -> list[JobSearchCandidate]:
    statement = select(JobSearchCandidate).where(JobSearchCandidate.run_id == run_id)
    if user:
        statement = statement.where(JobSearchCandidate.user_id == user.id)
    if outcome:
        statement = statement.where(JobSearchCandidate.outcome == outcome)
    if collection_source_type:
        statement = statement.where(JobSearchCandidate.collection_source_type == collection_source_type)
    if analysis_status:
        statement = statement.where(JobSearchCandidate.analysis_status == analysis_status)
    if ai_filter_status:
        statement = statement.where(JobSearchCandidate.ai_filter_status == ai_filter_status)
    if min_score is not None:
        statement = statement.where(JobSearchCandidate.match_score >= min_score)
    return list(db.scalars(statement))


def start_run(db: Session, run: JobSearchRun) -> JobSearchRun:
    run.status = JobSearchRunStatus.RUNNING.value
    run.started_at = datetime.now(UTC)
    db.commit()
    db.refresh(run)
    return run


def aggregate_provider_status(candidates: list[JobSearchCandidate]) -> str:
    statuses = [candidate.provider_status or ProviderStatus.COLLECTED.value for candidate in candidates]
    if not statuses:
        return ProviderStatus.EMPTY.value
    success = any(status == ProviderStatus.COLLECTED.value for status in statuses)
    failures = [
        status
        for status in statuses
        if status
        in {
            ProviderStatus.BLOCKED.value,
            ProviderStatus.INACCESSIBLE.value,
            ProviderStatus.EMPTY.value,
            ProviderStatus.FAILED.value,
        }
    ]
    if success and failures:
        return ProviderStatus.PARTIAL.value
    if success:
        return ProviderStatus.COLLECTED.value
    unique_failures = set(failures)
    if len(unique_failures) == 1:
        return unique_failures.pop()
    return ProviderStatus.FAILED.value


def reconcile_run_counters(run: JobSearchRun) -> None:
    candidates = list(run.candidates)
    run.inspected_count = len(candidates)
    run.accepted_count = sum(1 for candidate in candidates if candidate.outcome == JobCandidateOutcome.ACCEPTED.value)
    run.duplicate_count = sum(1 for candidate in candidates if candidate.outcome == JobCandidateOutcome.DUPLICATE.value)
    run.rejected_count = sum(
        1
        for candidate in candidates
        if candidate.outcome
        in {
            JobCandidateOutcome.REJECTED_NO_CONTACT.value,
            JobCandidateOutcome.REJECTED_WEAK_MATCH.value,
            JobCandidateOutcome.REJECTED_MISSING_EVIDENCE.value,
            JobCandidateOutcome.REJECTED_AI_FILTER.value,
            JobCandidateOutcome.FAILED_AI_FILTER.value,
            JobCandidateOutcome.FAILED_PARSE.value,
            JobCandidateOutcome.FAILED_PROVIDER.value,
            JobCandidateOutcome.BLOCKED_SOURCE.value,
            JobCandidateOutcome.INACCESSIBLE_SOURCE.value,
            JobCandidateOutcome.EMPTY_SOURCE.value,
        }
    )
    run.cap_reached = bool(run.candidate_limit and run.inspected_count >= run.candidate_limit)
    run.provider_status = aggregate_provider_status(candidates)
    run.deterministic_only_count = sum(1 for candidate in candidates if candidate.analysis_status == "deterministic_only")
    run.ai_assisted_count = sum(1 for candidate in candidates if candidate.analysis_status == "ai_assisted")
    run.analysis_fallback_count = sum(1 for candidate in candidates if candidate.analysis_status == "fallback")
    run.analysis_failed_count = sum(1 for candidate in candidates if candidate.analysis_status == "failed")
    run.analysis_skipped_count = sum(1 for candidate in candidates if candidate.analysis_status == "skipped")
    inspected_statuses = {
        AIFilterStatus.PASSED.value,
        AIFilterStatus.REJECTED.value,
        AIFilterStatus.FALLBACK.value,
        AIFilterStatus.FAILED.value,
    }
    run.ai_filter_inspected_count = sum(1 for candidate in candidates if candidate.ai_filter_status in inspected_statuses)
    run.ai_filter_passed_count = sum(1 for candidate in candidates if candidate.ai_filter_status == AIFilterStatus.PASSED.value)
    run.ai_filter_rejected_count = sum(1 for candidate in candidates if candidate.ai_filter_status == AIFilterStatus.REJECTED.value)
    run.ai_filter_fallback_count = sum(1 for candidate in candidates if candidate.ai_filter_status == AIFilterStatus.FALLBACK.value)
    run.ai_filter_failed_count = sum(1 for candidate in candidates if candidate.ai_filter_status == AIFilterStatus.FAILED.value)
    run.ai_filter_skipped_count = sum(1 for candidate in candidates if candidate.ai_filter_status == AIFilterStatus.SKIPPED.value)
    if run.ai_filter_failed_count:
        run.ai_filter_status = AIFilterStatus.FAILED.value
    elif run.ai_filter_rejected_count:
        run.ai_filter_status = AIFilterStatus.REJECTED.value
    elif run.ai_filter_fallback_count:
        run.ai_filter_status = AIFilterStatus.FALLBACK.value
    elif run.ai_filter_passed_count:
        run.ai_filter_status = AIFilterStatus.PASSED.value
    else:
        run.ai_filter_status = AIFilterStatus.SKIPPED.value
    if run.analysis_failed_count:
        run.analysis_status = "failed"
    elif run.analysis_fallback_count:
        run.analysis_status = "fallback"
    elif run.ai_assisted_count:
        run.analysis_status = "ai_assisted"
    elif run.analysis_skipped_count and not run.deterministic_only_count:
        run.analysis_status = "skipped"
    else:
        run.analysis_status = "deterministic_only"


def finish_run(db: Session, run: JobSearchRun) -> JobSearchRun:
    reconcile_run_counters(run)
    if run.accepted_count > 0:
        run.status = JobSearchRunStatus.COMPLETED.value
    else:
        run.status = JobSearchRunStatus.COMPLETED_NO_RESULTS.value
    run.completed_at = datetime.now(UTC)
    db.commit()
    db.refresh(run)
    return run


def fail_run(
    db: Session,
    run: JobSearchRun,
    error_message: str,
    provider_error_code: str | None = None,
) -> JobSearchRun:
    run.status = JobSearchRunStatus.FAILED.value
    run.error_message = error_message
    run.provider_status = ProviderStatus.FAILED.value
    run.provider_error_code = provider_error_code
    run.provider_error_message = error_message
    run.completed_at = datetime.now(UTC)
    db.commit()
    db.refresh(run)
    return run


def recover_stale_running_runs(db: Session) -> int:
    message = "Run was left running before worker startup and was not retried automatically."
    runs = list(db.scalars(select(JobSearchRun).where(JobSearchRun.status == JobSearchRunStatus.RUNNING.value)))
    for run in runs:
        fail_run(db, run, message, provider_error_code="stale_running")
    return len(runs)


def record_candidate(db: Session, run: JobSearchRun, candidate: dict[str, object]) -> JobSearchCandidate:
    run.inspected_count += 1
    if run.candidate_limit and run.inspected_count >= run.candidate_limit:
        run.cap_reached = True

    matched_keywords = [str(value) for value in candidate.get("matched_keywords", [])]
    contact_value = str(candidate.get("contact_channel_value") or "")
    contact_channel_type = str(candidate.get("contact_channel_type") or ContactChannelType.EMAIL.value)
    if contact_channel_type not in {item.value for item in ContactChannelType}:
        contact_channel_type = ContactChannelType.EMAIL.value
    contact_priority = str(candidate.get("contact_priority") or "")
    source_evidence = str(candidate.get("source_evidence") or "")
    source_query = str(candidate.get("source_query") or " ".join(run.requested_keywords))
    source_name = str(candidate.get("source_name") or ("Career pages" if run.search_kind == JobSearchKind.CAREER_PAGE.value else "LinkedIn"))
    application_url = str(candidate.get("application_url") or "")
    application_kind = str(candidate.get("application_kind") or ("external_application" if application_url and contact_channel_type != ContactChannelType.EMAIL.value else "email"))
    provider_status = str(candidate.get("provider_status") or ProviderStatus.COLLECTED.value)
    review_profile = candidate.get("review_profile") if isinstance(candidate.get("review_profile"), dict) else default_review_profile(matched_keywords=matched_keywords)
    ai_filter_status = str(candidate.get("ai_filter_status") or AIFilterStatus.FALLBACK.value)
    passes_ai_filter = candidate.get("passes_ai_filter")

    dedupe_key = build_job_dedupe_key(
        str(candidate.get("company_name") or ""),
        str(candidate.get("role_title") or ""),
        str(candidate.get("post_headline") or ""),
        matched_keywords,
        contact_value,
        str(candidate.get("source_url") or ""),
    )

    outcome = JobCandidateOutcome.ACCEPTED.value
    rejection_reason = None
    opportunity_id = None

    if provider_status in {ProviderStatus.BLOCKED.value, ProviderStatus.INACCESSIBLE.value, ProviderStatus.EMPTY.value, ProviderStatus.FAILED.value}:
        outcome_map = {
            ProviderStatus.BLOCKED.value: JobCandidateOutcome.BLOCKED_SOURCE.value,
            ProviderStatus.INACCESSIBLE.value: JobCandidateOutcome.INACCESSIBLE_SOURCE.value,
            ProviderStatus.EMPTY.value: JobCandidateOutcome.EMPTY_SOURCE.value,
            ProviderStatus.FAILED.value: JobCandidateOutcome.FAILED_PROVIDER.value,
        }
        outcome = outcome_map[provider_status]
        rejection_reason = str(candidate.get("rejection_reason") or candidate.get("provider_error_message") or provider_status)
    elif not contact_value:
        outcome = JobCandidateOutcome.REJECTED_NO_CONTACT.value
        rejection_reason = "Missing public email or contact channel"
    elif contact_channel_type == ContactChannelType.LINKEDIN.value and not str(candidate.get("poster_profile_url") or ""):
        outcome = JobCandidateOutcome.REJECTED_NO_CONTACT.value
        rejection_reason = "Missing LinkedIn poster profile URL"
    elif not source_evidence:
        outcome = JobCandidateOutcome.REJECTED_MISSING_EVIDENCE.value
        rejection_reason = "Missing source evidence"
    elif ai_filter_status == AIFilterStatus.REJECTED.value or passes_ai_filter is False:
        outcome = JobCandidateOutcome.REJECTED_AI_FILTER.value
        rejection_reason = str(candidate.get("ai_filter_reason") or "Rejected by AI filters")
    elif ai_filter_status == AIFilterStatus.FAILED.value:
        outcome = JobCandidateOutcome.FAILED_AI_FILTER.value
        rejection_reason = str(candidate.get("ai_filter_error_message") or candidate.get("ai_filter_reason") or "AI filter evaluation failed")
    else:
        existing = get_opportunity_by_dedupe_key(db, dedupe_key, user_id=run.user_id)
        if existing is not None:
            outcome = JobCandidateOutcome.DUPLICATE.value
            opportunity_id = existing.id
            run.duplicate_count += 1
        else:
            opportunity = create_opportunity(
                db,
                OpportunityCreate(
                    title=str(candidate.get("poster_name") or "") or extract_poster_name_from_evidence(source_evidence),
                    organization_name=str(candidate.get("company_name") or ""),
                    source_name=source_name,
                    source_url=str(candidate.get("source_url") or ""),
                    source_query=source_query,
                    source_evidence=source_evidence,
                    job_detail=JobDetailCreate(
                        company_name=str(candidate.get("company_name") or ""),
                        role_title=str(candidate.get("role_title") or ""),
                        post_headline=str(candidate.get("post_headline") or ""),
                        job_description=str(candidate.get("job_description") or ""),
                        contact_channel_type=ContactChannelType(contact_channel_type),
                        contact_channel_value=contact_value,
                        contact_email=contact_value if contact_channel_type == ContactChannelType.EMAIL.value else None,
                        application_url=application_url or str(candidate.get("source_url") or "") or None,
                        linkedin_url=str(candidate.get("source_url") or ""),
                        poster_profile_url=str(candidate.get("poster_profile_url") or ""),
                        contact_priority=contact_priority or None,
                        hiring_intent_term=str(candidate.get("hiring_intent_term") or ""),
                        collection_source_type=str(candidate.get("collection_source_type") or ""),
                        matched_keywords=matched_keywords,
                        dedupe_key=dedupe_key,
                        review_profile=review_profile,
                    ),
                ),
                user_id=run.user_id,
            )
            opportunity_id = opportunity.id
            run.accepted_count += 1

    if outcome.startswith("rejected") or outcome in {
        JobCandidateOutcome.FAILED_PROVIDER.value,
        JobCandidateOutcome.BLOCKED_SOURCE.value,
        JobCandidateOutcome.INACCESSIBLE_SOURCE.value,
        JobCandidateOutcome.EMPTY_SOURCE.value,
    }:
        run.rejected_count += 1
    row = JobSearchCandidate(
        user_id=run.user_id,
        run_id=run.id,
        opportunity_id=opportunity_id,
        outcome=outcome,
        company_name=str(candidate.get("company_name") or ""),
        role_title=str(candidate.get("role_title") or ""),
        post_headline=str(candidate.get("post_headline") or ""),
        job_description=str(candidate.get("job_description") or ""),
        contact_channel_type=contact_channel_type if contact_value else None,
        contact_channel_value=contact_value or None,
        collection_source_type=str(candidate.get("collection_source_type") or ""),
        hiring_intent_term=str(candidate.get("hiring_intent_term") or ""),
        provider_name=str(candidate.get("provider_name") or ""),
        provider_status=provider_status,
        provider_error_code=str(candidate.get("provider_error_code") or "") or None,
        poster_profile_url=str(candidate.get("poster_profile_url") or "") or None,
        application_url=application_url or None,
        application_kind=application_kind or None,
        selected_source_key=str(candidate.get("selected_source_key") or "") or None,
        source_name=source_name or None,
        provider_metadata=candidate.get("provider_metadata") if isinstance(candidate.get("provider_metadata"), dict) else {},
        external_job_id=str(candidate.get("external_job_id") or "") or None,
        contact_priority=str(candidate.get("contact_priority") or "") or None,
        source_url=str(candidate.get("source_url") or ""),
        source_query=source_query,
        source_evidence=source_evidence or None,
        matched_keywords=matched_keywords,
        match_score=review_profile.get("match_score") if outcome == JobCandidateOutcome.ACCEPTED.value else None,
        score_explanation=review_profile.get("score_explanation") if outcome == JobCandidateOutcome.ACCEPTED.value else None,
        score_factors=review_profile.get("score_factors") if outcome == JobCandidateOutcome.ACCEPTED.value else {},
        analysis_status=review_profile.get("analysis_status")
        if outcome == JobCandidateOutcome.ACCEPTED.value
        else "skipped",
        analysis_confidence=review_profile.get("analysis_confidence") if outcome == JobCandidateOutcome.ACCEPTED.value else None,
        passes_ai_filter=passes_ai_filter if isinstance(passes_ai_filter, bool) else None,
        ai_filter_status=ai_filter_status,
        ai_filter_reason=str(candidate.get("ai_filter_reason") or "") or None,
        ai_filter_confidence=candidate.get("ai_filter_confidence")
        if isinstance(candidate.get("ai_filter_confidence"), int | float)
        else None,
        ai_filter_signals=candidate.get("ai_filter_signals") if isinstance(candidate.get("ai_filter_signals"), dict) else {},
        ai_filter_error_code=str(candidate.get("ai_filter_error_code") or "") or None,
        ai_filter_error_message=str(candidate.get("ai_filter_error_message") or "") or None,
        ai_filter_model_name=str(candidate.get("ai_filter_model_name") or "") or None,
        ai_filter_prompt_version=str(candidate.get("ai_filter_prompt_version") or "") or None,
        normalized_company_name=str(candidate.get("company_name") or "") or None,
        normalized_role_title=str(candidate.get("role_title") or candidate.get("post_headline") or "") or None,
        missing_keywords=review_profile.get("missing_keywords") if outcome == JobCandidateOutcome.ACCEPTED.value else [],
        historical_similarity_signals=review_profile.get("historical_similarity_signals")
        if outcome == JobCandidateOutcome.ACCEPTED.value
        else {},
        raw_excerpt=str(candidate.get("raw_excerpt") or "") or None,
        dedupe_key=dedupe_key,
        rejection_reason=rejection_reason,
        inspected_at=datetime.now(UTC),
    )
    db.add(row)
    db.flush()
    db.expire(run, ["candidates"])
    reconcile_run_counters(run)
    db.commit()
    db.refresh(row)
    return row
