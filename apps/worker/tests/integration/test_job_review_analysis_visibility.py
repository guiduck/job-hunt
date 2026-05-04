from sqlalchemy import text

from tests.integration.test_job_review_persistence import test_worker_persists_review_fields_for_accepted_candidate


def test_worker_analysis_counters_are_visible(db_session):
    test_worker_persists_review_fields_for_accepted_candidate(db_session)

    run = db_session.execute(
        text("SELECT analysis_status, deterministic_only_count FROM job_search_runs WHERE id = 'review-run'")
    ).mappings().one()
    assert run["analysis_status"] == "deterministic_only"
    assert run["deterministic_only_count"] == 1
