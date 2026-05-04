import runpy
from pathlib import Path


def test_auth_ownership_backfill_uses_single_default_local_owner():
    migration = runpy.run_path(str(Path("alembic/versions/009_user_auth_ownership.py")))
    expected_tables = {
        "user_settings",
        "resume_attachments",
        "email_templates",
        "sending_provider_accounts",
        "job_search_runs",
        "job_search_candidates",
        "linkedin_collection_inputs",
        "opportunities",
        "email_drafts",
        "send_requests",
        "bulk_send_batches",
        "outreach_events",
    }

    assert migration["DEFAULT_LOCAL_USER_ID"] == "00000000-0000-4000-8000-000000000007"
    assert migration["DEFAULT_LOCAL_USER_EMAIL"] == "local@example.com"
    assert len(set(migration["OWNED_TABLES"])) == len(migration["OWNED_TABLES"])
    assert set(migration["OWNED_TABLES"]) == expected_tables
