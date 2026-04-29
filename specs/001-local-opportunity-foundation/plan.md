# Implementation Plan: Local Opportunity Foundation

**Branch**: `001-local-opportunity-foundation` | **Date**: 2026-04-25 | **Spec**: `specs/001-local-opportunity-foundation/spec.md`
**Input**: Feature specification from `specs/001-local-opportunity-foundation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 1. Fundacao operacional  
**Action Plan Step**: 1. Fundacao local and 2. Modelo central de oportunidades  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for the active `001-local-opportunity-foundation` spec, planning Docker/PostgreSQL local setup, FastAPI API foundation, migrations, and shared opportunity persistence for `freelance` and `job` lanes.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Build the first backend/data foundation for the opportunity system: a local PostgreSQL workspace,
an initial FastAPI application structure, migrations, and a shared opportunity model that supports
both freelance client acquisition and full-time job search. The first increment prepares the data
surface for future scrapers, CRM review, campaigns, templates, prompt artifacts, and human-reviewed
outreach without implementing discovery automation or a full UI yet.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, Uvicorn  
**Storage**: PostgreSQL via local Docker Compose  
**Testing**: pytest with API and database integration tests  
**Target Platform**: Local development on Windows using bash-compatible commands and Docker Desktop  
**Project Type**: Backend API with future worker and optional web app  
**Performance Goals**: Local API endpoints for opportunity CRUD/filtering return development-sized result sets in under 1 second; local setup completes in under 10 minutes from documented steps  
**Constraints**: Long-running scraping/enrichment must not run inside request handlers; outreach sending remains out of scope; schema must support both `freelance` and `job` lanes from the first migration  
**Scale/Scope**: Development foundation for dozens to thousands of local opportunity records; no production scraper scale or UI implementation in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The model uses a shared `opportunities` base with explicit `opportunity_type` and lane-specific detail tables for `freelance` and `job`.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Discovery automation is deferred, but the schema persists `source_query`, `source_url`, `source_evidence`, and matched keywords from the start.
- **III. Structured Opportunity Records**: PASS. The plan creates normalized records for opportunities, campaigns, keyword sets, and interactions.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Outreach sending is out of scope; fields for future prompt/message/outreach context remain structured and reviewable.
- **V. Compatible Architecture and Operator Workflow**: PASS. FastAPI is kept separate from future worker jobs, and Docker Compose/PostgreSQL remain the local foundation.
- **Additional Constraints**: PASS. PostgreSQL and Docker Compose are used locally; public/user-provided data assumptions are preserved; Google Maps and future UI compatibility are not blocked.
- **Development Workflow**: PASS. `docs/handoff.md` will be updated by this plan, and no spec/doc conflict is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-local-opportunity-foundation/
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
      core/
      db/
      models/
      schemas/
      services/
      main.py
    alembic/
      versions/
    tests/
      integration/
      unit/
    pyproject.toml
  worker/
    README.md            # Placeholder boundary; no worker implementation in this feature
docs/
docker-compose.yml
.env.example
```

**Structure Decision**: Use the documented `apps/api` and `apps/worker` split from
`docs/architecture.md`. This feature implements only the API/data foundation and a worker boundary
placeholder so future scraping/enrichment jobs do not get mixed into the HTTP process.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

See `specs/001-local-opportunity-foundation/research.md`.

Key decisions:

- Use Docker Compose for PostgreSQL-only local infrastructure in this feature.
- Use FastAPI with SQLAlchemy 2.x and Alembic for the API foundation and migrations.
- Use a shared `opportunities` table with lane-specific detail tables rather than separate root tables for freelance and job.
- Persist `keyword_sets` now, including a mock fallback set, so job-search setup works before CV extraction exists.

## Phase 1 Design

See:

- `specs/001-local-opportunity-foundation/data-model.md`
- `specs/001-local-opportunity-foundation/contracts/openapi.yaml`
- `specs/001-local-opportunity-foundation/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Contracts and data model expose `opportunity_type` and lane filters.
- **Evidence-Backed Discovery**: PASS. Source evidence fields and keyword match data are required for stored opportunities.
- **Structured Records**: PASS. Entities are normalized with clear relationships and state transitions.
- **Human-Reviewed Outreach**: PASS. No sending endpoint is planned; interactions allow notes and review history only.
- **Compatible Architecture**: PASS. Worker remains separate and future-facing; API endpoints do not run discovery jobs.
