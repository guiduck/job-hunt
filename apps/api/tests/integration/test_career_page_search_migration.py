from sqlalchemy.orm import Session

from app.models.job_search_run import JobSearchCandidate, JobSearchRun


def test_career_page_run_and_candidate_metadata_fields_persist(db_session: Session, test_user) -> None:
    run = JobSearchRun(
        user_id=test_user.id,
        search_kind="career_page",
        status="pending",
        requested_keywords=["react"],
        search_query="react remoto",
        hiring_intent_terms=[],
        collection_source_types=[],
        selected_source_keys=["ashby"],
        source_diagnostics={"ashby": {"status": "pending"}},
        source_name="Career pages",
        candidate_limit=20,
        accepted_limit=5,
        inspected_cap=20,
        provider_status="not_started",
        provider_metadata={"provider": "serpapi"},
    )
    db_session.add(run)
    db_session.flush()
    candidate = JobSearchCandidate(
        user_id=test_user.id,
        run_id=run.id,
        outcome="accepted",
        source_query="site:jobs.ashbyhq.com react remoto",
        source_url="https://jobs.ashbyhq.com/example/frontend",
        source_evidence="Frontend role",
        matched_keywords=["react"],
        application_url="https://jobs.ashbyhq.com/example/frontend",
        application_kind="external_application",
        selected_source_key="ashby",
        source_name="Ashby",
        provider_metadata={"position": 1},
        external_job_id="job-1",
    )
    db_session.add(candidate)
    db_session.commit()

    stored_run = db_session.get(JobSearchRun, run.id)
    stored_candidate = db_session.get(JobSearchCandidate, candidate.id)
    assert stored_run.search_kind == "career_page"
    assert stored_run.selected_source_keys == ["ashby"]
    assert stored_run.provider_metadata == {"provider": "serpapi"}
    assert stored_candidate.application_kind == "external_application"
    assert stored_candidate.selected_source_key == "ashby"
    assert stored_candidate.provider_metadata == {"position": 1}
