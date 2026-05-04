# Implementation Plan: Job Review Intelligence

**Branch**: `005-job-review-intelligence` | **Date**: 2026-05-01 | **Spec**: `specs/005-job-review-intelligence/spec.md`  
**Input**: Feature specification from `specs/005-job-review-intelligence/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 2. Busca de empregos  
**Action Plan Step**: 3. Bot 1 de busca de empregos, moving into 4. Revisao operacional  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/005-job-review-intelligence/spec.md` after clarification that score is a 0-100 integer, current match is primary, historical outcomes adjust comparable scores, and review status is separate from `job_stage`.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add a review intelligence layer to accepted `job` opportunities without changing deterministic LinkedIn collection. The worker keeps collecting and normalizing candidates outside the API request path, then enriches inspected candidates with deterministic review analysis and optional AI-assisted analysis over already-collected public or user-provided text. Accepted opportunities receive additive review-ready fields: 0-100 match score, explanation, normalized role/company, seniority/modality/location when detectable, missing keywords, review status, analysis status, error/fallback visibility, and score factors. The API extends existing opportunity and run/candidate contracts with filters and update surfaces needed by the future `Full-time` review UI while leaving `Freelance` records untouched.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, Uvicorn, pytest, httpx; optional worker-side AI analyzer behind configuration and schema validation  
**Storage**: PostgreSQL via existing local Docker Compose; additive migration over `job_search_runs`, `job_search_candidates`, and `job_opportunity_details`  
**Testing**: pytest across API contract/integration/unit tests and worker unit/integration tests; Docker Compose quickstart remains manual when Docker CLI is available  
**Target Platform**: Local Windows development with bash-compatible commands and Docker Desktop when available; later Render API/worker/Postgres deployment remains compatible  
**Project Type**: Backend API plus separate worker; no production web UI in this feature  
**Performance Goals**: API list/detail/filter operations stay under 1 second for local datasets; worker still inspects at most 50 candidates per run; deterministic analysis adds negligible per-candidate overhead; optional AI analysis must not block HTTP requests  
**Constraints**: Long-running collection and AI analysis stay in the worker; only public or user-provided collected text and source metadata may be analyzed; deterministic parser/normalizer fallback is mandatory; AI output must be structured and validated before persistence; scoring is advisory and must not auto-send, auto-apply, or auto-reject; schema and contracts evolve additively  
**Scale/Scope**: Tens of local runs, one worker process, up to 50 candidates per run, accepted `opportunity_type=job` records, historical score adjustment from review/application outcomes when comparable history exists; `Freelance` remains untouched

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature targets `opportunity_type=job` and explicitly excludes `Freelance` behavior except shared filtering compatibility.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Provider collection, `source_query`, `source_url`, `source_evidence`, provider status, and matched keywords remain preserved. Score explanations must point back to captured evidence.
- **III. Structured Opportunity Records**: PASS. The plan adds structured review profile, analysis status, score factors, missing keywords, and operator review fields instead of raw-only AI output.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Scores and review status support human prioritization only; the feature does not send emails, submit applications, or automate LinkedIn actions.
- **V. Compatible Architecture and Operator Workflow**: PASS. Analysis runs inside the worker after collection; the API exposes review and filter surfaces only.
- **Additional Constraints**: PASS. PostgreSQL, Docker Compose compatibility, public/user-provided data limits, no bypass behavior, and additive schema evolution are preserved.
- **Development Workflow**: PASS. This plan creates research, data model, OpenAPI contract, quickstart, and updates `docs/handoff.md` plus the active Spec Kit rule context.

## Project Structure

### Documentation (this feature)

