from sqlalchemy.orm import Session

from app.models.job_search_run import JobSearchCandidate, JobSearchRun


def test_candidate_diagnostics_expose_external_metadata(client, auth_headers: dict[str, str], db_session: Session, test_user) -> None:
    run = JobSearchRun(
        user_id=test_user.id,
        search_kind="career_page",
        status="completed",
        requested_keywords=["react"],
        search_query="react remoto",
        hiring_intent_terms=[],
        collection_source_types=[],
        selected_source_keys=["ashby"],
        source_diagnostics={"ashby": {"status": "collected", "accepted": 1, "inspected": 1}},
        source_name="Career pages",
        candidate_limit=10,
        accepted_limit=1,
        inspected_cap=10,
        inspected_count=1,
        accepted_count=1,
        provider_status="collected",
    )
    db_session.add(run)
    db_session.flush()
    db_session.add(
        JobSearchCandidate(
            user_id=test_user.id,
            run_id=run.id,
            outcome="accepted",
            company_name="Ashby",
            role_title="React Engineer",
            source_query="site:jobs.ashbyhq.com react",
            source_url="https://jobs.ashbyhq.com/acme/react",
            source_evidence="Remote React job",
            matched_keywords=["react"],
            application_url="https://jobs.ashbyhq.com/acme/react",
            application_kind="external_application",
            selected_source_key="ashby",
            source_name="Ashby",
            provider_metadata={"position": 1},
            ai_model_name="deterministic",
            ai_prompt_version="external-job-review-v1",
            analysis_status="deterministic_only",
            rejection_reason=None,
        )
    )
    db_session.commit()

    response = client.get(f"/job-search-runs/{run.id}/candidates", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()[0]
    assert body["application_kind"] == "external_application"
    assert body["selected_source_key"] == "ashby"
    assert body["source_name"] == "Ashby"
    assert body["provider_metadata"] == {"position": 1}
    assert body["ai_model_name"] == "deterministic"
    assert body["ai_prompt_version"] == "external-job-review-v1"
