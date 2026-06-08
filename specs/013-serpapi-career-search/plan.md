# Implementation Plan: Curated Career Page Search

**Branch**: `codex-013-serpapi-career-search` | **Date**: 2026-06-02 | **Spec**: `specs/013-serpapi-career-search/spec.md`
**Input**: Feature specification from `/specs/013-serpapi-career-search/spec.md`

**Note**: The official `.specify/scripts/bash/setup-plan.sh --json` could not run in this Windows environment because `bash` invokes WSL and no WSL distribution is installed. The plan setup was resolved manually from `.specify/feature.json`, matching prior local Spec Kit runs documented in `docs/handoff.md`.

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time review, sending, post-capture intelligence, and curated external job discovery  
**Action Plan Step**: Expand Full-time discovery beyond LinkedIn without returning to the discarded email-enrichment spike  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Plan implementation for `specs/013-serpapi-career-search/spec.md`: add a `/search` career-page button using curated sources through the existing search provider key, start a fresh provider search on every click, persist accepted jobs in PostgreSQL, classify any job with a usable email into `With email`, keep no-email jobs in `External applications`, preserve apply URLs, evaluate with existing AI matching, disable duplicate searches while running, expose latest search time, use existing `job_stage=applied`, and enforce a configurable cost-based inspected-candidate cap plus a 1-month opportunity lifecycle planning constraint.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add a curated career-page search lane to the existing Full-time Search tab. The extension starts an owner-scoped external search run from the same keyword input and max opportunity count used for LinkedIn, with all initial active sources checked by default. The API records the run and source selections, the worker uses the configured backend search provider key to query curated ATS/career sources, normalizes candidates, evaluates them with the existing matching layer, dedupes them, and persists accepted results as normal `job` opportunities.

Jobs with any usable captured email remain in the `With email` lane and are eligible for the existing Gmail/bulk email flow, while preserving an apply URL in details. Jobs without email but with a usable application URL go to `External applications`, where the operator can open one URL at a time, delete selected rows, or mark the job as `job_stage=applied` without creating Gmail send events.

## Technical Context

**Language/Version**: Python 3.11+ for FastAPI/worker; TypeScript/React for Plasmo extension  
**Primary Dependencies**: FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL, pytest; Plasmo, React, TypeScript; existing OpenAI-compatible AI matching provider; configured search provider key for SerpApi-style web search  
**Storage**: PostgreSQL via existing `opportunities`, `job_opportunity_details`, `job_search_runs`, `job_search_candidates`, and additive external-search metadata/migration  
**Testing**: `pytest` for API/worker unit, integration, and contract tests; `npm run typecheck`, extension unit tests, and `npm run build` for Plasmo  
**Target Platform**: Local Docker Compose; API and worker deployment target on Render; Chrome/Plasmo extension as local-first Full-time UI  
**Project Type**: Multi-service product: FastAPI backend, separate worker, browser extension frontend  
**Performance Goals**: External search button creates a run in under 30 seconds; long-running provider work happens outside HTTP request handling; Jobs list remains paginated/lightweight; a noisy source cannot run unbounded because accepted-opportunity max and inspected-candidate cap both apply  
**Constraints**: Search provider key and OpenAI key stay backend/worker-only; no company/board/tenant input required; every button click starts a fresh provider search; while a career-page run is active, the extension disables duplicate starts; all data is owner-scoped; changes remain additive and preserve LinkedIn/Gmail/field-assistant behavior  
**Scale/Scope**: Single-user/local-first MVP path with owner-scoped data ready for published API; initial active sources are InHire, Ashby, Lever, Greenhouse, SmartRecruiters, Trampos, and Catho; future Brazilian sources remain documented but inactive

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. This feature remains strictly in `opportunity_type=job` / Full-time and does not mix Freelance flows.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Search is limited to curated sources, records `source_query`, `source_name`, `source_url`, provider diagnostics, raw evidence, and candidate outcomes.
- **III. Structured Opportunity Records**: PASS. Accepted results become structured `opportunities` plus `job_opportunity_details`; candidates/runs remain queryable for diagnostics.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Jobs with email use existing reviewed Gmail flow; external applications remain manual via apply URL and `job_stage=applied`.
- **V. Compatible Architecture and Operator Workflow**: PASS. API creates commands and exposes data; worker performs provider search, normalization, dedupe, and AI evaluation; extension operates the local-first UI.

