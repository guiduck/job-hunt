from datetime import UTC, datetime

from app.schemas.job_search_run import JobSearchRun, LinkedInCollectionInputRead, ProviderStatus


def test_job_search_run_schema_exposes_collection_inputs_and_stale_failure_fields() -> None:
    now = datetime.now(UTC)

    payload = JobSearchRun(
        id="run-1",
        status="failed",
        requested_keywords=["typescript"],
        hiring_intent_terms=["hiring"],
        collection_source_types=["provided_public_content"],
        collection_inputs=[
            LinkedInCollectionInputRead(
                id="input-1",
                run_id="run-1",
                source_type="provided_public_content",
                source_url="https://www.linkedin.com/feed/update/example",
                provided_text="We're hiring a TypeScript developer. Email jobs@example.com",
                label="manual-linkedin-post",
                created_at=now,
            )
        ],
        provided_source_count=1,
        source_name="LinkedIn",
        candidate_limit=50,
        inspected_count=0,
        accepted_count=0,
        rejected_count=0,
        duplicate_count=0,
        cap_reached=False,
        provider_status=ProviderStatus.FAILED,
        provider_error_code="stale_running",
        provider_error_message="Run was left running before worker startup and was not retried automatically.",
        created_at=now,
        updated_at=now,
    )

    dumped = payload.model_dump()

    assert dumped["collection_inputs"][0]["provided_text"].startswith("We're hiring")
    assert dumped["provider_error_code"] == "stale_running"
