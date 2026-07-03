from datetime import UTC, datetime
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import WorkerSettings
from app.jobs import career_page_job_search
from app.services.career_page_search_provider import CareerPageProviderResult


def insert_run(
    db_session: Session,
    *,
    accepted_limit: int = 1,
    inspected_cap: int = 3,
    ai_filters_enabled: bool = False,
    ai_filter_settings: dict[str, object] | None = None,
) -> None:
    now = datetime.now(UTC)
    db_session.execute(
        text(
            """
            INSERT INTO job_search_runs (
                id, user_id, search_kind, status, requested_keywords, search_query, search_sort_order,
                hiring_intent_terms, collection_source_types, selected_source_keys, source_diagnostics,
                provided_source_count, source_name, candidate_limit, accepted_limit, inspected_cap,
                inspected_count, accepted_count, rejected_count, duplicate_count, cap_reached,
                provider_status, provider_metadata, ai_filters_enabled, ai_filter_settings, created_at, updated_at
            )
            VALUES (
                'career-run-1', 'user-1', 'career_page', 'pending', :keywords, 'react remoto', 'recent',
                '[]', '[]', :sources, '{}', 0, 'Career pages', :inspected_cap, :accepted_limit, :inspected_cap,
                0, 0, 0, 0, false, 'not_started', '{}', :ai_filters_enabled, :ai_filter_settings, :now, :now
            )
            """
        ),
        {
            "keywords": json.dumps(["react"]),
            "sources": json.dumps(["ashby"]),
            "accepted_limit": accepted_limit,
            "inspected_cap": inspected_cap,
            "ai_filters_enabled": ai_filters_enabled,
            "ai_filter_settings": json.dumps(ai_filter_settings or {}),
            "now": now,
        },
    )
    db_session.commit()


def test_career_page_pipeline_persists_external_opportunity_and_diagnostics(monkeypatch, db_session: Session) -> None:
    insert_run(db_session, accepted_limit=1, inspected_cap=3)

    def fake_fetch_serpapi_results(**kwargs):
        return [
            CareerPageProviderResult(
                title="Remote React Engineer",
                link="https://jobs.ashbyhq.com/acme/react",
                snippet="Remote React role. Apply through this page.",
                source_key="ashby",
                source_name="Ashby",
                source_query="site:jobs.ashbyhq.com react remoto",
                position=1,
            )
        ]

    monkeypatch.setattr(career_page_job_search, "fetch_serpapi_results", fake_fetch_serpapi_results)

    processed = career_page_job_search.process_pending_runs(
        db_session,
        settings=WorkerSettings(serpapi_api_key="test-key", worker_max_runs_per_loop=1),
        run_once=True,
    )

    assert processed == 1
    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'career-run-1'")).mappings().one()
    candidate = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'career-run-1'")).mappings().one()
    detail = db_session.execute(text("SELECT * FROM job_opportunity_details")).mappings().one()
    assert run["status"] == "completed"
    assert run["accepted_count"] == 1
    assert run["stop_reason"] == "source_exhausted"
    assert json.loads(run["source_diagnostics"])["ashby"]["status"] == "collected"
    assert candidate["outcome"] == "accepted"
    assert candidate["application_kind"] == "external_application"
    assert candidate["selected_source_key"] == "ashby"
    assert detail["application_url"] == "https://jobs.ashbyhq.com/acme/react"
    assert detail["match_score"] is not None


def test_career_page_pipeline_respects_accepted_limit(monkeypatch, db_session: Session) -> None:
    insert_run(db_session, accepted_limit=1, inspected_cap=10)

    def fake_fetch_serpapi_results(**kwargs):
        return [
            CareerPageProviderResult(
                title=f"Remote React Engineer {index}",
                link=f"https://jobs.ashbyhq.com/acme/react-{index}",
                snippet="Remote React role. Email jobs@example.com",
                source_key="ashby",
                source_name="Ashby",
                source_query="site:jobs.ashbyhq.com react remoto",
                position=index,
            )
            for index in range(1, 4)
        ]

    monkeypatch.setattr(career_page_job_search, "fetch_serpapi_results", fake_fetch_serpapi_results)

    career_page_job_search.process_pending_runs(
        db_session,
        settings=WorkerSettings(serpapi_api_key="test-key", worker_max_runs_per_loop=1),
        run_once=True,
    )

    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'career-run-1'")).mappings().one()
    assert run["accepted_count"] == 1
    assert run["cap_reached"] == 1
    assert run["stop_reason"] == "accepted_limit"


