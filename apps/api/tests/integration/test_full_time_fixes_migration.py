import runpy
from pathlib import Path


def test_full_time_fixes_migration_adds_required_foundation() -> None:
    migration = runpy.run_path(str(Path("alembic/versions/014_full_time_workflow_fixes.py")))

    assert migration["down_revision"] == "013_google_jobs_email_discovery"
    source = Path("alembic/versions/014_full_time_workflow_fixes.py").read_text(encoding="utf-8")

    assert "google_identity_links" in source
    assert "uq_google_identity_links_provider_subject" in source
    assert "operator_linkedin_url" in source
    assert "ai_generation_batches" in source
    assert "ai_generation_batch_items" in source
    assert "ondelete=\"CASCADE\"" in source
