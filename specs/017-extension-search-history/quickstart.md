# Quickstart: Extension Search History

## Purpose

Validate the planned Search History feature for the `Full-time` extension without touching the `Freelance` web app.

## Setup

1. Start local infrastructure and API/worker using the repository's normal Docker Compose flow.
2. Load the Plasmo extension locally and authenticate as an existing user.
3. Confirm the extension Search tab can start LinkedIn authenticated browser searches.

## Validation Flow

1. Run a LinkedIn Search from the extension with a query such as `hiring typescript remote`.
2. Ensure the run records the query, requested keywords, sort order, and raw LinkedIn results discovered before dedupe/filtering.
3. Run the same or similar query again so duplicates are likely.
4. Open the new History tab.
5. Verify 20 recent runs show query text, keyword tokens, status, run time, raw LinkedIn results, accepted, rejected, duplicate, and AI counters when present.
6. Verify exact-query aggregates add raw results from both runs even when duplicate count increases.
7. Verify keyword aggregates count each token once per run and remain visible below the 20-run list without a default date cutoff.
8. Create or inspect an old run without raw count and verify History shows `Unknown`, not `0`.
9. Confirm candidate/opportunity/run detail links stay owner-scoped and show only safe diagnostics.
10. Confirm `apps/web` Freelance leads, templates, outreach batches, Email settings, WhatsApp settings, and provider configuration are unchanged.

## Focused Tests To Run After Implementation

API:

```powershell
cd apps\api
python -m pytest tests\unit\test_linkedin_runs_e2e_schema.py tests\contract\test_job_search_runs_contract.py tests\integration\test_job_search_runs_api.py
```

Add new focused tests for nullable raw count schema/migration, history endpoint owner scoping, aggregate totals/averages with unknown raw counts, duplicate-heavy repeated runs preserving raw totals, and career-page exclusion.

Extension:

```powershell
cd apps\extension
npm.cmd run typecheck
npm.cmd run test -- SearchView.test.tsx popupStore.test.ts
```

Add new focused tests for History tab navigation, unknown raw count rendering, aggregate rendering, and status/query filter behavior.

## Expected Result

The operator can identify the 20 most recent LinkedIn Search runs and the best keywords from the extension in under 30 seconds, using raw LinkedIn/capture results rather than dedupe-adjusted outcomes.
