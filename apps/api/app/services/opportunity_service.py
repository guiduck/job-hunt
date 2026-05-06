from sqlalchemy import delete, exists, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.opportunity import (
    ContactChannelType,
    JobOpportunityDetail,
    JobStage,
    KeywordSet,
    KeywordSource,
    Opportunity,
    OpportunityKeywordMatch,
    OpportunityType,
)
from app.models.job_search_run import JobSearchCandidate
from app.models.email import EmailDraft, OutreachEvent, SendRequest, SendRequestStatus, TemplateKind
from app.models.user import User
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate
from app.services.auth_service import ensure_default_local_user
from app.services.job_dedupe import build_job_dedupe_key
from app.services.job_review_scoring import default_review_profile

DEFAULT_JOB_KEYWORDS = ["reactjs", "typescript", "nextjs", "nodejs"]


def ensure_default_keyword_set(db: Session, user: User | None = None) -> KeywordSet:
    user_filter = KeywordSet.user_id == user.id if user else KeywordSet.user_id.is_(None)
    existing = db.scalar(
        select(KeywordSet).where(
            user_filter,
            KeywordSet.opportunity_type == OpportunityType.JOB.value,
            KeywordSet.source == KeywordSource.MOCK.value,
            KeywordSet.is_default.is_(True),
        )
    )
    if existing:
        return existing

    keyword_set = KeywordSet(
        user_id=user.id if user else None,
        name="Default Mock Job Keywords",
        source=KeywordSource.MOCK.value,
        opportunity_type=OpportunityType.JOB.value,
        terms=DEFAULT_JOB_KEYWORDS,
        is_active=True,
        is_default=True,
    )
    db.add(keyword_set)
    db.commit()
    db.refresh(keyword_set)
    return keyword_set


def get_active_job_keywords(db: Session, user: User | None = None) -> tuple[KeywordSet, list[str]]:
    user_filter = KeywordSet.user_id == user.id if user else KeywordSet.user_id.is_(None)
    manual = db.scalar(
        select(KeywordSet).where(
            user_filter,
            KeywordSet.opportunity_type == OpportunityType.JOB.value,
            KeywordSet.source == KeywordSource.MANUAL.value,
            KeywordSet.is_active.is_(True),
        )
    )
    keyword_set = manual or ensure_default_keyword_set(db, user=user)
    return keyword_set, list(keyword_set.terms)


def create_opportunity(
    db: Session,
    payload: OpportunityCreate,
    user: User | None = None,
    user_id: str | None = None,
) -> Opportunity:
    owner_id = user.id if user else user_id
    if owner_id is None:
        owner_id = ensure_default_local_user(db).id
    detail_payload = payload.job_detail
    if detail_payload is None:
        raise ValueError("job_detail is required")

    matched_keywords = list(detail_payload.matched_keywords)
    dedupe_key = detail_payload.dedupe_key or build_job_dedupe_key(
        detail_payload.company_name or payload.organization_name,
        detail_payload.role_title,
        detail_payload.post_headline or payload.title,
        matched_keywords,
        detail_payload.contact_channel_value,
    )

    existing = get_opportunity_by_dedupe_key(db, dedupe_key, user=user, user_id=owner_id)
    if existing:
        return existing

    opportunity = Opportunity(
        user_id=owner_id,
        opportunity_type=payload.opportunity_type.value,
        title=payload.title or detail_payload.role_title or detail_payload.post_headline,
        organization_name=payload.organization_name or detail_payload.company_name,
        source_name=payload.source_name,
        source_url=payload.source_url,
        source_query=payload.source_query,
        source_evidence=payload.source_evidence,
        operator_notes=payload.operator_notes,
    )
    review_profile = (
        detail_payload.review_profile.model_dump(mode="json")
        if detail_payload.review_profile
        else default_review_profile(matched_keywords=matched_keywords)
    )
    opportunity.job_detail = JobOpportunityDetail(
        company_name=detail_payload.company_name or payload.organization_name,
        role_title=detail_payload.role_title,
        post_headline=detail_payload.post_headline or payload.title,
        job_description=detail_payload.job_description,
        contact_channel_type=detail_payload.contact_channel_type.value,
        contact_channel_value=detail_payload.contact_channel_value,
        contact_email=detail_payload.contact_channel_value
        if detail_payload.contact_channel_type == ContactChannelType.EMAIL
        else detail_payload.contact_email,
        application_url=detail_payload.application_url,
        linkedin_url=detail_payload.linkedin_url or payload.source_url,
        poster_profile_url=detail_payload.poster_profile_url,
        contact_priority=detail_payload.contact_priority.value if detail_payload.contact_priority else None,
        hiring_intent_term=detail_payload.hiring_intent_term,
        collection_source_type=detail_payload.collection_source_type,
        matched_keywords=matched_keywords,
        dedupe_key=dedupe_key,
        job_stage=detail_payload.job_stage.value,
        review_status=str(review_profile.get("review_status") or "unreviewed"),
        match_score=review_profile.get("match_score"),
        score_explanation=review_profile.get("score_explanation"),
        score_factors=dict(review_profile.get("score_factors") or {}),
        analysis_status=str(review_profile.get("analysis_status") or "deterministic_only"),
        analysis_confidence=review_profile.get("analysis_confidence"),
        analysis_error_code=review_profile.get("analysis_error_code"),
        analysis_error_message=review_profile.get("analysis_error_message"),
        normalized_company_name=review_profile.get("normalized_company_name") or detail_payload.company_name or payload.organization_name,
        normalized_role_title=review_profile.get("normalized_role_title") or detail_payload.role_title or detail_payload.post_headline,
        detected_seniority=review_profile.get("detected_seniority"),
        detected_modality=review_profile.get("detected_modality"),
        detected_location=review_profile.get("detected_location"),
        missing_keywords=list(review_profile.get("missing_keywords") or []),
        historical_similarity_signals=dict(review_profile.get("historical_similarity_signals") or {}),
    )

    keyword_set, _ = get_active_job_keywords(db, user=user)
    opportunity.keyword_matches = [
        OpportunityKeywordMatch(
            keyword_set_id=keyword_set.id,
            matched_term=keyword,
            match_context=payload.source_evidence,
        )
        for keyword in matched_keywords
    ]
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return get_opportunity(db, opportunity.id, user=user) or opportunity