No constitution violations are introduced. The only cost/rate-limit risk is handled by a configurable inspected-candidate cap and diagnostics.

## Project Structure

### Documentation (this feature)

```text
specs/013-serpapi-career-search/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- openapi.yaml
|   `-- extension-search.md
`-- tasks.md                  # Generated later by /speckit-tasks
```

### Source Code (repository root)

```text
apps/
|-- api/
|   |-- app/api/router.py
|   |-- app/core/config.py
|   |-- app/models/job_search_run.py
|   |-- app/models/opportunity.py
|   |-- app/schemas/job_search_run.py
|   |-- app/schemas/opportunity.py
|   |-- app/services/job_search_run_service.py
|   |-- app/services/opportunity_service.py
|   |-- app/services/job_dedupe.py
|   |-- alembic/versions/
|   `-- tests/
|       |-- contract/
|       |-- integration/
|       `-- unit/
|-- worker/
|   |-- app/core/config.py
|   |-- app/jobs/linkedin_job_search.py
|   |-- app/jobs/
|   |-- app/services/job_ai_filter.py
|   |-- app/services/job_candidate_normalizer.py
|   |-- app/services/job_review_analyzer.py
|   |-- app/services/job_review_scoring.py
|   |-- app/services/
|   `-- tests/
|       |-- integration/
|       `-- unit/
`-- extension/
    |-- background.ts
    |-- src/api/client.ts
    |-- src/api/types.ts
    |-- src/components/popup/SearchView.tsx
    |-- src/components/popup/JobsView.tsx
    |-- src/components/popup/DashboardView.tsx
    |-- src/components/popup/OpportunityDetail.tsx
    |-- src/store/popupStore.ts
    `-- src/styles/popup.css
```

**Structure Decision**: Keep the existing three-part split. Add API schema/service/migration changes, add worker provider/job logic next to the LinkedIn job-search pipeline, and extend existing Plasmo popup views instead of adding a web app or a second backend.

## Phase 0: Research

See `research.md`.

Key decisions:

- Use a curated-query SerpApi-style provider adapter in the worker, with backend-only secrets.
- Reuse existing run/candidate/opportunity concepts with additive fields rather than creating a separate external-search subsystem.
- Treat email-bearing career-page jobs as `With email`; only no-email jobs become `External applications`.
- Use existing `job_stage=applied` for manual external application.
- Apply a configurable inspected-candidate cap in addition to the accepted-opportunity max.
- Track the 1-month job lifecycle as a planning constraint, with full archive/cleanup implementation deferred unless tasks choose to include a small first slice.

## Phase 1: Design & Contracts

See:

- `data-model.md`
- `contracts/openapi.yaml`
- `contracts/extension-search.md`
- `quickstart.md`

Design highlights:

- Add source kind/source selections to job search run creation or a dedicated external-search create endpoint.
- Persist selected curated sources and source diagnostics in JSON/additive fields or a small companion table.
- Extend candidates with external provider/source metadata, apply URL, captured email classification, inspected cap stop reason, and AI/fallback diagnostics.
- Extend job opportunity detail or schemas so list/detail can distinguish `application_kind` (`email` vs `external_application`) without breaking existing email flows.
- Dashboard metrics add email-job and external-unapplied counts while preserving existing metrics fields for compatibility.

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. UI, metrics, and actions remain Full-time only.
- **Evidence-Backed Discovery**: PASS. Contracts require source query, source URL, evidence, provider status, and candidate diagnostics.
- **Structured Records**: PASS. Data model keeps candidates and accepted opportunities reusable for review, outreach, AI, and future ATS resume generation.
- **Human-Reviewed Outreach**: PASS. Email send remains explicit/reviewed; external applications are manual.
- **Compatible Architecture**: PASS. Long-running provider/AI work stays in the worker; API only starts runs and returns state.

## Complexity Tracking

No constitution violations or unnecessary architectural complexity are planned.

