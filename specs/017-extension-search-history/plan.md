# Implementation Plan: Extension Search History

**Branch**: `017-extension-search-history` | **Date**: 2026-07-13 | **Spec**: `specs/017-extension-search-history/spec.md`
**Input**: Feature specification from `specs/017-extension-search-history/spec.md`

**Note**: `.specify/scripts/bash/setup-plan.sh --json` was attempted, but the script failed in this Windows workspace because CRLF line endings were interpreted by Bash as literal `\r` commands. This plan was generated manually from `.specify/feature.json`, the plan template, and the active spec.

## Continuity Context

**Roadmap Phase**: Phase 2 gate / Full-time fine tuning, focused on measuring real LinkedIn search quality before more scale.  
**Action Plan Step**: Step 6, tracking and feedback loop for employment search quality.  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Plan the Full-time extension Search History feature: persist and display LinkedIn Search run history plus query/keyword aggregates using raw LinkedIn result counts captured before dedupe, while keeping duplicate/rejected/accepted/AI counters separate.

## Summary

Add an extension-only History tab for the `Full-time` Plasmo popup. The implementation should extend the existing `job_search_runs` record and owner-scoped `/job-search-runs` API with a nullable raw LinkedIn result counter captured by the extension before dedupe/filtering, plus a history/aggregate read contract for LinkedIn runs only. The extension will render the 20 most recent LinkedIn Search runs, exact-query aggregates, a date-independent best-keyword ranking below the recent list, and drilldown links using existing run/candidate/opportunity diagnostics.

The smallest compatible implementation is additive: add nullable raw count storage to `job_search_runs`, accept the value when authenticated browser Search creates or updates a run, expose dedicated LinkedIn history endpoints, and add a compact popup tab. Do not modify `apps/web`, Freelance outreach, Email/WhatsApp settings, or career-page/ATS behavior.

## Technical Context

**Language/Version**: Python 3.12 style FastAPI/SQLAlchemy service code; TypeScript/React Plasmo extension.  
**Primary Dependencies**: FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL, Plasmo, React, Zustand-style popup store, Vitest/Testing Library.  
**Storage**: PostgreSQL via existing `job_search_runs`, `job_search_candidates`, `opportunities`; additive nullable column(s) for raw LinkedIn count and optional capture metadata.  
**Testing**: API pytest unit/contract/integration tests; extension `npm run typecheck` and focused Vitest component/store tests.  
**Target Platform**: Local/Render FastAPI API and worker, Chrome/Plasmo extension popup.  
**Project Type**: Multi-app product: API service plus browser extension UI; worker remains separate for long-running processing.  
**Performance Goals**: History opens in the popup without noticeable delay for the 20-run list; aggregate endpoint returns date-independent top keyword/query rows in one API round trip.  
**Constraints**: Owner scoping is mandatory; raw count must be nullable and never inferred by subtracting duplicate/rejected/AI counters; safe diagnostics must not expose secrets/provider tokens.  
**Scale/Scope**: Personal operator workflow, 20 recent LinkedIn runs plus date-independent keyword aggregates for one authenticated user; no team/workspace support and no Freelance web changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Dual Opportunity Search**: PASS. The plan explicitly scopes to `job`/Full-time extension and excludes Freelance web behavior.
- **Specialized, Evidence-Backed Discovery**: PASS. The feature improves traceability of LinkedIn search query, keyword, and result evidence.
- **Structured Opportunity Records**: PASS. Uses additive structured run fields and derived aggregates rather than ad hoc local-only popup state.
- **Human-Reviewed Multi-Channel Outreach**: PASS. No send behavior changes; Email/WhatsApp/outreach are out of scope.
- **Compatible Architecture and Operator Workflow**: PASS. API exposes query/history; extension renders; worker remains responsible for processing candidates and dedupe.

No justified constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/017-extension-search-history/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api.md
|   `-- extension-ui.md
|-- checklists/
|   `-- requirements.md
`-- spec.md
```

### Source Code (repository root)

```text
apps/api/
|-- alembic/versions/
|-- app/models/job_search_run.py
|-- app/schemas/job_search_run.py
|-- app/api/routes/job_search_runs.py
|-- app/services/job_search_run_service.py
`-- tests/
    |-- contract/
    |-- integration/
    `-- unit/

apps/extension/
|-- background.ts
|-- contents/linkedin-search.ts
|-- src/api/client.ts
|-- src/api/types.ts
|-- src/store/popupStore.ts
|-- src/components/popup/
|   |-- TabNav.tsx
|   |-- PopupContent.tsx
|   `-- SearchHistoryView.tsx
`-- src/styles/popup.css

apps/worker/
|-- app/jobs/linkedin_job_search.py
`-- tests/
```

**Structure Decision**: Use the existing API/extension split. Persist raw count on the existing run model, compute aggregates in API service/query code, and add a new extension popup view. Worker changes should be limited to preserving compatibility when it reconciles counters; it must not overwrite raw count from the extension.

## Complexity Tracking

No constitution violations or unusual complexity are required.

## Phase 0: Research

Completed in `research.md`.

## Phase 1: Design & Contracts

Completed in:

- `data-model.md`
- `contracts/api.md`
- `contracts/extension-ui.md`
- `quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Contracts include `search_kind=linkedin` filtering and explicitly exclude `apps/web`.
- **Specialized, Evidence-Backed Discovery**: PASS. Raw result count is captured before dedupe and stored with query/tokens.
- **Structured Opportunity Records**: PASS. New data is queryable and owner-scoped.
- **Human-Reviewed Multi-Channel Outreach**: PASS. No sending or outreach behavior is introduced.
- **Compatible Architecture and Operator Workflow**: PASS. Long-running capture/processing split remains unchanged.

## Implementation Notes For `/speckit-tasks`

- Start with schema/migration, model/schema tests, and contract tests for nullable raw count.
- Add API aggregate service before extension UI so the popup can consume a stable contract with a 20-run list and date-independent keyword ranking.
- Add the History tab after API contracts are passing.
- Validate old runs with `raw_linkedin_result_count = null` render as unknown and are excluded from raw averages.
- Include a regression test that repeated duplicate-heavy searches increase raw totals but keep duplicate counts separate.
