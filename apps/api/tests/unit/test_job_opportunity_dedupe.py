from app.services.job_dedupe import build_job_dedupe_key


def test_dedupe_key_uses_company_title_keywords_and_contact() -> None:
    first = build_job_dedupe_key("Example Co", "Frontend Engineer", None, ["typescript", "reactjs"], "jobs@example.com")
    second = build_job_dedupe_key(" example co ", "Frontend Engineer", None, ["reactjs", "typescript"], "jobs@example.com")
    assert first == second


def test_dedupe_key_changes_for_different_contact_channel() -> None:
    first = build_job_dedupe_key("Example Co", "Frontend Engineer", None, ["typescript"], "jobs@example.com")
    second = build_job_dedupe_key("Example Co", "Frontend Engineer", None, ["typescript"], "talent@example.com")
    assert first != second


def test_dedupe_key_uses_source_url_when_title_and_company_are_missing() -> None:
    first = build_job_dedupe_key(None, None, None, ["react", "node"], "jobs@example.com", "https://linkedin.com/feed/update/1")
    second = build_job_dedupe_key(None, None, None, ["node", "react"], "jobs@example.com", "https://linkedin.com/feed/update/2")
    assert first != second


def test_dedupe_key_ignores_source_url_when_title_or_company_exists() -> None:
    first = build_job_dedupe_key("Example Co", "Frontend Engineer", None, ["react"], "jobs@example.com", "https://linkedin.com/feed/update/1")
    second = build_job_dedupe_key("Example Co", "Frontend Engineer", None, ["react"], "jobs@example.com", "https://linkedin.com/feed/update/2")
    assert first == second
