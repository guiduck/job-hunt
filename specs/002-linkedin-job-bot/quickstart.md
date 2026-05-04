# Quickstart: LinkedIn Job Bot Foundation

## Goal

Validate that a local operator can start a backend-triggered LinkedIn job-search run, inspect its
status, and review accepted `job` opportunities with structured company, description, contact, and
evidence fields.

## Prerequisites

- Docker Desktop is running.
- The local PostgreSQL environment from the foundation feature is available.
- API and worker dependencies are installed.
- The active branch is `002-linkedin-job-bot`.

## Local Setup

1. Start local infrastructure:

   ```bash
   docker compose up -d
   ```

2. Apply database migrations:

   ```bash
   cd apps/api
   alembic upgrade head
   ```

3. Start the API:

   ```bash
   cd apps/api
   uvicorn app.main:app --reload
   ```

4. Start the worker in a separate terminal:

   ```bash
   cd apps/worker
   python -m app.main
   ```

## Reset Local Storage

Use this only when you want a clean local database:

```bash
docker compose down -v
docker compose up -d
cd apps/api
alembic upgrade head
```

## Validation Flow

### 1. Confirm fallback keywords

When no manual keyword set exists, the run should use:

- `reactjs`
- `typescript`
- `nextjs`
- `nodejs`

### 2. Start a job-search run

```bash
curl -X POST http://localhost:8000/job-search-runs \
  -H "Content-Type: application/json" \
  -d '{"candidate_limit": 50}'
```

Expected result:

- HTTP `202`
- response includes `id`, `status`, `requested_keywords`, `candidate_limit=50`, and zeroed counts

Example response:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "status": "pending",
  "requested_keywords": ["reactjs", "typescript", "nextjs", "nodejs"],
  "source_name": "LinkedIn",
  "candidate_limit": 50,
  "inspected_count": 0,
  "accepted_count": 0,
  "rejected_count": 0,
  "duplicate_count": 0,
  "cap_reached": false
}
```

### 3. Inspect run status

```bash
curl http://localhost:8000/job-search-runs/<run_id>
```

Expected statuses:

- `pending`
- `running`
- `completed`
- `completed_no_results`
- `failed`

If LinkedIn content is inaccessible, blocked, or rate-limited, the run should reach `failed` or a
visible no-results/partial outcome without fabricating opportunities.

### 4. Inspect candidate outcomes

```bash
curl http://localhost:8000/job-search-runs/<run_id>/candidates
```

Expected result:

- no more than 50 inspected candidates
- every candidate has one outcome
- rejected candidates include a reason
- duplicates do not create extra review opportunities

### 5. Inspect accepted opportunities

```bash
curl http://localhost:8000/job-search-runs/<run_id>/opportunities
```

Each accepted opportunity must include:

- `opportunity_type=job`
- company name when available
- title or post headline
- job description when available
- public email or public contact channel
- source name or source URL
- source query
- source evidence
- matched keywords
- job stage
- dedupe key

Example accepted opportunity:

```json
{
  "opportunity_type": "job",
  "company_name": "Example Co",
  "title": "Frontend Engineer",
  "job_description": "We use React, TypeScript, and Next.js.",
  "contact_channel_value": "jobs@example.com",
  "source_query": "reactjs typescript email",
  "source_evidence": "Email jobs@example.com with your resume.",
  "matched_keywords": ["reactjs", "typescript"],
  "job_stage": "new"
}
```

### 6. Review all job opportunities

```bash
curl "http://localhost:8000/opportunities?opportunity_type=job"
```

Expected result:

- only job opportunities are returned
- freelance prospects are not mixed into the job lane
- each accepted opportunity exposes enough structured data to identify company + email/contact

## Test Expectations

- API start/status/result reads return local development data in under 1 second.
- A run that encounters more than 50 candidates reports `cap_reached=true`.
- Accepted opportunities without public contact channel are not created.
- Accepted opportunities without source evidence are not created.
- Deduplication uses company, title/headline, matched keywords, and contact channel.
- Outreach sending, resume parsing, UI, AI scoring, and freelance prospecting are not exercised.

## Troubleshooting

- If no opportunities are accepted, inspect candidate outcomes for `rejected_no_contact`, `rejected_weak_match`, `rejected_missing_evidence`, or `failed_parse`.
- If local storage is unavailable, the run should fail visibly and avoid creating partial accepted opportunities.
- If LinkedIn blocks or rate-limits the search, keep the failure recorded and reduce scope before attempting another run.
