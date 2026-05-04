from app.schemas.job_search_run import JobSearchRunCreate


def test_collection_schema_defaults_to_hiring_terms_and_publication_search() -> None:
    payload = JobSearchRunCreate()

    assert payload.hiring_intent_terms == ["hiring", "contratando", "contratamos"]
    assert [source.value for source in payload.collection_source_types] == ["automatic_publication_search"]


def test_collection_schema_accepts_provided_public_content() -> None:
    payload = JobSearchRunCreate(
        collection_source_types=["provided_public_content"],
        collection_inputs=[
            {
                "source_type": "provided_public_content",
                "label": "manual-post",
                "provided_text": "Estamos contratando TypeScript Developer",
            }
        ],
    )

    assert payload.collection_inputs[0].source_type.value == "provided_public_content"


def test_collection_schema_accepts_authenticated_browser_search() -> None:
    payload = JobSearchRunCreate(
        collection_source_types=["authenticated_browser_search"],
        collection_inputs=[
            {
                "source_type": "authenticated_browser_search",
                "label": "hiring typescript #1",
                "source_url": "https://www.linkedin.com/search/results/content/?keywords=hiring%20typescript",
                "provided_text": "We're hiring a TypeScript developer. Email jobs@example.com",
            }
        ],
    )

    assert payload.collection_source_types[0].value == "authenticated_browser_search"
    assert payload.collection_inputs[0].source_type.value == "authenticated_browser_search"