def get_opportunity_by_dedupe_key(
    db: Session,
    dedupe_key: str,
    user: User | None = None,
    user_id: str | None = None,
) -> Opportunity | None:
    statement = (
        select(Opportunity)
        .join(JobOpportunityDetail)
        .options(selectinload(Opportunity.job_detail), selectinload(Opportunity.keyword_matches))
        .where(JobOpportunityDetail.dedupe_key == dedupe_key)
    )
    owner_id = user.id if user else user_id
    if owner_id:
        statement = statement.where(Opportunity.user_id == owner_id)
    return db.scalar(statement)


def get_opportunity(db: Session, opportunity_id: str, user: User | None = None) -> Opportunity | None:
    statement = (
        select(Opportunity)
        .options(selectinload(Opportunity.job_detail), selectinload(Opportunity.keyword_matches))
        .where(Opportunity.id == opportunity_id)
    )
    if user:
        statement = statement.where(Opportunity.user_id == user.id)
    return db.scalar(statement)


def list_opportunities(
    db: Session,
    opportunity_type: str | None = None,
    contact_channel: str | None = None,
    matched_keyword: str | None = None,
    min_score: int | None = None,
    contact_available: bool | None = None,
    job_stage: str | None = None,
    review_status: str | None = None,
    provider_status: str | None = None,
    analysis_status: str | None = None,
    send_status: str | None = None,
    sort_order: str = "newest",
    source_query: str | None = None,
    run_id: str | None = None,
    campaign_id: str | None = None,
    user: User | None = None,
) -> list[Opportunity]:
    statement = select(Opportunity).options(selectinload(Opportunity.job_detail), selectinload(Opportunity.keyword_matches))
    if user:
        statement = statement.where(Opportunity.user_id == user.id)
    needs_detail_join = any(
        [
            contact_channel,
            contact_available is not None,
            min_score is not None,
            job_stage,
            review_status,
            analysis_status,
            matched_keyword,
        ]
    )
    if needs_detail_join:
        statement = statement.join(JobOpportunityDetail)
    if opportunity_type:
        statement = statement.where(Opportunity.opportunity_type == opportunity_type)
    if source_query:
        statement = statement.where(Opportunity.source_query.contains(source_query))
    if contact_channel:
        statement = statement.where(JobOpportunityDetail.contact_channel_value.contains(contact_channel))
    if contact_available is not None:
        if contact_available:
            statement = statement.where(JobOpportunityDetail.contact_channel_value.is_not(None), JobOpportunityDetail.contact_channel_value != "")
        else:
            statement = statement.where(
                (JobOpportunityDetail.contact_channel_value.is_(None)) | (JobOpportunityDetail.contact_channel_value == "")
            )
    if min_score is not None:
        statement = statement.where(JobOpportunityDetail.match_score >= min_score)
    if job_stage:
        statement = statement.where(JobOpportunityDetail.job_stage == job_stage)
    if review_status:
        statement = statement.where(JobOpportunityDetail.review_status == review_status)
    if analysis_status:
        statement = statement.where(JobOpportunityDetail.analysis_status == analysis_status)
    if matched_keyword:
        search = f"%{matched_keyword}%"
        statement = statement.outerjoin(OpportunityKeywordMatch).where(
            or_(
                OpportunityKeywordMatch.matched_term.ilike(search),
                Opportunity.title.ilike(search),
                Opportunity.organization_name.ilike(search),
                Opportunity.source_query.ilike(search),
                Opportunity.source_evidence.ilike(search),
                JobOpportunityDetail.company_name.ilike(search),
                JobOpportunityDetail.role_title.ilike(search),
                JobOpportunityDetail.post_headline.ilike(search),
                JobOpportunityDetail.job_description.ilike(search),
                JobOpportunityDetail.contact_channel_value.ilike(search),
            )
        )
    if send_status in {"sent", "unsent"}:
        sent_application = exists().where(
            SendRequest.opportunity_id == Opportunity.id,
            SendRequest.template_kind == TemplateKind.JOB_APPLICATION.value,
            SendRequest.status == SendRequestStatus.SENT.value,
        )
        statement = statement.where(sent_application if send_status == "sent" else ~sent_application)
    if provider_status or run_id or campaign_id:
        statement = statement.join(JobSearchCandidate, JobSearchCandidate.opportunity_id == Opportunity.id)
    if provider_status:
        statement = statement.where(JobSearchCandidate.provider_status == provider_status)
    if run_id:
        statement = statement.where(JobSearchCandidate.run_id == run_id)
    # campaign_id is reserved for future campaign linkage; keep the accepted query parameter additive.
    statement = statement.order_by(Opportunity.captured_at.asc() if sort_order == "oldest" else Opportunity.captured_at.desc())
    return list(db.scalars(statement).unique())


