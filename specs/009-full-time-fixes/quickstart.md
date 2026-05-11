# Quickstart: Full-time Workflow Fixes

## Prerequisites

- Docker Compose available with API, worker, and PostgreSQL services.
- Plasmo extension configured with `PLASMO_PUBLIC_API_BASE_URL`.
- Google OAuth credentials configured separately for primary auth and Gmail sending where manual auth smoke is required.
- `OPENAI_API_KEY` may be empty for fallback/error-path validation, but real AI generation smoke requires a configured key.

## 1. Apply migrations and start services

```powershell
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python -m compileall app alembic
docker compose exec worker python -m compileall app
```

Expected:

- API health check succeeds.
- Worker starts without running HTTP request workloads directly.

## 2. Validate focused API behavior

```powershell
docker compose exec api python -m pytest `
  tests/integration/test_job_opportunity_filters.py `
  tests/contract/test_auth_contract.py `
  tests/contract/test_user_settings.py `
  tests/contract/test_bulk_ai_email.py
```

Expected:

- Jobs keyword search includes explicit contact email.
- Auth contracts cover Google primary auth without Gmail send authorization.
- User settings include owner-scoped LinkedIn URL.
- Bulk AI generation contract exposes per-item progress.

## 3. Validate extension typing

```powershell
cd apps/extension
npm run typecheck
```

Expected:

- API client/store types compile for paginated opportunities, Google auth actions, sender LinkedIn URL, and AI generation progress.

## 4. Manual smoke: Google auth versus Gmail OAuth

1. Open the extension popup while signed out.
2. Use `Login with Google`.
3. Confirm the app session starts and protected views load.
4. Open Settings.
5. Confirm Gmail sender remains disconnected unless the separate Gmail connection flow is completed.
6. Complete Gmail send OAuth separately and confirm only then the sender account becomes authorized.

Expected:

- Primary Google auth and Gmail sending consent are visually and technically distinct.

## 5. Manual smoke: Search region behavior

1. Fill LinkedIn Search text and sort.
2. Keep AI filters disabled and run capture.
3. Confirm region is not applied to the base LinkedIn query or run payload.
4. Enable AI filters and fill accepted/excluded regions.
5. Run capture again.
6. Confirm region is included only as post-capture AI filter context.

Expected:

- Base LinkedIn search remains text/sort-only.
- Run-level counters remain visible during processing and after terminal completion.

## 5a. Manual smoke: defensive Search feedback

1. Run a capture with AI filters enabled.
2. Confirm the Search panel shows run status, candidates, accepted/rejected/duplicate, and AI counters while the worker processes.
3. Confirm candidate AI details can include mixed or composite work-mode signals without replacing run counters with zeros.
4. Temporarily force or simulate a candidates-detail failure while the run endpoint is still available.

Expected:

- Search feedback keeps showing run-level counters and status.
- Any degraded candidate/opportunity detail state is visible as a warning, not as a zeroed run.

## 6. Manual smoke: Jobs pagination and selection

1. Seed or capture more than 50 Full-time opportunities.
2. Open Jobs.
3. Confirm only 50 jobs show by default.
4. Apply search/filter/sort and navigate next/previous pages.
5. Select `All listed`.

Expected:

- Filters/search/sort persist across pages.
- `All listed` selects only the visible current page.
- Bulk email remains capped at 50 selected items.

## 6a. Manual smoke: dedupe fallback for missing company/title

1. Capture or seed at least two approved candidate posts that share recruiter email and matched keywords but have different source URLs and no extracted company/title.
2. Run the worker processing.
3. Open Jobs and the run feedback.

Expected:

- Distinct source posts are not all marked duplicate solely because recruiter email and keywords match.
- The same source post can still be treated as duplicate on repeat capture.

## 7. Manual smoke: Sender LinkedIn URL

1. Open Settings.
2. Save a valid LinkedIn profile URL.
3. Generate an AI email for a job.
4. Confirm the generated/review context can include the LinkedIn URL.
5. Remove the LinkedIn URL and regenerate.

Expected:

- Missing LinkedIn URL does not block generation and no URL is invented.

## 8. Manual smoke: AI bulk generation progress

1. Select multiple visible jobs.
2. Start AI bulk generation.
3. Watch item statuses move through queued/running/completed/failed/skipped.
4. Open a completed item while other items are still queued/running.
5. Approve send only after reviewing generated content.

Expected:

- Completed items are reviewable immediately.
- Failed/skipped items include clear reasons.
- No send request is created without operator approval.

Current implementation note:

- The API/UI now return per-item AI generation statuses and a progress read route for review.
- Fully worker-owned queued generation and popup recovery for active batches remain follow-up work.