```text
specs/005-job-review-intelligence/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
  api/
    alembic/versions/
    app/
      api/routes/opportunities.py
      api/routes/job_search_runs.py
      models/opportunity.py
      models/job_search_run.py
      schemas/opportunity.py
      schemas/job_search_run.py
      services/opportunity_service.py
      services/job_search_run_service.py
      services/job_review_scoring.py
    tests/
      contract/
      integration/
      unit/
  worker/
    app/
      core/config.py
      jobs/linkedin_job_search.py
      services/job_candidate_normalizer.py
      services/job_review_analyzer.py
      services/job_review_scoring.py
    tests/
      integration/
      unit/
docs/
docker-compose.yml
```

**Structure Decision**: Extend the existing `apps/api` and `apps/worker` split. API code owns persistence models, route contracts, query filters, and operator updates. Worker code owns post-collection candidate analysis and writes review fields before final run completion. Shared scoring rules can be duplicated narrowly or factored into matching small service modules in both apps; no new package, queue, web app, or external service boundary is introduced in this feature.

## Complexity Tracking

No constitution violations.

## Change Impact Review

**Change Type**: Additive schema and contract extension  
**Primary Surface**: Opportunity list/detail/update contract, job-search run/candidate contract, worker candidate processing, database migrations  
**Compatibility Risk**: Medium. Existing records and tests must continue to work while new fields default safely for prior accepted opportunities.

**Potentially Affected Areas**:

- API models, schemas, route filters, opportunity update service, OpenAPI contract tests
- Worker run loop, candidate parser/normalizer handoff, optional AI analyzer config, persistence SQL
- Alembic migration defaults, indexes for score/status filters, seed/fixture data, docs and quickstart

**Failure Modes**:

- Existing accepted opportunities without review fields could fail serialization or filtering if defaults are not nullable/backfilled.
- AI output could be persisted as trusted data without schema validation or evidence linkage.
- Historical outcome scoring could overfit sparse early feedback if it replaces current match evidence.
- `Freelance` records could leak into `Full-time` filters if `opportunity_type=job` is not enforced.

**Recommended Safeguards**:

- Add nullable/defaulted columns with safe backfill values (`review_status=unreviewed`, deterministic/fallback status for old records).
- Keep deterministic scoring and analyzer fallback as the canonical minimum path.
- Store score factors and historical adjustment separately enough to explain why a score changed.
- Add contract and integration tests for old records, `Freelance` exclusion, AI invalid JSON fallback, and historical adjustment behavior.

## Phase 0 Research

See `specs/005-job-review-intelligence/research.md`.

Key decisions:

- Store review profile fields additively on job candidates and accepted job details so both run/candidate visibility and opportunity review surfaces are fast and explicit.
- Use `review_status` separately from `job_stage`: review status is `unreviewed`, `reviewing`, `saved`, or `ignored`; `job_stage` remains application lifecycle.
- Use deterministic 0-100 scoring as the baseline, with optional AI analysis allowed only to provide validated structured extraction/score factors.
- Treat historical outcomes as score adjustment signals only when comparable review/application history exists.
- Represent analysis state with explicit statuses so operators can distinguish deterministic-only, AI-assisted, fallback, failed, and skipped analysis.

## Phase 1 Design

See:

- `specs/005-job-review-intelligence/data-model.md`
- `specs/005-job-review-intelligence/contracts/openapi.yaml`
- `specs/005-job-review-intelligence/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Data model and contracts scope review filters to `opportunity_type=job`; `Freelance` records remain unaffected.
- **Evidence-Backed Discovery**: PASS. Score explanations, score factors, and analysis output preserve links to source evidence, matched/missing keywords, provider status, and source/run context.
- **Structured Records**: PASS. Review, analysis, historical signals, and operator state are structured fields and validated payloads.
- **Human-Reviewed Outreach**: PASS. `review_status` and `job_stage` support manual workflow only; no sending or applying contract is introduced.
- **Compatible Architecture**: PASS. Worker owns post-collection analysis; API owns review/update/filter surfaces.
- **Additional Constraints**: PASS. PostgreSQL/Alembic, Docker Compose, public/user-provided text, and no-bypass rules remain explicit.
- **Development Workflow**: PASS. Plan artifacts and handoff/rule context are updated for the active feature.
