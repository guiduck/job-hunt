from app.services.job_search_preferences_service import (
    MAX_SAVED_SEARCH_KEYWORDS,
    merge_saved_search_keywords,
    normalize_search_keywords,
)


def test_normalize_search_keywords_splits_words_and_dedupes_intent_terms() -> None:
    assert normalize_search_keywords("Hiring React react, TypeScript/remoto\njobs") == [
        "react",
        "typescript",
        "remoto",
    ]


def test_merge_saved_search_keywords_keeps_old_keywords_and_caps_at_thirty() -> None:
    existing = [f"term-{index}" for index in range(MAX_SAVED_SEARCH_KEYWORDS - 1)]
    merged = merge_saved_search_keywords(existing, ["react", "typescript", "react"])

    assert len(merged) == MAX_SAVED_SEARCH_KEYWORDS
    assert merged[:2] == ["term-0", "term-1"]
    assert merged[-1] == "react"
    assert "typescript" not in merged
