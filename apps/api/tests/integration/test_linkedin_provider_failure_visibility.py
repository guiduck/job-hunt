from app.models.job_search_run import JobSearchRun
from app.services.job_search_run_service import record_candidate


def test_blocked_candidate_is_visible_without_opportunity(db_session) -> None:
    run = JobSearchRun(
        requested_keywords=["reactjs"],
        hiring_intent_terms=["hiring"],
        collection_source_types=["automatic_publication_search"],
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
            "provider_status": "blocked",
            "provider_error_code": "blocked",
            "source_query": "hiring reactjs",
            "rejection_reason": "LinkedIn blocked public search",
        },
    )

    assert row.outcome == "blocked_source"
    assert row.opportunity_id is None
    assert run.rejected_count == 1
