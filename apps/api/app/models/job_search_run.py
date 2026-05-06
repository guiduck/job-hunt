from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import DEFAULT_LOCAL_USER_ID
from app.models.opportunity import new_id


class JobSearchRunStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPLETED_NO_RESULTS = "completed_no_results"
    FAILED = "failed"


class JobCandidateOutcome(StrEnum):
    ACCEPTED = "accepted"
    REJECTED_NO_CONTACT = "rejected_no_contact"
    REJECTED_WEAK_MATCH = "rejected_weak_match"
    REJECTED_MISSING_EVIDENCE = "rejected_missing_evidence"
    DUPLICATE = "duplicate"
    FAILED_PARSE = "failed_parse"
    FAILED_PROVIDER = "failed_provider"
    BLOCKED_SOURCE = "blocked_source"
    INACCESSIBLE_SOURCE = "inaccessible_source"
    EMPTY_SOURCE = "empty_source"
    REJECTED_AI_FILTER = "rejected_ai_filter"
    FAILED_AI_FILTER = "failed_ai_filter"


class ProviderStatus(StrEnum):
    NOT_STARTED = "not_started"
    COLLECTED = "collected"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    INACCESSIBLE = "inaccessible"
    EMPTY = "empty"
    FAILED = "failed"


class CandidateAnalysisStatus(StrEnum):
    DETERMINISTIC_ONLY = "deterministic_only"
    AI_ASSISTED = "ai_assisted"
    FALLBACK = "fallback"
    FAILED = "failed"
    SKIPPED = "skipped"


class AIFilterStatus(StrEnum):
    PASSED = "passed"
    REJECTED = "rejected"
    FALLBACK = "fallback"
    FAILED = "failed"
    SKIPPED = "skipped"


class SearchSortOrder(StrEnum):
    RECENT = "recent"
    RELEVANT = "relevant"


