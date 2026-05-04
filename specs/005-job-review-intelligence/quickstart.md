# Quickstart: Job Review Intelligence

## Goal

Validate locally that accepted LinkedIn `job` opportunities become review-ready with a 0-100 score, explanation, review status, analysis/fallback visibility, normalized role/company fields, missing keywords, and filters needed by the future `Full-time` review UI.

## Prerequisites

- Active branch is `005-job-review-intelligence`.
- API and worker dependencies are installed.
- Database migrations for this branch are applied.
- Docker Desktop is available for full Compose validation, or API/worker can run manually against the same PostgreSQL database.
- Optional AI analysis credentials/config may be absent; deterministic-only validation must still pass.

## Local Stack

1. Start local services when Docker is available:

   ```bash
   docker compose up -d
   ```

2. If running manually, apply migrations:

   ```bash
   cd apps/api
   alembic upgrade head
   ```

3. Start the API:

   ```bash
   cd apps/api
   uvicorn app.main:app --reload
   ```

4. Start the worker:

   ```bash
   cd apps/worker
   python -m app.main
   ```

Expected behavior:

- API creates runs and exposes review filters.
- Worker claims pending runs and performs deterministic collection, parsing, normalization, review scoring, and optional AI analysis.
- AI-disabled or AI-failed cases still produce deterministic review profiles or visible fallback status.
- Provider failures remain visible and create no fabricated opportunities.

## Validation Flow

### 1. Create a deterministic supplied-content run

Use public content supplied by the user so validation does not depend on live LinkedIn access:

```bash
curl -X POST http://localhost:8000/job-search-runs \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["typescript", "reactjs", "nextjs"],
    "collection_source_types": ["provided_public_content"],
    "collection_inputs": [
      {
        "source_type": "provided_public_content",
        "label": "manual-linkedin-post",
        "provided_text": "We are hiring a Senior TypeScript Developer for a remote React and Next.js product role. Send your resume to jobs@example.com.",
        "source_url": "https://www.linkedin.com/feed/update/example-review-intelligence"
      }
    ],
    "candidate_limit": 50
  }'
```

Expected response:

- HTTP `202`
- run status is `pending`
- provider status is `not_started`
- analysis summary defaults are visible or become visible after worker processing

### 2. Observe run analysis completion

Poll until terminal:

```bash
curl http://localhost:8000/job-search-runs/<run_id>
```

Expected terminal result:

- `status` is `completed`
- `provider_status` is `collected`
- `analysis_status` is `deterministic_only`, `ai_assisted`, or `fallback`
- analysis counters reconcile with candidate rows
- no HTTP request handler performed collection or analysis work

### 3. Inspect candidates

```bash
curl "http://localhost:8000/job-search-runs/<run_id>/candidates?analysis_status=deterministic_only"
```

Expected accepted candidate fields:

- `outcome` is `accepted`
- `review_profile.match_score` is an integer from 0 to 100
- `review_profile.score_explanation` references source evidence, keyword fit, contact, and missing keywords
- `review_profile.analysis_status` explains whether analysis was deterministic-only, AI-assisted, or fallback
- `review_profile.missing_keywords` contains requested keywords not supported by evidence
- normalized company/role and detected seniority/modality/location appear when detectable

### 4. Inspect run-scoped opportunities

```bash
curl http://localhost:8000/job-search-runs/<run_id>/opportunities
```

Expected accepted opportunity fields:

- `opportunity_type` is `job`
- source fields are preserved: `source_query`, `source_url`, `source_evidence`
- `job_detail.review_profile.review_status` defaults to `unreviewed`
- `job_detail.review_profile.match_score` is a 0-100 integer
- `job_detail.review_profile.analysis_status` is visible
- `job_detail.job_stage` remains separate from review status

### 5. Filter Full-time opportunities

```bash
curl "http://localhost:8000/opportunities?opportunity_type=job&min_score=60&matched_keyword=typescript&contact_available=true&review_status=unreviewed"
```

Expected result:

- only `job` opportunities are returned
- returned rows meet the minimum score and keyword/contact/review filters
- no `Freelance` records appear
- source/run linkage is visible where available

### 6. Update review status and notes

```bash
curl -X PATCH http://localhost:8000/opportunities/<opportunity_id> \
  -H "Content-Type: application/json" \
  -d '{
    "review_status": "saved",
    "operator_notes": "Good fit for TypeScript and remote product work."
  }'
```

Expected result:

- `review_status` changes to `saved`
- `operator_notes` changes
- `source_evidence`, score explanation, matched keywords, and analysis fields remain intact
- `job_stage` is unchanged unless explicitly provided

### 7. Validate historical score adjustment

Create or update a prior similar opportunity with `review_status=saved` or later `job_stage=responded`/`interview`, then create another run with similar keywords or description.

Expected result:

- current opportunity evidence remains the primary score source
- `score_factors.historical_adjustment` or `historical_similarity_signals` shows the adjustment when comparable history exists
- absence of history does not fail scoring

### 8. Validate AI fallback behavior

Run with AI analysis disabled or configured to return invalid structured output in a test fixture.

Expected result:

- accepted candidates remain reviewable with deterministic score/explanation
- `analysis_status` is `deterministic_only` when AI is disabled
- `analysis_status` is `fallback` when AI was attempted and failed validation
- `analysis_error_code` or `analysis_error_message` is visible for fallback/failure
- invalid AI JSON is not persisted as trusted review data

### 9. Validate provider failure behavior

Use an inaccessible or blocked source, or mock provider failure in tests.

Expected result:

- run/candidate provider status shows blocked, inaccessible, empty, or failed
- candidate analysis may be `skipped`
- no accepted opportunity is fabricated
- review filters do not show fabricated rows

## Automated Test Expectations

- API contract tests cover new fields on opportunities, job details, runs, and candidates.
- API integration tests cover `min_score`, keyword, contact availability, `review_status`, `job_stage`, provider status, analysis status, and run/source filters.
- API update tests cover review status/notes updates without overwriting evidence or analysis fields.
- Worker unit tests cover deterministic scoring, missing keywords, normalized job attributes, historical adjustment, and fallback status.
- Worker integration tests cover end-to-end persistence from run processing to review-ready accepted opportunities.
- AI analyzer tests cover disabled AI, valid structured output, invalid JSON, incomplete output, timeout/unavailable, and deterministic fallback.
- Migration tests cover old accepted opportunities remaining readable with safe defaults.
- Regression tests confirm `Freelance` records are not modified and do not appear in `Full-time` review lists.

## Latest Local Validation

- 2026-05-01: `cd apps/api && python -m pytest` passed with 45 tests.
- 2026-05-01: `cd apps/worker && python -m pytest` passed with 37 tests.
- 2026-05-01: `docker compose config` passed.
- 2026-05-01: `docker compose up -d` started Postgres, API, and worker successfully after adding API package discovery and an API healthcheck dependency for the worker.
- 2026-05-01: supplied-content quickstart run completed with `provider_status=collected`, one accepted opportunity, and a visible review profile (`review_status=unreviewed`, `analysis_status=deterministic_only`, `match_score` present).
