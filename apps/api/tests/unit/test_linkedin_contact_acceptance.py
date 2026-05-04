from app.models.job_search_run import JobSearchRun
from app.services.job_search_run_service import record_candidate


def test_records_linkedin_dm_contact_as_accepted_opportunity(db_session) -> None:
    run = JobSearchRun(
        requested_keywords=["typescript"],
        hiring_intent_terms=["contratando"],
        collection_source_types=["provided_public_content"],
        source_name="LinkedIn",
        candidate_limit=50,
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    row = record_candidate(
        db_session,
        run,
        {
            "company_name": "Example Studio",
            "role_title": "TypeScript Developer",
            "contact_channel_type": "linkedin",
            "contact_channel_value": "https://www.linkedin.com/in/recruiter-example",
            "poster_profile_url": "https://www.linkedin.com/in/recruiter-example",
            "contact_priority": "secondary",
            "source_query": "contratando typescript",
            "source_evidence": "Me chame no DM para conversar sobre TypeScript.",
            "matched_keywords": ["typescript"],
            "hiring_intent_term": "contratando",
            "collection_source_type": "provided_public_content",
        },
    )

    assert row.outcome == "accepted"
    assert row.opportunity_id is not None
    assert row.contact_channel_type == "linkedin"
