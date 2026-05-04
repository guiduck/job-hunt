# Implementation Plan: LinkedIn Search Provider

**Branch**: `003-linkedin-search-provider` | **Date**: 2026-04-30 | **Spec**: `specs/003-linkedin-search-provider/spec.md`
**Input**: Feature specification from `specs/003-linkedin-search-provider/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 2. Busca de empregos  
**Action Plan Step**: 3. Bot 1 de busca de empregos  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/003-linkedin-search-provider/spec.md`, after clarification that v1 searches LinkedIn publications using `hiring`, `contratando`, and `contratamos` plus user/fallback keywords, accepts public email first, and may accept explicit LinkedIn DM with poster profile link.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add the first real LinkedIn collection provider to the existing `Full-time Job` worker flow. The API
continues to create and expose job-search runs, while the worker resolves hiring-intent queries,
collects public LinkedIn publication candidates or user-provided LinkedIn content, parses and
normalizes candidates through the existing pipeline, and persists only contactable `job`
opportunities. The implementation remains capped at 50 inspected candidates per run, prefers public
email over LinkedIn DM profile contact, records rejected/duplicate/failed candidates, and keeps
blocked or empty LinkedIn collection visible without fabricating opportunities.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, Uvicorn, pytest; worker-side HTTP/HTML retrieval and parsing should use small Python dependencies selected during implementation and isolated behind provider interfaces  
**Storage**: PostgreSQL via local Docker Compose, extending existing job-search run/candidate and job opportunity tables additively  
**Testing**: pytest with API contract tests, worker unit tests for provider/parser/normalizer, and integration tests for persistence, deduplication, caps, and failure states  
**Target Platform**: Local development on Windows using bash-compatible commands and Docker Desktop; later API/worker deployment remains compatible with Render  
**Project Type**: Backend API plus worker boundary; no frontend in this feature  
**Performance Goals**: Start/status/list API operations respond in under 1 second for local development data; each run inspects at most 50 candidates; worker records candidate outcomes incrementally enough for visible status during local validation  
**Constraints**: Long-running collection must not run in request handlers; only public or user-provided data is allowed; no login-wall bypass, automated email, job applications, resume parsing, AI scoring, full UI, or freelance prospecting; public email is preferred over LinkedIn DM profile contact  
**Scale/Scope**: Local validation for tens of runs, hiring-intent terms `hiring`, `contratando`, and `contratamos`, fallback job keywords `reactjs`, `typescript`, `nextjs`, `nodejs`, and up to 50 inspected candidates per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature only accepts `opportunity_type=job` records and leaves the `freelance` lane untouched.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Collection is specialized to LinkedIn job publications with hiring-intent terms, configured/fallback keywords, source query, matched keywords, and source evidence.
- **III. Structured Opportunity Records**: PASS. Provider results become structured candidates, candidate outcomes, job details, keyword matches, and accepted opportunities rather than opaque scrape blobs.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. The feature captures email or explicit LinkedIn DM profile contact for review only; it does not send messages or apply to jobs.
- **V. Compatible Architecture and Operator Workflow**: PASS. The API starts and inspects runs; worker-side provider/fetcher performs long-running collection outside request handlers.
- **Additional Constraints**: PASS. PostgreSQL, Docker Compose, public/user-provided data, and platform-boundary limits are preserved.
- **Development Workflow**: PASS. This plan updates `docs/handoff.md` and the Cursor Spec Kit context.

## Project Structure

### Documentation (this feature)

```text
specs/003-linkedin-search-provider/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md             # Created later by /speckit.tasks
```

### Source Code (repository root)
```text
apps/
  api/
    app/
      api/routes/job_search_runs.py
      models/job_search_run.py
      models/opportunity.py
      schemas/job_search_run.py
      schemas/opportunity.py
      services/job_search_run_service.py
      services/opportunity_service.py
    alembic/versions/
    tests/
      contract/
      integration/
      unit/
  worker/
    app/
      jobs/linkedin_job_search.py
      services/linkedin_search_provider.py
      services/linkedin_candidate_parser.py
      services/job_candidate_normalizer.py
    tests/
      integration/
      unit/
docs/
docker-compose.yml
```

**Structure Decision**: Extend the existing `apps/api` and `apps/worker` split from
`specs/002-linkedin-job-bot`. API changes remain focused on run request/response shape and candidate
visibility. Worker changes introduce `linkedin_search_provider.py` as the collection boundary and
reuse the existing parser, normalizer, and run orchestration path.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

See `specs/003-linkedin-search-provider/research.md`.

Key decisions:

- Add a worker-side provider interface that returns raw LinkedIn candidate dictionaries and hides the concrete collection method from parser/normalizer code.
- Build automatic publication queries from hiring-intent terms (`hiring`, `contratando`, `contratamos`) combined with configured or fallback keywords.
- Support user-provided LinkedIn URLs and pasted public content as first-class validation/fallback sources for local testing.
- Prefer public email contact; accept explicit LinkedIn DM contact only when the publication text asks for DM and a poster profile link is available.
- Add explicit outcomes for blocked, inaccessible, empty, and provider-failed candidates/runs without creating accepted opportunities.
- Keep database changes additive to the existing `job_search_runs`, `job_search_candidates`, and job opportunity detail model.

## Phase 1 Design

See:

- `specs/003-linkedin-search-provider/data-model.md`
- `specs/003-linkedin-search-provider/contracts/openapi.yaml`
- `specs/003-linkedin-search-provider/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Data model and contract continue to scope accepted records to `job`.
- **Evidence-Backed Discovery**: PASS. Provider query terms, source query, source type, source URL, matched keywords, and evidence are preserved.
- **Structured Records**: PASS. Candidate source metadata, contact priority, provider outcomes, and opportunity details are structured fields.
- **Human-Reviewed Outreach**: PASS. Contact channels are captured only for manual review; no send/apply workflow is added.
- **Compatible Architecture**: PASS. API remains a control/inspection surface; worker provider performs external collection.
- **Additional Constraints**: PASS. Public/user-provided data and local Docker/PostgreSQL validation remain the operating model.
