from app.services.linkedin_search_provider import candidate_from_provided_input, normalize_collection_inputs
from app.services.linkedin_search_provider import collect_candidates


def test_normalizes_user_provided_public_content() -> None:
    [item] = normalize_collection_inputs(
        [
            {
                "source_type": "provided_public_content",
                "label": "manual-post",
                "provided_text": "Estamos contratando TypeScript dev. Email jobs@example.com",
            }
        ]
    )

    candidate = candidate_from_provided_input(item, ["typescript", "reactjs"])

    assert candidate["collection_source_type"] == "provided_public_content"
    assert candidate["provider_status"] == "collected"
    assert candidate["matched_keywords"] == ["typescript"]
    assert candidate["source_query"] == "manual-post"


def test_normalizes_authenticated_browser_search() -> None:
    [item] = normalize_collection_inputs(
        [
            {
                "source_type": "authenticated_browser_search",
                "label": "hiring typescript #1",
                "provided_text": "We're hiring a TypeScript developer. Email jobs@example.com",
            }
        ]
    )

    candidate = candidate_from_provided_input(item, ["typescript", "reactjs"])

    assert candidate["collection_source_type"] == "authenticated_browser_search"
    assert candidate["provider_name"] == "linkedin_authenticated_browser"
    assert candidate["provider_status"] == "collected"
    assert candidate["matched_keywords"] == ["typescript"]


def test_collect_candidates_respects_collection_source_types(monkeypatch) -> None:
    def fail_if_public_search_runs(*args, **kwargs):
        raise AssertionError("automatic publication search should not run")

    monkeypatch.setattr("app.services.linkedin_search_provider.candidate_from_publication_query", fail_if_public_search_runs)

    candidates = collect_candidates(
        ["typescript"],
        collection_source_types=["authenticated_browser_search"],
        collection_inputs=[
            {
                "source_type": "authenticated_browser_search",
                "label": "browser-post",
                "provided_text": "We're hiring TypeScript engineers. Email jobs@example.com",
            }
        ],
        candidate_limit=50,
    )

    assert len(candidates) == 1
    assert candidates[0]["collection_source_type"] == "authenticated_browser_search"
