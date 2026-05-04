from app.models.job_search_run import JobSearchRun
from app.services.job_search_run_service import record_candidate


def test_deduplicates_by_preferred_contact_channel(db_session) -> None:
    run = JobSearchRun(
        requested_keywords=["typescript"],
        hiring_intent_terms=["hiring"],
        collection_source_types=["provided_public_content"],
        source_name="LinkedIn",
        candidate_limit=50,
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    candidate = {
        "company_name": "Example Co",
        "role_title": "Frontend Engineer",
        "contact_channel_type": "email",
        "contact_channel_value": "jobs@example.com",
        "source_query": "hiring typescript",
        "source_evidence": "Hiring TypeScript. Email jobs@example.com",
        "matched_keywords": ["typescript"],
    }

    first = record_candidate(db_session, run, candidate)
    second = record_candidate(db_session, run, candidate)

    assert first.outcome == "accepted"
    assert second.outcome == "duplicate"
    assert second.opportunity_id == first.opportunity_id
