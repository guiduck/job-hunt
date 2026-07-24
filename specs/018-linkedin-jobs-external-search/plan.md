# Implementation Plan: Full-time LinkedIn Jobs External Search

**Branch**: `018-linkedin-jobs-external-search` | **Date**: 2026-07-23 | **Spec**: `specs/018-linkedin-jobs-external-search/spec.md`
**Input**: Feature specification from `specs/018-linkedin-jobs-external-search/spec.md`

**Note**: `.specify/scripts/bash/setup-plan.sh --json` was attempted, but the script failed in this Windows workspace because CRLF line endings were interpreted by Bash as literal `\r` commands. This plan was generated manually from `.specify/feature.json`, the plan template, the active spec, and the prepared `docs/next-spec-prompt.md`.

## Continuity Context

**Roadmap Phase**: Phase 2 / Phase 3 Full-time fine tuning: improve real job discovery and the `External applications` lane before broadening product scope.  
**Action Plan Step**: Extend Search after `017-extension-search-history` with a deterministic LinkedIn Jobs external application source.  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Plan `Full-time LinkedIn Jobs External Search`: keep LinkedIn Jobs browser navigation and job-card inspection in the extension because it uses the operator's logged-in LinkedIn session; keep API/worker responsible for persistence, dedupe, validation, diagnostics, and existing external application behavior.

## Summary

Add a LinkedIn Jobs external search action to the Full-time extension Search page. The extension will reorganize Search into `External jobs` and `LinkedIn posts`, keep existing career-page search inside `External jobs`, and add a deterministic LinkedIn Jobs sweep that opens LinkedIn in a normal logged-in browser tab, inspects job cards, skips Easy Apply, decodes external apply URLs, accepts only selected curated sources, and persists accepted URLs into the existing `External applications` lane.

The plan is additive. API changes record and expose owner-scoped LinkedIn Jobs external search runs, source selections, counters, and terminal diagnostics. The extension owns LinkedIn navigation/inspection and posts accepted external applications or candidates to backend contracts. The worker is not responsible for LinkedIn authentication or DOM capture, but may share validation, canonicalization, and constants with API/extension where existing project boundaries allow. Existing LinkedIn post capture, post AI filters, Search History, career-page search, Jobs, Gmail sending, Field Assistant, and `apps/web` Freelance behavior remain intact.

## Technical Context

**Language/Version**: Python 3.12 style FastAPI/SQLAlchemy/Alembic service code; TypeScript/React Plasmo extension.  
**Primary Dependencies**: FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL, pytest; Plasmo, React, TypeScript, existing Chrome extension tab/content-script APIs; existing career-page source definitions and URL normalization utilities where present.  
**Storage**: PostgreSQL via existing `job_search_runs`, `job_search_candidates`, `opportunities`, and job opportunity detail/application URL fields; additive fields or JSON diagnostics for LinkedIn Jobs external search runs if existing tables cannot represent all counters safely.  
**Testing**: API pytest unit/contract/integration tests; worker unit tests only for shared source/URL utilities if touched; extension `npm.cmd run typecheck`, focused Vitest/Testing Library tests for Search UI, state, and capture utilities; manual LinkedIn smoke for real DOM/navigation.  
**Target Platform**: Local Docker Compose for API/PostgreSQL/worker; Chrome/Plasmo extension as local-first Full-time UI; API and worker remain deployable to Render.  
**Project Type**: Multi-app product: FastAPI backend, separate worker, browser extension frontend. This feature is extension-led capture plus backend persistence/diagnostics.  
**Performance Goals**: Extension remains responsive while inspecting up to 15 pages by default and 30 pages maximum; run creation/status API calls stay short request/response operations; Jobs list remains paginated/lightweight.  
**Constraints**: Do not move LinkedIn authentication to backend/worker; do not apply AI quality filters before saving LinkedIn Jobs external opportunities; do not create Gmail/outreach/send behavior; do not modify `apps/web` or Freelance Prisma migrations; source allowlist is the MVP quality gate.  
**Scale/Scope**: Personal operator workflow; one active LinkedIn Jobs run per authenticated user/search surface at a time; page sweep defaults to 15 pages and caps at 30; no accepted-opportunity cap.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The plan is strictly Full-time/job and explicitly excludes `apps/web` Freelance changes.
- **II. Specialized, Evidence-Backed Discovery**: PASS. LinkedIn Jobs is a specialized discovery surface and every accepted opportunity must retain LinkedIn job URL, external apply URL, source query/mode, selected source, and run diagnostics.
- **III. Structured Opportunity Records**: PASS. Accepted URLs reuse existing external application opportunities and owner-scoped run/candidate structures rather than local-only extension state.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. No email, WhatsApp, Gmail draft, or send workflow changes are introduced; external applications remain manual.
- **V. Compatible Architecture and Operator Workflow**: PASS. The extension remains the local-first browser workflow owner; API persists/query state; worker does not take over LinkedIn browser authentication. Long-running backend work remains outside HTTP request handlers.