def update_opportunity(db: Session, opportunity_id: str, payload: OpportunityUpdate, user: User | None = None) -> Opportunity | None:
    opportunity = get_opportunity(db, opportunity_id, user=user)
    if opportunity is None:
        return None
    if payload.operator_notes is not None:
        opportunity.operator_notes = payload.operator_notes
    if payload.job_stage is not None and opportunity.job_detail is not None:
        opportunity.job_detail.job_stage = payload.job_stage.value
    if payload.review_status is not None and opportunity.job_detail is not None:
        opportunity.job_detail.review_status = payload.review_status.value
    db.commit()
    return get_opportunity(db, opportunity_id, user=user)


def delete_opportunity(db: Session, opportunity_id: str, user: User | None = None) -> bool:
    opportunity = get_opportunity(db, opportunity_id, user=user)
    if opportunity is None:
        return False

    db.execute(delete(OutreachEvent).where(OutreachEvent.opportunity_id == opportunity_id))
    db.execute(delete(SendRequest).where(SendRequest.opportunity_id == opportunity_id))
    db.execute(delete(EmailDraft).where(EmailDraft.opportunity_id == opportunity_id))
    db.execute(update(JobSearchCandidate).where(JobSearchCandidate.opportunity_id == opportunity_id).values(opportunity_id=None))
    db.delete(opportunity)
    db.commit()
    return True


def delete_opportunities(
    db: Session,
    *,
    opportunity_ids: list[str] | None = None,
    send_status: str | None = None,
    user: User | None = None,
) -> int:
    ids = set(opportunity_ids or [])
    if send_status in {"sent", "unsent"}:
        statement = select(Opportunity.id).where(Opportunity.opportunity_type == OpportunityType.JOB.value)
        if user:
            statement = statement.where(Opportunity.user_id == user.id)
        sent_application = exists().where(
            SendRequest.opportunity_id == Opportunity.id,
            SendRequest.template_kind == TemplateKind.JOB_APPLICATION.value,
            SendRequest.status == SendRequestStatus.SENT.value,
        )
        statement = statement.where(sent_application if send_status == "sent" else ~sent_application)
        ids.update(db.scalars(statement).all())

    deleted_count = 0
    for opportunity_id in ids:
        if delete_opportunity(db, opportunity_id, user=user):
            deleted_count += 1
    return deleted_count
