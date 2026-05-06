from sqlalchemy.orm import Session

from app.schemas.job_search_run import JobSearchRunCreate
from app.services.job_search_run_service import create_job_search_run, list_candidates, record_candidate


def test_persists_candidate_ai_filter_decision(
    db_session: Session,
    ai_filter_settings_payload: dict[str, object],
    ai_filter_candidate_payload: dict[str, object],
) -> None:
    run = create_job_search_run(
        db_session,
        JobSearchRunCreate(
            keywords=["typescript"],
            search_query="hiring typescript",
            ai_filters_enabled=True,
            ai_filter_settings=ai_filter_settings_payload,
        ),
    )

    candidate = record_candidate(db_session, run, ai_filter_candidate_payload)

    assert candidate.ai_filter_status == "passed"
    assert candidate.passes_ai_filter is True
    assert candidate.ai_filter_confidence == 0.91
    assert candidate.ai_filter_signals["detected_work_mode"] == "remote"


def test_candidate_list_filters_by_ai_filter_status(
    db_session: Session,
    ai_filter_candidate_payload: dict[str, object],
) -> None:
    run = create_job_search_run(db_session, JobSearchRunCreate(keywords=["typescript"]))
    record_candidate(db_session, run, ai_filter_candidate_payload)
    rejected_payload = {**ai_filter_candidate_payload, "contact_channel_value": "reject@example.com", "ai_filter_status": "rejected", "passes_ai_filter": False}
    record_candidate(db_session, run, rejected_payload)

    rejected = list_candidates(db_session, run.id, ai_filter_status="rejected")

    assert len(rejected) == 1
    assert rejected[0].outcome == "rejected_ai_filter"