class JobSearchRun(Base):
    __tablename__ = "job_search_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default=JobSearchRunStatus.PENDING.value, nullable=False)
    keyword_set_id: Mapped[str | None] = mapped_column(ForeignKey("keyword_sets.id"))
    requested_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    search_query: Mapped[str | None] = mapped_column(Text)
    search_sort_order: Mapped[str] = mapped_column(String(20), default=SearchSortOrder.RECENT.value, nullable=False)
    hiring_intent_terms: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    collection_source_types: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    provided_source_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    source_name: Mapped[str] = mapped_column(String(100), default="LinkedIn", nullable=False)
    candidate_limit: Mapped[int | None] = mapped_column(Integer)
    inspected_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    accepted_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cap_reached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    provider_status: Mapped[str] = mapped_column(String(50), default=ProviderStatus.NOT_STARTED.value, nullable=False)
    provider_error_code: Mapped[str | None] = mapped_column(String(100))
    provider_error_message: Mapped[str | None] = mapped_column(Text)
    analysis_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    analysis_status: Mapped[str] = mapped_column(String(50), default=CandidateAnalysisStatus.DETERMINISTIC_ONLY.value, nullable=False)
    analysis_error_code: Mapped[str | None] = mapped_column(String(100))
    analysis_error_message: Mapped[str | None] = mapped_column(Text)
    deterministic_only_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_assisted_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    analysis_fallback_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    analysis_failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    analysis_skipped_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_filters_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ai_filter_settings: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    ai_filter_status: Mapped[str] = mapped_column(String(50), default=AIFilterStatus.SKIPPED.value, nullable=False)
    ai_filter_error_code: Mapped[str | None] = mapped_column(String(100))
    ai_filter_error_message: Mapped[str | None] = mapped_column(Text)
    ai_filter_inspected_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_filter_passed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_filter_rejected_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_filter_fallback_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_filter_failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_filter_skipped_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    candidates: Mapped[list["JobSearchCandidate"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )
    collection_inputs: Mapped[list["LinkedInCollectionInput"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )


class LinkedInCollectionInput(Base):
    __tablename__ = "linkedin_collection_inputs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("job_search_runs.id"), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)
    provided_text: Mapped[str | None] = mapped_column(Text)
    label: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    run: Mapped[JobSearchRun] = relationship(back_populates="collection_inputs")


class JobSearchCandidate(Base):
    __tablename__ = "job_search_candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("job_search_runs.id"), nullable=False)
    opportunity_id: Mapped[str | None] = mapped_column(ForeignKey("opportunities.id"))
    outcome: Mapped[str] = mapped_column(String(50), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    role_title: Mapped[str | None] = mapped_column(String(500))
    post_headline: Mapped[str | None] = mapped_column(String(500))
    job_description: Mapped[str | None] = mapped_column(Text)
    contact_channel_type: Mapped[str | None] = mapped_column(String(50))
    contact_channel_value: Mapped[str | None] = mapped_column(String(500))
    collection_source_type: Mapped[str | None] = mapped_column(String(50))
    hiring_intent_term: Mapped[str | None] = mapped_column(String(100))
    provider_name: Mapped[str | None] = mapped_column(String(100))
    provider_status: Mapped[str | None] = mapped_column(String(50))
    provider_error_code: Mapped[str | None] = mapped_column(String(100))
    poster_profile_url: Mapped[str | None] = mapped_column(Text)
    contact_priority: Mapped[str | None] = mapped_column(String(50))
    source_url: Mapped[str | None] = mapped_column(Text)
    source_query: Mapped[str] = mapped_column(Text, nullable=False)
    source_evidence: Mapped[str | None] = mapped_column(Text)
    matched_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    match_score: Mapped[int | None] = mapped_column(Integer)
    score_explanation: Mapped[str | None] = mapped_column(Text)
    score_factors: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    analysis_status: Mapped[str] = mapped_column(String(50), default=CandidateAnalysisStatus.DETERMINISTIC_ONLY.value, nullable=False)
    analysis_confidence: Mapped[str | None] = mapped_column(String(50))
    analysis_error_code: Mapped[str | None] = mapped_column(String(100))
    analysis_error_message: Mapped[str | None] = mapped_column(Text)
    ai_model_name: Mapped[str | None] = mapped_column(String(255))
    ai_prompt_version: Mapped[str | None] = mapped_column(String(100))
    passes_ai_filter: Mapped[bool | None] = mapped_column(Boolean)
    ai_filter_status: Mapped[str] = mapped_column(String(50), default=AIFilterStatus.SKIPPED.value, nullable=False, index=True)
    ai_filter_reason: Mapped[str | None] = mapped_column(Text)
    ai_filter_confidence: Mapped[float | None] = mapped_column(Float)
    ai_filter_signals: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    ai_filter_error_code: Mapped[str | None] = mapped_column(String(100))
    ai_filter_error_message: Mapped[str | None] = mapped_column(Text)
    ai_filter_model_name: Mapped[str | None] = mapped_column(String(255))
    ai_filter_prompt_version: Mapped[str | None] = mapped_column(String(100))
    normalized_company_name: Mapped[str | None] = mapped_column(String(255))
    normalized_role_title: Mapped[str | None] = mapped_column(String(500))
    detected_seniority: Mapped[str | None] = mapped_column(String(100))
    detected_modality: Mapped[str | None] = mapped_column(String(100))
    detected_location: Mapped[str | None] = mapped_column(String(255))
    missing_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    historical_similarity_signals: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    raw_excerpt: Mapped[str | None] = mapped_column(Text)
    dedupe_key: Mapped[str | None] = mapped_column(String(1000), index=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    inspected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    run: Mapped[JobSearchRun] = relationship(back_populates="candidates")

    @property
    def review_profile(self) -> dict[str, object]:
        return {
            "review_status": "unreviewed",
            "match_score": self.match_score,
            "score_explanation": self.score_explanation,
            "score_factors": self.score_factors or {},
            "analysis_status": self.analysis_status,
            "analysis_confidence": self.analysis_confidence,
            "analysis_error_code": self.analysis_error_code,
            "analysis_error_message": self.analysis_error_message,
            "normalized_company_name": self.normalized_company_name,
            "normalized_role_title": self.normalized_role_title,
            "detected_seniority": self.detected_seniority,
            "detected_modality": self.detected_modality,
            "detected_location": self.detected_location,
            "missing_keywords": self.missing_keywords or [],
            "historical_similarity_signals": self.historical_similarity_signals or {},
        }
