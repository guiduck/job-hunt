import pytest

from app.services import linkedin_search_provider as provider
from app.services.linkedin_search_provider import ProviderStatus, candidate_from_publication_query, fetch_public_text


def test_publication_query_maps_blocked_source(monkeypatch: pytest.MonkeyPatch) -> None:
    def blocked_fetch(*args: object, **kwargs: object) -> str:
        raise provider.LinkedInProviderError(ProviderStatus.BLOCKED, "blocked", "blocked")

    monkeypatch.setattr(provider, "fetch_public_text", blocked_fetch)

    candidate = candidate_from_publication_query(
        {"hiring_intent_term": "hiring", "keyword": "reactjs", "source_query": "hiring reactjs"},
        ["reactjs"],
    )

    assert candidate["provider_status"] == "blocked"
    assert candidate["provider_error_code"] == "blocked"
    assert candidate["rejection_reason"] == "blocked"


def test_publication_query_extracts_public_text(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(provider, "fetch_public_text", lambda *args, **kwargs: "Hiring reactjs developer jobs@example.com")

    candidate = candidate_from_publication_query(
        {"hiring_intent_term": "hiring", "keyword": "reactjs", "source_query": "hiring reactjs"},
        ["reactjs"],
    )

    assert candidate["provider_status"] == "collected"
    assert candidate["matched_keywords"] == ["reactjs"]
    assert "jobs@example.com" in str(candidate["source_evidence"])


def test_publication_query_uses_recent_sort_url(monkeypatch: pytest.MonkeyPatch) -> None:
    requested_urls = []

    def fake_fetch(url: str, *args: object, **kwargs: object) -> str:
        requested_urls.append(url)
        return "Hiring reactjs developer jobs@example.com"

    monkeypatch.setattr(provider, "fetch_public_text", fake_fetch)

    candidate_from_publication_query(
        {"hiring_intent_term": "hiring", "keyword": "reactjs", "source_query": "hiring reactjs"},
        ["reactjs"],
    )

    assert "origin=FACETED_SEARCH" in requested_urls[0]
    assert "sortBy=date_posted" in requested_urls[0]


def test_fetch_public_text_detects_linkedin_login_wall(monkeypatch: pytest.MonkeyPatch) -> None:
    class Response:
        status_code = 200
        text = "<html><title>LinkedIn Login, Sign in</title><body>Sign in with Apple New to LinkedIn? Join now</body></html>"

    monkeypatch.setattr(provider.httpx, "get", lambda *args, **kwargs: Response())

    with pytest.raises(provider.LinkedInProviderError) as exc_info:
        fetch_public_text("https://www.linkedin.com/search/results/content/?keywords=hiring+typescript")

    assert exc_info.value.status == ProviderStatus.BLOCKED
    assert exc_info.value.code == "login_required"
