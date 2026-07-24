from app.services.career_page_search_provider import CareerPageProviderResult
from app.services.external_job_normalizer import extract_email, normalize_external_job_result


def test_extract_email_from_result_text() -> None:
    assert extract_email("Apply by emailing Jobs+React@Example.com now") == "jobs+react@example.com"


def test_normalize_email_result_classifies_as_email() -> None:
    result = CareerPageProviderResult(
        title="Frontend Engineer",
        link="https://jobs.ashbyhq.com/acme/frontend",
        snippet="Remote React role. Email jobs@example.com",
        source_key="ashby",
        source_name="Ashby",
        source_query="site:jobs.ashbyhq.com react",
    )

    candidate = normalize_external_job_result(result, requested_keywords=["react"], ai_enabled=False)

    assert candidate["contact_channel_type"] == "email"
    assert candidate["contact_channel_value"] == "jobs@example.com"
    assert candidate["application_kind"] == "email"
    assert candidate["application_url"] == result.link
    assert candidate["matched_keywords"] == ["react"]


def test_normalize_no_email_result_classifies_as_external_application() -> None:
    result = CareerPageProviderResult(
        title="Backend Engineer",
        link="https://jobs.lever.co/acme/backend",
        snippet="Remote Node role. Apply through this page.",
        source_key="lever",
        source_name="Lever",
        source_query="site:jobs.lever.co node",
    )

    candidate = normalize_external_job_result(result, requested_keywords=["node"], ai_enabled=False)

    assert candidate["contact_channel_type"] == "other_public_contact"
    assert candidate["contact_channel_value"] == result.link
    assert candidate["application_kind"] == "external_application"


def test_normalize_stale_result_sets_rejection_hint() -> None:
    result = CareerPageProviderResult(
        title="Closed Frontend Engineer",
        link="https://jobs.lever.co/acme/frontend",
        snippet="This role is closed and no longer accepting applications.",
        source_key="lever",
        source_name="Lever",
        source_query="site:jobs.lever.co frontend",
    )

    candidate = normalize_external_job_result(result, requested_keywords=["frontend"], ai_enabled=False)

    assert candidate["outcome_hint"] == "rejected_weak_match"
    assert candidate["rejection_reason"] == "Result appears stale or closed"


def test_normalize_old_dated_result_sets_rejection_hint() -> None:
    result = CareerPageProviderResult(
        title="Frontend Engineer",
        link="https://trampos.co/oportunidades/frontend-antiga",
        snippet="Remote React role. Apply through this page.",
        source_key="trampos",
        source_name="Trampos",
        source_query="site:trampos.co frontend",
        date_text="2 months ago",
        result_age_days=60,
    )

    candidate = normalize_external_job_result(result, requested_keywords=["frontend"], ai_enabled=False, max_age_days=31)

    assert candidate["outcome_hint"] == "rejected_weak_match"
    assert candidate["rejection_reason"] == "Result is older than 31 days"

from app.services.external_job_normalizer import canonicalize_external_application_url, decode_linkedin_safety_redirect, match_external_job_source


def test_linkedin_safety_redirect_decodes_and_canonicalizes_apply_url() -> None:
    raw = "https://www.linkedin.com/safety/go?url=https%3A%2F%2Fjobs.ashbyhq.com%2Fexample%2Fabc%3Futm_source%3Dlinkedin%26jobId%3D123"

    assert decode_linkedin_safety_redirect(raw) == "https://jobs.ashbyhq.com/example/abc?utm_source=linkedin&jobId=123"
    assert canonicalize_external_application_url(raw) == "https://jobs.ashbyhq.com/example/abc?jobId=123"


def test_match_external_job_source_respects_selected_active_sources() -> None:
    assert match_external_job_source("https://jobs.lever.co/example/backend", ["lever"]) == "lever"
    assert match_external_job_source("https://jobs.lever.co/example/backend", ["ashby"]) is None
    assert match_external_job_source("https://jobs.teamtailor.com/example/backend", ["teamtailor"]) is None