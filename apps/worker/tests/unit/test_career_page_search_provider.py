from app.core.config import WorkerSettings
from app.services.career_page_search_provider import build_recency_tbs, build_source_query, result_age_days
from app.services.career_page_sources import source_by_key


def test_build_source_query_uses_site_and_keywords_without_board_inputs() -> None:
    source = source_by_key()["ashby"]

    query = build_source_query(source, ["react", "remoto"])

    assert query == "site:jobs.ashbyhq.com react remoto"


def test_worker_settings_include_provider_caps() -> None:
    settings = WorkerSettings(
        serpapi_api_key="key",
        career_page_default_accepted_limit=7,
        career_page_default_inspected_cap=31,
        career_page_result_max_age_days=31,
    )

    assert settings.career_page_search_provider == "serpapi"
    assert settings.serpapi_api_key == "key"
    assert settings.career_page_default_accepted_limit == 7
    assert settings.career_page_default_inspected_cap == 31
    assert settings.career_page_result_max_age_days == 31


def test_default_recency_window_uses_past_month_google_filter() -> None:
    assert build_recency_tbs(31) == "qdr:m"


def test_result_age_days_parses_relative_serpapi_dates() -> None:
    assert result_age_days("3 days ago") == 3
    assert result_age_days("há 2 semanas") == 14
