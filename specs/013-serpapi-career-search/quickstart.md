# Quickstart: Curated Career Page Search

## Prerequisites

- Local PostgreSQL/API/worker environment available through Docker Compose or the existing local setup.
- Authenticated extension user.
- Search provider key configured in backend/worker environment; the key must not be exposed to Plasmo.
- `OPENAI_API_KEY` may be empty for fallback validation; AI matching should degrade safely.

## Local Setup

1. Apply migrations:

```powershell
docker compose exec api alembic upgrade head
```

2. Restart API and worker:

```powershell
docker compose restart api worker
```

3. Build/typecheck extension:

```powershell
cd apps/extension
npm.cmd run typecheck
npm.cmd run build
```

## Manual Smoke Flow

1. Log in through the Plasmo popup.
2. Open the Search tab.
3. Enter keywords such as `react frontend remoto`.
4. Confirm all active career-page sources are checked by default.
5. Confirm the career-page search button shows latest search time or empty first-run state.
6. Click the career-page search button.
7. Confirm the button is disabled while the career-page run is pending/running.
8. Confirm run progress/counters appear without depending on LinkedIn scroll settings.
9. After completion, open Jobs.
10. Confirm jobs with usable email appear under `With email`.
11. Confirm no-email jobs with usable apply URL appear under `External applications`.
12. Open an email-bearing career-page job and confirm:
    - email send/bulk send eligibility remains available
    - apply URL is preserved in detail when present
13. Open an external application job and confirm:
    - one primary action opens the apply URL
    - bulk selection allows delete only
    - marking applied changes `job_stage=applied`
    - no Gmail send request or outreach event is created
14. Refresh dashboard and confirm email/external counts update.

## Focused Validation

API:

```powershell
cd apps/api
python -m compileall app alembic
python -m pytest tests/contract/test_career_page_search_contract.py tests/integration/test_career_page_search.py tests/integration/test_external_application_jobs.py tests/integration/test_opportunity_metrics.py
```

Worker:

```powershell
cd apps/worker
python -m pytest tests/unit/test_career_page_search_provider.py tests/unit/test_external_job_normalizer.py tests/integration/test_career_page_search_pipeline.py
```

Extension:

```powershell
cd apps/extension
npm.cmd run typecheck
npm.cmd run build
```

## Expected Results

- Every career-page button click creates a new provider run.
- No duplicate career-page run can be started while one is already active for the user.
- Runs stop at accepted-opportunity max, inspected-candidate cap, provider exhaustion, or failure.
- Accepted opportunities are persisted in PostgreSQL and owner-scoped.
- Search diagnostics show selected sources, inspected/accepted/rejected/duplicate counts, provider status, and cap-reached stop reason.
- Existing LinkedIn capture, Gmail OAuth/send, bulk email, and AI field assistant still work.

