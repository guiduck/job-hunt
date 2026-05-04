# Quickstart: LinkedIn Runs End-to-End Execution

## Goal

Validate locally that the API can create a LinkedIn Job Search run, the separate worker can discover
and process it from PostgreSQL, inspected candidates become visible, accepted contactable candidates
create `job` opportunities, and provider failures or stale runs are recorded without fabricating
opportunities.

## Prerequisites

- Docker Desktop is running.
- The active branch is `004-linkedin-runs-e2e`.
- API and worker dependencies are installed.
- Database migrations are available for the current branch.
- If public LinkedIn search is blocked locally, use supplied public content for deterministic validation.

## Local Stack

1. Start local services:

   ```bash
   docker compose up -d
   ```

   Compose starts PostgreSQL, applies API migrations in the API container, exposes the API on
   `localhost:8000`, and starts the worker against the same PostgreSQL database.

2. If running services manually instead of Compose, apply database migrations:

   ```bash
   cd apps/api
   alembic upgrade head
   ```

3. Start the API if it is not already running through Compose:

   ```bash
   cd apps/api
   uvicorn app.main:app --reload
   ```

4. Start the worker if it is not already running through Compose:

   ```bash
   cd apps/worker
   python -m app.main
   ```

Expected worker behavior:

- worker checks for stale `running` runs on startup and marks them failed/stale
- worker polls for `pending` runs
- worker claims a pending run as `running`
- worker processes provider/parser/normalizer output
- worker records candidates and accepted opportunities
- worker finalizes the run as `completed`, `completed_no_results`, or `failed`

Docker-oriented smoke check:

```bash
docker compose ps
curl http://localhost:8000/health
```

If the API service is still installing dependencies or applying migrations, wait for the container log
to show Uvicorn startup before creating the first run.

## Validation Flow

### 1. Create a deterministic supplied-content run

Use supplied public content to validate the end-to-end path without depending on live LinkedIn access:

```bash
curl -X POST http://localhost:8000/job-search-runs \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["typescript"],
    "collection_source_types": ["provided_public_content"],
    "collection_inputs": [
      {
        "source_type": "provided_public_content",
        "label": "manual-linkedin-post",
        "provided_text": "We're hiring a TypeScript Developer. Email jobs@example.com",
        "source_url": "https://www.linkedin.com/feed/update/example"
      }
    ],
    "candidate_limit": 50
  }'
```

Expected response:

- HTTP `202`
- `status` is `pending`
- counts are zero
- `provider_status` is `not_started`
- response includes the run `id`
- response includes `collection_inputs` so the persisted source material is visible for inspection

### 2. Observe worker processing

Poll the run until it reaches a terminal status:

```bash
curl http://localhost:8000/job-search-runs/<run_id>
```

Expected terminal result for the supplied-content example:

- `status` is `completed`
- `provider_status` is `collected`
- `inspected_count` is at least `1`
- `accepted_count` is at least `1`
- `rejected_count` and `duplicate_count` reconcile with candidate outcomes
- `completed_at` is set
- `collection_inputs` still contains the supplied source used by the worker

If the content is missing contact or keywords, expect `completed_no_results` with rejected candidates
instead of fabricated opportunities.

### 3. Inspect candidates

```bash
curl http://localhost:8000/job-search-runs/<run_id>/candidates
```

Expected candidate fields:

- `run_id`
- `outcome`
- `collection_source_type`
- `provider_status`
- `source_query`
- `source_url` when available
- `source_evidence`
- `matched_keywords`
- `contact_channel_type` and `contact_channel_value` when accepted
- `dedupe_key`
- `rejection_reason` when rejected or failed

Every inspected candidate must have exactly one outcome.

### 4. Inspect run-scoped accepted opportunities

```bash
curl http://localhost:8000/job-search-runs/<run_id>/opportunities
```

Expected accepted opportunity fields:

- `opportunity_type` is `job`
- `source_name` is `LinkedIn`
- `source_query`
- `source_evidence`
- `job_detail.contact_channel_type`
- `job_detail.contact_channel_value`
- `job_detail.matched_keywords`
- `job_detail.collection_source_type`
- `job_detail.job_stage`

Accepted opportunities must have either public email or explicit LinkedIn contact invitation with
poster profile URL. A loose profile URL without wording such as DM, direct message, inbox, message me,
reach out, send CV/resume via LinkedIn, me chame, envie mensagem, or equivalent phrases must remain
rejected.

### 5. Inspect global job opportunities

```bash
curl "http://localhost:8000/opportunities?opportunity_type=job"
```

Expected result:

- the accepted opportunity from the run appears in the global `job` list
- no `freelance` opportunities are mixed into the response when filtered to `job`

### 6. Validate automatic LinkedIn public search path

This path may produce blocked, inaccessible, empty, or no-result outcomes depending on local LinkedIn
access:

```bash
curl -X POST http://localhost:8000/job-search-runs \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["reactjs", "typescript"],
    "hiring_intent_terms": ["hiring", "contratando", "contratamos"],
    "collection_source_types": ["automatic_publication_search"],
    "candidate_limit": 50
  }'
```

Expected result:

- run is processed by the worker
- source queries include combinations such as `hiring reactjs` and `contratando typescript`
- accepted opportunities are created only when contact and evidence rules pass
- blocked, inaccessible, empty, or failed provider states are visible and create zero fabricated opportunities

### 7. Validate duplicate behavior

Run the supplied-content example twice with the same company/title/contact/keywords.

Expected result:

- first run may create an accepted opportunity
- second run records the repeated candidate as `duplicate`
- no duplicate accepted opportunity is created

### 8. Validate stale running recovery

Create or simulate a run left in `running`, then start the worker.

Expected result:

- the stale run becomes `failed`
- `provider_status` is `failed`
- `provider_error_code` is `stale_running`
- no automatic retry is attempted
- no new opportunity is fabricated during recovery

## Automated Test Expectations

- Worker unit tests cover pending-run selection, stale running recovery, provider input assembly, broad English/Portuguese contact-invitation detection, and final status selection.
- Worker integration tests cover API-created pending runs processed through the worker against a database session.
- API integration tests cover candidate visibility, run-scoped opportunity visibility, and global `opportunity_type=job` visibility.
- Contract tests cover run lifecycle fields, candidate provider fields, stale failure fields, and accepted opportunity fields.
- Provider failure tests cover blocked, inaccessible, empty, malformed, and failed sources without accepted opportunities.
- Deduplication tests cover repeated supplied content and repeated automatic query candidates.

## Latest Local Validation

- `cd apps/api && python -m pytest`: 28 passed.
- `cd apps/worker && python -m pytest`: 23 passed.
- `docker compose config`: not executed successfully in this environment because the Docker CLI is not
  installed or not on `PATH` (`docker: command not found`). Re-run this command, then the full
  `docker compose up -d` validation, from a machine with Docker Desktop available.

## Troubleshooting

- If `docker compose up` starts slowly on first run, the API and worker containers are installing their
  Python package dependencies before executing the app commands.
- If a run stays `pending`, verify the worker is running and connected to the same database as the API.
- If a run becomes `failed` with `stale_running`, it was left running before worker startup and was intentionally not retried automatically.
- If no candidates appear, inspect worker logs, `provider_status`, and `provider_error_message`.
- If candidates are rejected, inspect `rejection_reason` for missing contact, weak match, missing evidence, blocked source, inaccessible source, empty source, or parse failure.
- If LinkedIn blocks public search, validate end-to-end persistence with `provided_public_content` or `provided_url`.
- If duplicate opportunities appear, verify dedupe uses company, title/headline, sorted matched keywords, and preferred contact channel value.
