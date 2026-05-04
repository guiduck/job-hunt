# Quickstart: LinkedIn Search Provider

## Goal

Validate locally that a Full-time Job run can attempt automatic LinkedIn publication search with
hiring-intent terms, inspect up to 50 candidates, accept only contactable opportunities, and record
blocked, empty, duplicate, or rejected candidates visibly.

## Prerequisites

- Docker Desktop is running.
- The local PostgreSQL environment from `002-linkedin-job-bot` is available.
- API and worker dependencies are installed.
- The active branch is `003-linkedin-search-provider`.
- The existing API/worker foundation tests from `002-linkedin-job-bot` pass.

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

## Validation Flow

### 1. Start an automatic publication search run

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

- HTTP `202`
- response includes `requested_keywords`, `hiring_intent_terms`, `collection_source_types`,
  `provider_status`, and zeroed counts
- worker later resolves queries like `hiring reactjs`, `contratando typescript`, and
  `contratamos typescript`

### 2. Start a local validation run with supplied public content

Use this when LinkedIn blocks public search or when a deterministic test is needed:

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
        "provided_text": "Estamos contratando TypeScript Developer. Me chame no DM.",
        "source_url": "https://www.linkedin.com/feed/update/example"
      }
    ],
    "candidate_limit": 50
  }'
```

Expected result:

- run is accepted without live LinkedIn dependency
- candidate is inspected through the same parser/normalizer path
- candidate is accepted only if contact evidence and poster profile link are available, or rejected
  with a clear reason if not

### 3. Inspect run status

```bash
curl http://localhost:8000/job-search-runs/<run_id>
```

Expected fields:

- `status`
- `provider_status`
- `provider_error_code`
- `provider_error_message`
- `inspected_count`
- `accepted_count`
- `rejected_count`
- `duplicate_count`
- `cap_reached`

If LinkedIn is blocked, inaccessible, or empty, the run should expose `provider_status=blocked`,
`provider_status=inaccessible`, `provider_status=empty`, or an equivalent visible failure outcome
without accepted opportunities.

### 4. Inspect candidate outcomes

```bash
curl http://localhost:8000/job-search-runs/<run_id>/candidates
```

Expected result:

- no more than 50 inspected candidates
- each candidate has exactly one outcome
- automatic candidates include `hiring_intent_term` and `source_query`
- user-provided candidates include `collection_source_type`
- rejected or failed candidates include `rejection_reason`, `provider_status`, or provider error
- duplicates do not create extra accepted opportunities

### 5. Inspect accepted opportunities

```bash
curl http://localhost:8000/job-search-runs/<run_id>/opportunities
```

Each accepted opportunity must include:

- `opportunity_type=job`
- company name when available
- title or post headline
- job description when available
- `contact_channel_type`
- `contact_channel_value`
- `source_query`
- `source_evidence`
- `matched_keywords`
- `hiring_intent_term` when collected automatically
- `collection_source_type`
- `job_stage`
- `dedupe_key`

Public email is preferred when both public email and LinkedIn DM contact are found.

### 6. Validate LinkedIn DM acceptance

A candidate without email may still be accepted when:

- text explicitly says the poster can be contacted through LinkedIn DM
- `poster_profile_url` is available
- at least one requested keyword matched
- source evidence is present

If the post only has a profile link but does not invite DM contact, it should be rejected as missing
contact.

## Test Expectations

- Provider unit tests cover automatic query generation from hiring-intent terms plus keywords.
- Provider tests cover public search success, blocked source, inaccessible source, empty source, and supplied content.
- Parser tests cover public email extraction and LinkedIn DM invitation with poster profile link.
- Normalizer tests cover email priority over LinkedIn DM when both are present.
- Integration tests cover run metrics, 50-candidate cap, persistence, deduplication, and provider failures.
- API contract tests cover new request and response fields.
- Outreach sending, resume parsing, UI, AI scoring, and freelance prospecting are not exercised.

## Troubleshooting

- If no candidates are collected, inspect `provider_status` and `provider_error_message`.
- If candidates are rejected, inspect `rejection_reason` for missing contact, weak match, missing evidence, blocked source, inaccessible source, empty source, or parse failure.
- If LinkedIn blocks public search, validate the pipeline with `provided_url` or `provided_public_content` inputs and keep the blocked status visible.
- If duplicate opportunities appear, verify dedupe uses company, title/headline, sorted matched keywords, and preferred contact channel value.
