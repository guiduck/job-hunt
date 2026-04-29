# Implementation Plan: LinkedIn Job Bot Foundation

**Branch**: `002-linkedin-job-bot` | **Date**: 2026-04-28 | **Spec**: `specs/002-linkedin-job-bot/spec.md`
**Input**: Feature specification from `specs/002-linkedin-job-bot/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 1. Fundacao operacional, advancing into the prioritized `job` lane  
**Action Plan Step**: 1. Fundacao local, 2. Modelo central de oportunidades, and 3. Bot 1 de busca de empregos  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/002-linkedin-job-bot/spec.md`, planning local PostgreSQL foundation plus the first backend-triggered automated LinkedIn job-search skeleton with structured accepted opportunities.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Build the next backend/worker increment for the `Full-time` job lane: reuse the local PostgreSQL
foundation, expose backend operations to start and inspect LinkedIn job-search runs, execute the
long-running search in the worker boundary, and persist only accepted `job` opportunities that have
public email or contact channels. Each run is capped at 50 inspected candidates and accepted records
must preserve company, title/headline, full job description when available, contact channel, source,
query, matched keywords, evidence, job stage, and deduplication identity.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, Uvicorn, pytest; worker code remains Python in `apps/worker` with HTTP/API-triggered job orchestration boundary  
**Storage**: PostgreSQL via local Docker Compose, extending the existing opportunity schema with job search run and job detail fields  
**Testing**: pytest with API, service, worker, and database integration tests; contract tests from OpenAPI where practical  
**Target Platform**: Local development on Windows using bash-compatible commands and Docker Desktop  
**Project Type**: Backend API plus worker boundary; no frontend in this feature  
**Performance Goals**: Local API operations for starting/status/result reads respond in under 1 second for development data; each job-search run inspects at most 50 candidates and records cap status; accepted opportunities expose structured review fields immediately after run completion  
**Constraints**: Long-running LinkedIn search must not execute inside request handlers; only public or user-provided data is in scope; accepted opportunities require a public email/contact channel; no email sending, resume parsing, AI ranking, full UI, or freelance prospecting in this feature  
**Scale/Scope**: Local validation skeleton for tens of runs and up to 50 inspected candidates per run; not a production-scale scraper

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. Records remain explicitly typed as `job`, and the model preserves compatibility with future `freelance` records.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Search is keyword-driven for LinkedIn job posts/listings and requires source query, source URL/name, matched keywords, and evidence for accepted opportunities.
- **III. Structured Opportunity Records**: PASS. The plan extends structured job opportunity records, search runs, candidate outcomes, keyword matches, and operator notes rather than storing raw scrape blobs only.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Outreach sending, resume attachments, and automatic application actions are explicitly out of scope; captured emails/contact channels are for review.
- **V. Compatible Architecture and Operator Workflow**: PASS. API starts and inspects runs; worker performs long-running search and normalization outside request handlers.
- **Additional Constraints**: PASS. PostgreSQL and Docker Compose remain the local foundation; public/user-provided data and platform-boundary assumptions are preserved.
- **Development Workflow**: PASS. This plan updates `docs/handoff.md` and the Cursor Spec Kit rule context.

## Project Structure

### Documentation (this feature)

```text
specs/002-linkedin-job-bot/
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
      api/
        routes/
          job_search_runs.py
          opportunities.py
      models/
        opportunity.py
        job_search_run.py
      schemas/
        job_search_run.py
        opportunity.py
      services/
        job_search_run_service.py
        opportunity_service.py
      db/
        migrations/
    tests/
      integration/
      unit/
  worker/
    app/
      jobs/
        linkedin_job_search.py
      services/
        linkedin_candidate_parser.py
        job_candidate_normalizer.py
      tests/
        integration/
        unit/
docs/
docker-compose.yml
.env.example
```

**Structure Decision**: Use the existing `apps/api` and `apps/worker` split from
`docs/architecture.md` and `specs/001-local-opportunity-foundation/plan.md`. The API owns start,
status, and result inspection operations. The worker owns automated LinkedIn search, candidate
parsing, normalization, deduplication checks, and accepted opportunity persistence through shared
service/database boundaries.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

See `specs/002-linkedin-job-bot/research.md`.

Key decisions:

- Use backend-triggered, worker-executed job search runs so request handlers do not perform long-running LinkedIn discovery.
- Represent each run with explicit lifecycle status, metrics, cap state, and error fields.
- Persist accepted LinkedIn candidates as `job` opportunities only when they include a public email/contact channel.
- Use a small validation cap of 50 inspected candidates per run.
- Deduplicate by company, job title/headline, matched keyword set, and contact channel, while still storing source URL and evidence for traceability.
- Store structured job description/contact/company fields on accepted opportunities and candidate outcome metadata on runs.

## Phase 1 Design

See:

- `specs/002-linkedin-job-bot/data-model.md`
- `specs/002-linkedin-job-bot/contracts/openapi.yaml`
- `specs/002-linkedin-job-bot/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Contracts and data model keep `opportunity_type=job` explicit and do not introduce freelance behavior into this feature.
- **Evidence-Backed Discovery**: PASS. `job_search_candidates`, accepted opportunities, and keyword matches retain query, source, matched terms, evidence, and candidate outcome.
- **Structured Records**: PASS. Search runs, candidates, job details, keyword matches, and opportunities are modeled as structured entities.
- **Human-Reviewed Outreach**: PASS. The contract exposes captured contact data and reviewable opportunities only; no send/apply operation is introduced.
- **Compatible Architecture**: PASS. API endpoints start/read runs, while worker execution remains outside the HTTP request lifecycle.
