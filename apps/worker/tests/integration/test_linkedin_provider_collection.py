from app.jobs.linkedin_job_search import collect_and_inspect_candidates


def test_collects_provided_content_through_inspection_pipeline() -> None:
    inspected = collect_and_inspect_candidates(
        ["typescript"],
        collection_inputs=[
            {
                "source_type": "provided_public_content",
                "label": "manual-post",
                "provided_text": "Estamos contratando TypeScript Developer. Email jobs@example.com",
            }
        ],
        limit=50,
    )

    assert len(inspected) <= 50
    assert inspected[0]["outcome"] == "accepted"
    assert inspected[0]["collection_source_type"] == "provided_public_content"
