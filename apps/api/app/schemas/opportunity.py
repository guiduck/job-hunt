from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class OpportunityType(StrEnum):
    JOB = "job"
    FREELANCE = "freelance"


class JobStage(StrEnum):
    NEW = "new"
    SAVED = "saved"
    APPLIED = "applied"
    RESPONDED = "responded"
    INTERVIEW = "interview"
    REJECTED = "rejected"
    IGNORED = "ignored"


class JobReviewStatus(StrEnum):
    UNREVIEWED = "unreviewed"
    REVIEWING = "reviewing"
    SAVED = "saved"
    IGNORED = "ignored"


class CandidateAnalysisStatus(StrEnum):
    DETERMINISTIC_ONLY = "deterministic_only"
    AI_ASSISTED = "ai_assisted"
    FALLBACK = "fallback"
    FAILED = "failed"
    SKIPPED = "skipped"


class ContactChannelType(StrEnum):
    EMAIL = "email"
    LINKEDIN = "linkedin"
    OTHER_PUBLIC_CONTACT = "other_public_contact"


class ContactPriority(StrEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"


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


class JobDetailCreate(BaseModel):
    company_name: str | None = None
    role_title: str | None = None
    post_headline: str | None = None
    job_description: str | None = None
    contact_channel_type: ContactChannelType = ContactChannelType.EMAIL
    contact_channel_value: str
    contact_email: str | None = None
    application_url: str | None = None
    linkedin_url: str | None = None
    poster_profile_url: str | None = None
    contact_priority: ContactPriority | None = None
    hiring_intent_term: str | None = None
    collection_source_type: str | None = None
    matched_keywords: list[str] = Field(default_factory=list)
    dedupe_key: str | None = None
    job_stage: JobStage = JobStage.NEW
    review_profile: JobReviewProfile | None = None


class JobDetail(JobDetailCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    opportunity_id: str
    review_profile: JobReviewProfile | None = None


class OpportunityCreate(BaseModel):
    opportunity_type: OpportunityType = OpportunityType.JOB
    title: str | None = None
    organization_name: str | None = None
    source_name: str | None = "LinkedIn"
    source_url: str | None = None
    source_query: str | None = None
    source_evidence: str
    operator_notes: str | None = None
    job_detail: JobDetailCreate | None = None

    @model_validator(mode="after")
    def validate_job_opportunity(self) -> "OpportunityCreate":
        if self.opportunity_type == OpportunityType.JOB:
            if self.job_detail is None:
                raise ValueError("job_detail is required for job opportunities")
            if not self.job_detail.contact_channel_value:
                raise ValueError("public contact channel is required for accepted job opportunities")
        return self


class OpportunityUpdate(BaseModel):
    job_stage: JobStage | None = None
    review_status: JobReviewStatus | None = None
    operator_notes: str | None = None


class OpportunityBulkDeleteRequest(BaseModel):
    opportunity_ids: list[str] = Field(default_factory=list)
    send_status: str | None = Field(default=None, pattern="^(sent|unsent)$")

    @model_validator(mode="after")
    def validate_delete_target(self) -> "OpportunityBulkDeleteRequest":
        if not self.opportunity_ids and self.send_status is None:
            raise ValueError("opportunity_ids or send_status is required")
        return self


class OpportunityBulkDeleteResponse(BaseModel):
    deleted_count: int


class Opportunity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    opportunity_type: OpportunityType
    title: str | None = None
    organization_name: str | None = None
    source_name: str | None = None
    source_url: str | None = None
    source_query: str | None = None
    source_evidence: str
    operator_notes: str | None = None
    captured_at: datetime
    created_at: datetime
    updated_at: datetime
    job_detail: JobDetail | None = None


class OpportunityListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    opportunity_type: OpportunityType
    title: str | None = None
    organization_name: str | None = None
    source_name: str | None = None
    source_url: str | None = None
    source_query: str | None = None
    source_evidence: str
    operator_notes: str | None = None
    captured_at: datetime
    job_detail: JobDetail | None = None