No constitution violations are introduced. The main risk is LinkedIn DOM/navigation fragility, handled by diagnostics and manual smoke validation.

## Project Structure

### Documentation (this feature)

```text
specs/018-linkedin-jobs-external-search/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api.md
|   `-- extension-ui.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
apps/api/
|-- alembic/versions/
|-- app/models/job_search_run.py
|-- app/models/opportunity.py
|-- app/schemas/job_search_run.py
|-- app/schemas/opportunity.py
|-- app/services/job_search_run_service.py
|-- app/services/opportunity_service.py
|-- app/api/routes/job_search_runs.py
|-- app/api/routes/opportunities.py
`-- tests/
    |-- contract/
    |-- integration/
    `-- unit/

apps/worker/
|-- app/services/career_page_sources.py
|-- app/services/external_job_normalizer.py
|-- app/jobs/career_page_job_search.py
`-- tests/
    |-- unit/
    `-- integration/

apps/extension/
|-- popup.tsx
|-- contents/linkedin-search.ts
|-- src/capture/linkedin.ts
|-- src/capture/types.ts
|-- src/api/client.ts
|-- src/api/types.ts
|-- src/store/popupStore.ts
|-- src/components/popup/SearchView.tsx
|-- src/components/popup/SearchHistoryView.tsx
|-- src/components/popup/JobsView.tsx
|-- src/components/popup/TabNav.tsx
`-- src/styles/popup.css
```

**Structure Decision**: Keep the existing three-part split. The extension adds a Search tab structure and LinkedIn Jobs capture utilities. The API adds owner-scoped run/create/update/finalize and accepted-opportunity persistence contracts. Worker changes are limited to shared curated-source/URL utilities or tests if needed; no worker-owned LinkedIn session is planned.

## Complexity Tracking

No constitution violations or unusual complexity are required.

## Phase 0: Research

Completed in `research.md`.

Key decisions:

- Extension owns LinkedIn Jobs navigation and inspection.
- Validate direct Jobs URL/geoId behavior first, but require fallback navigation via user-like clicks into Jobs.
- Reuse the career-page curated source allowlist and selected-source checkboxes for LinkedIn Jobs.
- Persist LinkedIn Jobs external search as a distinct run kind/source kind while reusing existing external application opportunities.
- Decode safety redirects and canonicalize external apply URLs before dedupe.
- Do not apply AI quality filters or accepted-opportunity caps to the LinkedIn Jobs path.

## Phase 1: Design & Contracts

Completed in:

- `data-model.md`
- `contracts/api.md`
- `contracts/extension-ui.md`
- `quickstart.md`

Design highlights:

- Add a LinkedIn Jobs external search run lifecycle with extension-submitted progress and terminal counters.
- Use a shared curated source registry for career-page and LinkedIn Jobs URL acceptance.
- Accept only canonical external application URLs matching selected curated sources.
- Store source evidence sufficient to show LinkedIn Jobs source, LinkedIn job URL, decoded apply URL, selected source, search intent, and skip/terminal reasons.
- Keep Jobs `External applications` lane behavior unchanged: one-at-a-time open/apply and manual `job_stage` updates.

## Post-Design Constitution Check

- **I. Dual Opportunity Search**: PASS. Contracts and quickstart exclude `apps/web` and Freelance behavior.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Run/candidate/opportunity evidence captures query/mode, navigation method, source, LinkedIn URL, external URL, and skip counters.
- **III. Structured Opportunity Records**: PASS. Data model uses owner-scoped run/candidate/opportunity records and canonical URLs.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. No send/draft/provider changes; manual external application flow remains.
- **V. Compatible Architecture and Operator Workflow**: PASS. Extension handles browser behavior; backend does persistence/diagnostics; worker remains separate for backend jobs and shared utilities only.

## Implementation Notes For `/speckit-tasks`

- Start with shared curated source constants and canonical URL tests, because both career-page and LinkedIn Jobs acceptance depend on them.
- Add API contract/model changes before extension UI so the browser run can report progress against stable endpoints.
- Build Search tabs without changing existing LinkedIn post capture defaults.
- Implement LinkedIn Jobs capture in small testable utilities: URL building, redirect decoding, source matching, card inspection outcome, pagination terminal reasons.
- Include explicit guard tests that `apps/web` and Freelance migrations are untouched.
- Include manual smoke tasks for direct LinkedIn Jobs URL/geoId behavior and fallback navigation by clicking into Jobs.
