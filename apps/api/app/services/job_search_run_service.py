from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.job_search_run import (
    JobCandidateOutcome,
    JobSearchCandidate,
    JobSearchRun,
    JobSearchRunStatus,
    LinkedInCollectionInput,
    ProviderStatus,
)
from app.models.opportunity import ContactChannelType
from app.models.user import User
from app.schemas.job_search_run import JobSearchRunCreate
from app.schemas.opportunity import JobDetailCreate, OpportunityCreate
from app.services.auth_service import ensure_default_local_user
from app.services.job_dedupe import build_job_dedupe_key
from app.services.job_review_scoring import default_review_profile
from app.services.opportunity_service import create_opportunity, get_active_job_keywords, get_opportunity_by_dedupe_key


def create_job_search_run(db: Session, payload: JobSearchRunCreate, user: User | None = None) -> JobSearchRun:
    user = user or ensure_default_local_user(db)
    keyword_set = None
    keywords = payload.keywords
    if not keywords:
        keyword_set, keywords = get_active_job_keywords(db)

    run = JobSearchRun(
        user_id=user.id,
        status=JobSearchRunStatus.PENDING.value,
        keyword_set_id=payload.keyword_set_id or (keyword_set.id if keyword_set else None),
        requested_keywords=list(keywords),
        hiring_intent_terms=list(payload.hiring_intent_terms),
        collection_source_types=[source_type.value for source_type in payload.collection_source_types],
        provided_source_count=len(payload.collection_inputs),
        candidate_limit=payload.candidate_limit,
        provider_status=ProviderStatus.NOT_STARTED.value,
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


def list_job_search_runs(
    db: Session,
    status: str | None = None,
    limit: int = 20,
    provider_status: str | None = None,
    analysis_status: str | None = None,
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


def list_candidates(
    db: Session,
    run_id: str,
    outcome: str | None = None,
    collection_source_type: str | None = None,
    analysis_status: str | None = None,
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
    provider_status = str(candidate.get("provider_status") or ProviderStatus.COLLECTED.value)
    review_profile = default_review_profile(matched_keywords=matched_keywords)

    dedupe_key = build_job_dedupe_key(
        str(candidate.get("company_name") or ""),
        str(candidate.get("role_title") or ""),
        str(candidate.get("post_headline") or ""),
        matched_keywords,
        contact_value,
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
                    title=str(candidate.get("role_title") or candidate.get("post_headline") or ""),
                    organization_name=str(candidate.get("company_name") or ""),
                    source_name="LinkedIn",
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