def test_career_page_pipeline_rejects_old_dated_results(monkeypatch, db_session: Session) -> None:
    insert_run(db_session, accepted_limit=3, inspected_cap=3)

    def fake_fetch_serpapi_results(**kwargs):
        return [
            CareerPageProviderResult(
                title="Old Remote React Engineer",
                link="https://trampos.co/oportunidades/react-antiga",
                snippet="Remote React role. Apply through this page.",
                source_key="ashby",
                source_name="Ashby",
                source_query="site:jobs.ashbyhq.com react remoto",
                position=1,
                date_text="2 months ago",
                result_age_days=60,
            )
        ]

    monkeypatch.setattr(career_page_job_search, "fetch_serpapi_results", fake_fetch_serpapi_results)

    career_page_job_search.process_pending_runs(
        db_session,
        settings=WorkerSettings(serpapi_api_key="test-key", worker_max_runs_per_loop=1, career_page_result_max_age_days=31),
        run_once=True,
    )

    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'career-run-1'")).mappings().one()
    candidate = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'career-run-1'")).mappings().one()
    opportunity_count = db_session.execute(text("SELECT COUNT(*) FROM opportunities")).scalar_one()
    assert run["status"] == "completed_no_results"
    assert run["accepted_count"] == 0
    assert run["rejected_count"] == 1
    assert candidate["outcome"] == "rejected_weak_match"
    assert candidate["rejection_reason"] == "Result is older than 31 days"
    assert opportunity_count == 0


def test_career_page_pipeline_applies_ai_filters_before_creating_opportunity(monkeypatch, db_session: Session) -> None:
    insert_run(
        db_session,
        accepted_limit=3,
        inspected_cap=3,
        ai_filters_enabled=True,
        ai_filter_settings={"remote_only": True, "excluded_regions": ["India"]},
    )

    def fake_fetch_serpapi_results(**kwargs):
        return [
            CareerPageProviderResult(
                title="React Engineer - Bangalore Hybrid",
                link="https://jobs.ashbyhq.com/acme/react-india",
                snippet="Hybrid role in Bangalore, India. Apply through this page.",
                source_key="ashby",
                source_name="Ashby",
                source_query="site:jobs.ashbyhq.com react remote -India",
                position=1,
            )
        ]

    monkeypatch.setattr(career_page_job_search, "fetch_serpapi_results", fake_fetch_serpapi_results)

    def fake_ai_filter_provider(_: dict[str, object]) -> dict[str, object]:
        return {
            "passes": False,
            "reason": "Hybrid role in India does not satisfy remote-only and excluded-region filters.",
            "confidence": 0.95,
            "signals": {
                "detected_work_mode": "hybrid",
                "rejected_regions": ["India"],
                "has_real_job_opening": True,
            },
        }

    monkeypatch.setattr(
        career_page_job_search,
        "openai_ai_filter_provider",
        lambda _api_key, _model_name: fake_ai_filter_provider,
    )

    career_page_job_search.process_pending_runs(
        db_session,
        settings=WorkerSettings(
            serpapi_api_key="test-key",
            openai_api_key="test-openai-key",
            job_ai_filters_enabled=True,
            job_ai_filter_model_name="test-model",
            worker_max_runs_per_loop=1,
        ),
        run_once=True,
    )

    run = db_session.execute(text("SELECT * FROM job_search_runs WHERE id = 'career-run-1'")).mappings().one()
    candidate = db_session.execute(text("SELECT * FROM job_search_candidates WHERE run_id = 'career-run-1'")).mappings().one()
    opportunity_count = db_session.execute(text("SELECT COUNT(*) FROM opportunities")).scalar_one()
    assert run["status"] == "completed_no_results"
    assert run["accepted_count"] == 0
    assert run["rejected_count"] == 1
    assert run["ai_filter_rejected_count"] == 1
    assert candidate["outcome"] == "rejected_ai_filter"
    assert candidate["ai_filter_status"] == "rejected"
    assert json.loads(candidate["ai_filter_signals"])["rejected_regions"] == ["India"]
    assert opportunity_count == 0
