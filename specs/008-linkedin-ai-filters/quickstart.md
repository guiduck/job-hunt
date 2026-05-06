# Quickstart: LinkedIn AI Filters

## Goal

Validate that LinkedIn search stays broad, optional AI filters evaluate captured posts after collection, fallback preserves current behavior, and run/candidate diagnostics remain owner-scoped.

## Prerequisites

- Local PostgreSQL/API/worker environment configured.
- Extension points to the local API through `PLASMO_PUBLIC_API_BASE_URL`.
- A logged-in extension user with bearer auth.
- Optional AI config available only to API/worker environment, not extension:
  - `OPENAI_API_KEY`
  - `AI_EMAIL_MODEL` or the current project AI model variable used by worker services

## Local Setup

1. Start local services:

   ```bash
   docker compose up -d
   ```

2. Run migrations after implementation adds the AI filter fields:

   ```bash
   cd apps/api
   alembic upgrade head
   ```

3. Start or reload the Plasmo extension:

   ```bash
   cd apps/extension
   npm run dev
   ```

4. Confirm login works in the extension before running capture.

## Smoke 1: Broad Search Without AI Filters

1. Open the extension Search tab.
2. Confirm the `LinkedIn search` section only contains:
   - search text/query
   - sort order: recent or relevant
3. Confirm `AI filters` is disabled by default.
4. Enter:

   ```text
   hiring typescript
   ```

5. Select `recent`.
6. Start capture.
7. Confirm LinkedIn opens with the query and sort order only.
8. Confirm posts are not removed in the extension because of remote, region, or excluded keyword settings.
9. Confirm the run is created and current deterministic/local behavior still accepts otherwise valid candidates.

Expected result:

- Run completes or reports normal provider/capture status.
- Existing run fields render.
- AI filter counters are zero/default or fallback/skipped as designed.
- No AI secrets are visible in extension logs, payloads, or responses.

## Smoke 2: AI Filters Pass And Reject

1. Open Search.
2. Enable `AI filters`.
3. Configure:
   - remote-only: enabled
   - exclude onsite/hybrid/presential: enabled
   - accepted regions: `LATAM, Brazil, Portugal, Europe`
   - excluded regions: `India`
   - excluded keywords: `relocation, onsite`
4. Run a broad search such as:

   ```text
   hiring typescript
   ```

5. Inspect run candidates:

   ```bash
   TOKEN="<TOKEN>"
   RUN_ID="<RUN_ID>"
   curl "http://localhost:8000/job-search-runs/$RUN_ID/candidates" -H "Authorization: Bearer $TOKEN"
   ```

Expected result:

- Candidates that clearly pass record `ai_filter_status=passed`, `passes_ai_filter=true`, reason, confidence, and signals.
- Candidates that clearly require onsite/hybrid/presential or excluded regions record `ai_filter_status=rejected`, `passes_ai_filter=false`, reason, confidence, and retained evidence.
- Rejected candidates do not create accepted opportunities.
- Accepted candidates continue into the existing opportunity list/review pipeline.

## Smoke 3: Fallback Cases

Run these cases separately:

1. AI filters enabled but AI config missing.
2. AI filters enabled but AI provider returns invalid structured output.
3. AI filters enabled but provider is unavailable or rate-limited.
4. AI filters enabled but returned confidence is below `0.70`.

Expected result:

- Capture does not crash.
- Affected candidates record `ai_filter_status=fallback`.
- Fallback reason/error is visible.
- Otherwise valid candidates continue when deterministic/local rules accept them.
- Run counters include fallback count.

## Smoke 4: Counters And Diagnostics

1. Use a run with a mix of:
   - passed AI filter
   - rejected AI filter
   - fallback
   - duplicate
   - provider or parse failure
2. Fetch the run:

   ```bash
   TOKEN="<TOKEN>"
   RUN_ID="<RUN_ID>"
   curl "http://localhost:8000/job-search-runs/$RUN_ID" -H "Authorization: Bearer $TOKEN"
   ```

Expected result:

- Run exposes inspected, accepted, rejected, duplicate, AI-filter rejected, AI-filter fallback, and AI-filter failed/skipped counts.
- Duplicate candidates are not counted as AI-filter rejected.
- Existing provider and analysis status remain understandable.

## Smoke 5: Ownership

1. Create or use two users.
2. User A creates an AI-filtered run.
3. User B attempts:

   ```bash
   curl "http://localhost:8000/job-search-runs/<USER_A_RUN_ID>" -H "Authorization: Bearer <USER_B_TOKEN>"
   curl "http://localhost:8000/job-search-runs/<USER_A_RUN_ID>/candidates" -H "Authorization: Bearer <USER_B_TOKEN>"
   ```

Expected result:

- User B receives not-found or unauthorized behavior consistent with existing owner-scoped routes.
- No run, candidate, evidence, filter settings, or filter reason from User A is exposed.

## Automated Validation Targets

Run focused API tests:

```bash
cd apps/api
pytest tests/contract tests/integration -q
```

Run focused worker tests:

```bash
cd apps/worker
pytest tests/unit tests/integration -q
```

Run extension typecheck:

```bash
cd apps/extension
npm run typecheck
```

## Regression Checklist

- Existing runs without AI filter fields still render.
- Existing candidate and opportunity list/detail contracts remain compatible.
- LinkedIn URL builder does not include AI filter settings.
- Extension payloads do not contain AI secrets.
- Worker, not API request handlers, performs AI filter evaluation.
- Rejected candidates retain captured evidence and filter decision metadata.

## Implementation Notes

- Current worker wiring includes the filter service, OpenAI-compatible provider adapter, structured validation, confidence fallback, and deterministic local fallback.
- If `JOB_AI_FILTERS_ENABLED=true` and `OPENAI_API_KEY` is configured, enabled runs can produce model-backed `passed` or `rejected` decisions. Without a provider key, enabled filters use fallback rules and record fallback metadata.
- Focused checks used during implementation:
  - `cd apps/api && python -m pytest tests/unit/test_linkedin_ai_filter_schema.py tests/contract/test_linkedin_ai_filter_contract.py tests/contract/test_linkedin_ai_filter_diagnostics_contract.py tests/integration/test_linkedin_ai_filters_compatibility.py tests/integration/test_linkedin_ai_filter_candidates.py tests/integration/test_linkedin_ai_filter_counters.py tests/integration/test_linkedin_ai_filter_ownership.py`
  - `cd apps/worker && python -m pytest tests/unit/test_job_ai_filter.py tests/integration/test_linkedin_ai_filter_pipeline.py tests/integration/test_linkedin_ai_filter_counters.py`
  - `cd apps/extension && npm run typecheck`
