import pytest
from pydantic import ValidationError

from app.schemas.opportunity import JobDetailCreate, OpportunityCreate


def test_job_opportunity_requires_contact_channel() -> None:
    with pytest.raises(ValidationError):
        OpportunityCreate(
            source_evidence="React role with contact.",
            job_detail=JobDetailCreate(
                company_name="Example Co",
                role_title="Frontend Engineer",
                contact_channel_value="",
                matched_keywords=["reactjs"],
            ),
        )


def test_job_opportunity_allows_empty_matched_keywords() -> None:
    opportunity = OpportunityCreate(
        source_evidence="React role with contact.",
        job_detail=JobDetailCreate(
            company_name="Example Co",
            role_title="Frontend Engineer",
            contact_channel_value="jobs@example.com",
            matched_keywords=[],
        ),
    )

    assert opportunity.job_detail is not None
    assert opportunity.job_detail.matched_keywords == []
