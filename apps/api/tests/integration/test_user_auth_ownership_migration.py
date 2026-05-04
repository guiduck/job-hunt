import runpy
from pathlib import Path


def test_auth_ownership_migration_targets_required_tables():
    migration = runpy.run_path(str(Path("alembic/versions/009_user_auth_ownership.py")))

    assert migration["down_revision"] == "008_remove_global_limits"
    assert "user_settings" in migration["OWNED_TABLES"]
    assert "resume_attachments" in migration["OWNED_TABLES"]
    assert "email_templates" in migration["OWNED_TABLES"]
    assert "sending_provider_accounts" in migration["OWNED_TABLES"]
    assert "job_search_runs" in migration["OWNED_TABLES"]
    assert "opportunities" in migration["OWNED_TABLES"]
    assert "email_drafts" in migration["OWNED_TABLES"]
    assert "send_requests" in migration["OWNED_TABLES"]
    assert "bulk_send_batches" in migration["OWNED_TABLES"]
    assert "outreach_events" in migration["OWNED_TABLES"]


def test_auth_ownership_migration_preserves_row_counts_by_backfilling_in_place():
    migration_source = Path("alembic/versions/009_user_auth_ownership.py").read_text(encoding="utf-8")

    assert "UPDATE {table_name} SET user_id = :user_id WHERE user_id IS NULL" in migration_source
    assert ".drop_column(table_name, \"user_id\")" in migration_source
