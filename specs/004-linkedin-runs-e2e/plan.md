# Implementation Plan: LinkedIn Runs End-to-End Execution

**Branch**: `004-linkedin-runs-e2e` | **Date**: 2026-04-30 | **Spec**: `specs/004-linkedin-runs-e2e/spec.md`  
**Input**: Feature specification from `specs/004-linkedin-runs-e2e/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 2. Busca de empregos  
**Action Plan Step**: 3. Bot 1 de busca de empregos  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/004-linkedin-runs-e2e/spec.md`, after parser feedback that LinkedIn contact acceptance must detect broad English/Portuguese contact-invitation wording rather than a single DM string.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Close the operational local LinkedIn Job Search flow by replacing the worker placeholder with a real
database-backed run processor. The API continues to create and expose runs, candidates, and accepted
job opportunities, while the separate worker discovers pending runs in the shared database, marks
stale running runs failed/stale, executes the existing LinkedIn provider/parser/normalizer pipeline,
persists each inspected candidate through the existing run service, creates only contactable `job`
opportunities using public email or explicit LinkedIn contact invitation evidence, finalizes
lifecycle metrics, and documents a Docker Compose validation path for API, worker, and PostgreSQL
together.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, Uvicorn, pytest, httpx  
**Storage**: PostgreSQL via local Docker Compose; existing `job_search_runs`, `job_search_candidates`, `opportunities`, `job_opportunity_details`, keyword, and keyword match tables are extended only if implementation/schema review finds a missing field  
**Testing**: pytest with API contract/integration/unit tests and worker unit/integration tests; Docker quickstart validation remains a manual end-to-end gate  
**Target Platform**: Local development on Windows with bash-compatible commands and Docker Desktop; API/worker split remains compatible with later Render deployment  
**Project Type**: Backend API plus separate worker; no frontend in this feature  
**Performance Goals**: API run creation/status/list operations remain under 1 second for local data; worker picks up pending runs within the configured local polling interval; each run inspects at most 50 candidates; quickstart validation completes in under 15 minutes once dependencies are available  
**Constraints**: Long-running LinkedIn collection must not run inside HTTP request handlers; only public or user-provided data is allowed; no login-wall bypass, rate-limit bypass, access-control bypass, automated email, job application automation, resume parsing, AI scoring, UI, or freelance prospecting; stale running runs are marked failed/stale and not automatically retried in v1; LinkedIn contact acceptance requires broad explicit contact-invitation wording plus poster profile URL, not just a raw profile link  
**Scale/Scope**: Local validation for tens of runs, one worker process, sequential or locked pending-run processing, hiring-intent terms `hiring`, `contratando`, `contratamos`, fallback job keywords `reactjs`, `typescript`, `nextjs`, `nodejs`, and up to 50 inspected candidates per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature creates and lists only `opportunity_type=job` accepted opportunities and leaves the `freelance` lane untouched.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Runs preserve hiring-intent terms, keywords, source query, source type, provider status, evidence, and matched keywords.
- **III. Structured Opportunity Records**: PASS. Candidates, outcomes, run metrics, and accepted job opportunities remain structured records instead of raw scrape blobs.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. The feature captures email or explicit LinkedIn contact invitation for review only; it does not send messages or apply to jobs.
- **V. Compatible Architecture and Operator Workflow**: PASS. The API remains the command/inspection surface and the worker performs long-running collection out of process.
- **Additional Constraints**: PASS. PostgreSQL, Docker Compose, public/user-provided data, and platform-boundary limits are preserved.
- **Development Workflow**: PASS. This plan creates design artifacts, updates agent context, and updates `docs/handoff.md`.

## Project Structure

### Documentation (this feature)

```text
specs/004-linkedin-runs-e2e/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md             # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
apps/
  api/
    app/
      api/routes/job_search_runs.py
      api/routes/opportunities.py
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
      core/config.py
      db/session.py
      jobs/linkedin_job_search.py
      services/linkedin_search_provider.py
      services/linkedin_candidate_parser.py
      services/job_candidate_normalizer.py
      main.py
    tests/
      integration/
      unit/
docs/
docker-compose.yml
```

**Structure Decision**: Extend the existing `apps/api` and `apps/worker` boundary. The worker will
reuse API models/services where practical or share equivalent persistence helpers without adding a
third service. API route changes stay limited to contract/schema visibility and global job
opportunity filtering. Docker Compose may grow from PostgreSQL-only to a reproducible local stack for
database, API, and worker validation.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

See `specs/004-linkedin-runs-e2e/research.md`.

Key decisions:

- Implement the worker as a database-backed polling loop that claims pending runs, processes one run at a time, and sleeps according to worker configuration.
- Keep run claiming conservative for local v1: transition `pending` to `running` inside a short database transaction and avoid automatic reprocessing of stale `running` rows.
- Mark stale `running` runs found on worker startup as failed/stale with visible error metadata instead of retrying automatically.
- Persist inspected candidates through the existing run service semantics so counters, dedupe, candidate records, and accepted opportunities stay consistent with the API contract.
- Store collection inputs with the run or an additive run-input table if implementation review confirms they are not currently persisted.
- Treat hiring-intent search terms as configurable run/provider input and seed both English and Portuguese defaults rather than hardcoding one language.
- Detect LinkedIn contact invitation using a maintainable catalog of English and Portuguese phrases such as DM, direct message, inbox, message me, reach out, send CV/resume via LinkedIn, me chame, envie mensagem, and equivalent wording; still require poster profile URL for non-email acceptance.
- Use Docker Compose as the reproducibility contract for PostgreSQL, API, and worker, but keep automated pytest as the primary regression signal.

## Phase 1 Design

See:

- `specs/004-linkedin-runs-e2e/data-model.md`
- `specs/004-linkedin-runs-e2e/contracts/openapi.yaml`
- `specs/004-linkedin-runs-e2e/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. The data model and OpenAPI contract keep accepted records scoped to `job` and preserve global filtering by `opportunity_type=job`.
- **Evidence-Backed Discovery**: PASS. Candidate and opportunity contracts require source metadata, evidence, matched keywords, and provider status.
- **Structured Records**: PASS. The design adds explicit run input, stale-run, and metric semantics without raw-only persistence.
- **Human-Reviewed Outreach**: PASS. Contact channels are persisted for manual review only; no outreach events or sending flows are introduced.
- **Compatible Architecture**: PASS. The worker loop owns long-running processing; API endpoints remain create/list/detail views.
- **Additional Constraints**: PASS. Docker Compose/PostgreSQL local validation, public/user-provided data, and no-bypass rules remain explicit.
- **Development Workflow**: PASS. `docs/handoff.md` and `.cursor/rules/specify-rules.mdc` are updated for the new active plan.
