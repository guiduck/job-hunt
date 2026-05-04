from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


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


class LinkedInCollectionSourceType(StrEnum):
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


class CandidateAnalysisStatus(StrEnum):
    DETERMINISTIC_ONLY = "deterministic_only"
    AI_ASSISTED = "ai_assisted"
    FALLBACK = "fallback"
    FAILED = "failed"
    SKIPPED = "skipped"


class JobReviewStatus(StrEnum):
    UNREVIEWED = "unreviewed"
    REVIEWING = "reviewing"
    SAVED = "saved"
    IGNORED = "ignored"


class JobReviewProfile(BaseModel):
    review_status: JobReviewStatus = JobReviewStatus.UNREVIEWED
    match_score: int | None = Field(default=None, ge=0, le=100)
    score_explanation: str | None = None
    score_factors: dict[str, object] = Field(default_factory=dict)
    analysis_status: CandidateAnalysisStatus = CandidateAnalysisStatus.DETERMINISTIC_ONLY
    analysis_confidence: str | None = None
    analysis_error_code: str | None = None
    analysis_error_message: str | None = None
    normalized_company_name: str | None = None
    normalized_role_title: str | None = None
    detected_seniority: str | None = None
    detected_modality: str | None = None
    detected_location: str | None = None
    missing_keywords: list[str] = Field(default_factory=list)
    historical_similarity_signals: dict[str, object] = Field(default_factory=dict)


class ContactPriority(StrEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"


class LinkedInCollectionInput(BaseModel):
    source_type: LinkedInCollectionSourceType
    source_url: str | None = None
    provided_text: str | None = None
    label: str | None = None


class LinkedInCollectionInputRead(LinkedInCollectionInput):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    created_at: datetime


class JobSearchRunCreate(BaseModel):
    keyword_set_id: str | None = None
    keywords: list[str] | None = None
    hiring_intent_terms: list[str] = Field(default_factory=lambda: ["hiring", "contratando", "contratamos"], min_length=1)
    collection_source_types: list[LinkedInCollectionSourceType] = Field(
        default_factory=lambda: [LinkedInCollectionSourceType.AUTOMATIC_PUBLICATION_SEARCH],
        min_length=1,
    )
    collection_inputs: list[LinkedInCollectionInput] = Field(default_factory=list)
    candidate_limit: int | None = Field(default=None, ge=1)


class JobSearchRun(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: JobSearchRunStatus
    keyword_set_id: str | None = None
    requested_keywords: list[str]
    hiring_intent_terms: list[str] = Field(default_factory=list)
    collection_source_types: list[str] = Field(default_factory=list)
    collection_inputs: list[LinkedInCollectionInputRead] = Field(default_factory=list)
    provided_source_count: int = 0
    source_name: str
    candidate_limit: int | None
    inspected_count: int
    accepted_count: int
    rejected_count: int
    duplicate_count: int
    cap_reached: bool
    provider_status: ProviderStatus = ProviderStatus.NOT_STARTED
    provider_error_code: str | None = None
    provider_error_message: str | None = None
    analysis_enabled: bool = False
    analysis_status: CandidateAnalysisStatus = CandidateAnalysisStatus.DETERMINISTIC_ONLY
    analysis_error_code: str | None = None
    analysis_error_message: str | None = None
    deterministic_only_count: int = 0
    ai_assisted_count: int = 0
    analysis_fallback_count: int = 0
    analysis_failed_count: int = 0
    analysis_skipped_count: int = 0
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class JobSearchCandidate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    opportunity_id: str | None = None
    outcome: JobCandidateOutcome
    company_name: str | None = None
    role_title: str | None = None
    post_headline: str | None = None
    job_description: str | None = None
    contact_channel_type: str | None = None
    contact_channel_value: str | None = None
    collection_source_type: str | None = None
    hiring_intent_term: str | None = None
    provider_name: str | None = None
    provider_status: str | None = None
    provider_error_code: str | None = None
    poster_profile_url: str | None = None
    contact_priority: str | None = None
    source_url: str | None = None
    source_query: str
    source_evidence: str | None = None
    matched_keywords: list[str]
    review_profile: JobReviewProfile | None = None
    raw_excerpt: str | None = None
    dedupe_key: str | None = None
    rejection_reason: str | None = None
    inspected_at: datetime | None = None
    created_at: datetime
