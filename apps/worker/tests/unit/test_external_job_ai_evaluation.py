from app.services.career_page_search_provider import CareerPageProviderResult
from app.services.external_job_normalizer import normalize_external_job_result


def test_external_job_reuses_ai_analysis_provider() -> None:
    result = CareerPageProviderResult(
        title="Remote React Engineer",
        link="https://jobs.ashbyhq.com/acme/react",
        snippet="Remote React job. Email jobs@example.com",
        source_key="ashby",
        source_name="Ashby",
        source_query="site:jobs.ashbyhq.com react",
    )

    def ai_provider(candidate: dict[str, object]) -> dict[str, object]:
        assert candidate["role_title"] == "Remote React Engineer"
        return {
            "match_score": 91,
            "score_explanation": "Strong React remote fit.",
            "confidence": "high",
            "normalized_role_title": "React Engineer",
        }

    candidate = normalize_external_job_result(result, requested_keywords=["react"], ai_enabled=True, ai_provider=ai_provider)

    assert candidate["review_profile"]["analysis_status"] == "ai_assisted"
    assert candidate["review_profile"]["match_score"] == 91
    assert candidate["review_profile"]["score_explanation"] == "Strong React remote fit."


def test_external_job_ai_failure_falls_back() -> None:
    result = CareerPageProviderResult(
        title="Remote React Engineer",
        link="https://jobs.ashbyhq.com/acme/react",
        snippet="Remote React job. Email jobs@example.com",
        source_key="ashby",
        source_name="Ashby",
        source_query="site:jobs.ashbyhq.com react",
    )

    def ai_provider(_: dict[str, object]) -> dict[str, object]:
        raise TimeoutError("slow")

    candidate = normalize_external_job_result(result, requested_keywords=["react"], ai_enabled=True, ai_provider=ai_provider)

    assert candidate["review_profile"]["analysis_status"] == "fallback"
    assert candidate["review_profile"]["analysis_error_code"] == "ai_timeout"
