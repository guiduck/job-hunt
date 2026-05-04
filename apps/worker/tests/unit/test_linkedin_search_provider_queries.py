from app.services.linkedin_search_provider import build_publication_queries


def test_builds_hiring_intent_keyword_queries() -> None:
    queries = build_publication_queries(["reactjs", "typescript"], ["hiring", "contratando"])

    assert queries == [
        {"hiring_intent_term": "hiring", "keyword": "reactjs", "source_query": "hiring reactjs"},
        {"hiring_intent_term": "hiring", "keyword": "typescript", "source_query": "hiring typescript"},
        {"hiring_intent_term": "contratando", "keyword": "reactjs", "source_query": "contratando reactjs"},
        {"hiring_intent_term": "contratando", "keyword": "typescript", "source_query": "contratando typescript"},
    ]
