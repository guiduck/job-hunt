from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import DEFAULT_LOCAL_USER_ID


def new_id() -> str:
    return str(uuid4())


class OpportunityType(StrEnum):
    FREELANCE = "freelance"
    JOB = "job"


class KeywordSource(StrEnum):
    MANUAL = "manual"
    MOCK = "mock"
    CV = "cv"


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


class KeywordSet(Base):
    __tablename__ = "keyword_sets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(50), default=KeywordSource.MANUAL.value, nullable=False)
    opportunity_type: Mapped[str] = mapped_column(String(50), default=OpportunityType.JOB.value, nullable=False)
    terms: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), default=DEFAULT_LOCAL_USER_ID, nullable=False, index=True)
    opportunity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str | None] = mapped_column(String(500))
    organization_name: Mapped[str | None] = mapped_column(String(255))
    source_name: Mapped[str | None] = mapped_column(String(100))
    source_url: Mapped[str | None] = mapped_column(Text)
    source_query: Mapped[str | None] = mapped_column(Text)
    source_evidence: Mapped[str] = mapped_column(Text, nullable=False)
    operator_notes: Mapped[str | None] = mapped_column(Text)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    job_detail: Mapped["JobOpportunityDetail | None"] = relationship(
        back_populates="opportunity",
        cascade="all, delete-orphan",
        uselist=False,
    )
    keyword_matches: Mapped[list["OpportunityKeywordMatch"]] = relationship(
        back_populates="opportunity",
        cascade="all, delete-orphan",
    )


class JobOpportunityDetail(Base):
    __tablename__ = "job_opportunity_details"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    opportunity_id: Mapped[str] = mapped_column(ForeignKey("opportunities.id"), nullable=False, unique=True)
    company_name: Mapped[str | None] = mapped_column(String(255))
    role_title: Mapped[str | None] = mapped_column(String(500))
    post_headline: Mapped[str | None] = mapped_column(String(500))
    job_description: Mapped[str | None] = mapped_column(Text)
    contact_channel_type: Mapped[str | None] = mapped_column(String(50))
    contact_channel_value: Mapped[str] = mapped_column(String(500), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(320))
    application_url: Mapped[str | None] = mapped_column(Text)
    linkedin_url: Mapped[str | None] = mapped_column(Text)
    poster_profile_url: Mapped[str | None] = mapped_column(Text)
    contact_priority: Mapped[str | None] = mapped_column(String(50))
    hiring_intent_term: Mapped[str | None] = mapped_column(String(100))
    collection_source_type: Mapped[str | None] = mapped_column(String(50))
    matched_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    dedupe_key: Mapped[str | None] = mapped_column(String(1000), index=True)
    job_stage: Mapped[str] = mapped_column(String(50), default=JobStage.NEW.value, nullable=False)
    review_status: Mapped[str] = mapped_column(String(50), default=JobReviewStatus.UNREVIEWED.value, nullable=False)
    match_score: Mapped[int | None] = mapped_column(Integer)
    score_explanation: Mapped[str | None] = mapped_column(Text)
    score_factors: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    analysis_status: Mapped[str] = mapped_column(String(50), default=CandidateAnalysisStatus.DETERMINISTIC_ONLY.value, nullable=False)
    analysis_confidence: Mapped[str | None] = mapped_column(String(50))
    analysis_error_code: Mapped[str | None] = mapped_column(String(100))
    analysis_error_message: Mapped[str | None] = mapped_column(Text)
    normalized_company_name: Mapped[str | None] = mapped_column(String(255))
    normalized_role_title: Mapped[str | None] = mapped_column(String(500))
    detected_seniority: Mapped[str | None] = mapped_column(String(100))
    detected_modality: Mapped[str | None] = mapped_column(String(100))
    detected_location: Mapped[str | None] = mapped_column(String(255))
    missing_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    historical_similarity_signals: Mapped[dict[str, object]] = mapped_column(JSON, default=dict, nullable=False)
    response_notes: Mapped[str | None] = mapped_column(Text)
    interview_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    opportunity: Mapped[Opportunity] = relationship(back_populates="job_detail")

    @property
    def review_profile(self) -> dict[str, object]:
        return {
            "review_status": self.review_status,
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


class OpportunityKeywordMatch(Base):
    __tablename__ = "opportunity_keyword_matches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    opportunity_id: Mapped[str] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    keyword_set_id: Mapped[str | None] = mapped_column(ForeignKey("keyword_sets.id"))
    matched_term: Mapped[str] = mapped_column(String(255), nullable=False)
    match_context: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    opportunity: Mapped[Opportunity] = relationship(back_populates="keyword_matches")
