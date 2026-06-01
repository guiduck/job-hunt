# Implementation Plan: Saved Search Keywords

**Branch**: `011-saved-search-keywords` | **Date**: 2026-05-29 | **Spec**: `specs/011-saved-search-keywords/spec.md`
**Input**: Feature specification from `specs/011-saved-search-keywords/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time LinkedIn MVP with post-capture AI filters  
**Action Plan Step**: Polish the Full-time local operator workflow without changing the LinkedIn-first discovery source  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/011-saved-search-keywords/spec.md` after clarifying capture-time persistence, 30 saved keyword badges, last-search prefill, badge reuse, and manual badge deletion.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add owner-scoped saved search behavior to the Full-time Search view. The Search input is prefilled from the operator's last captured search text, while reusable saved keywords render as badges below the input. Starting a LinkedIn capture persists the current input as the last search, adds any newly normalized words into the saved keyword badge library up to 30 terms, and uses only the current Search field for the run payload. Old badges are never removed by capture; the operator deletes them manually with a badge `X`. The implementation extends the existing FastAPI/PostgreSQL/Plasmo Search flow with additive preference persistence, lightweight API contracts, UI state hydration, and focused tests, without changing the LinkedIn provider, AI filters, dedupe, scoring, Gmail, or field assistant behavior.

## Technical Context

**Language/Version**: Python 3.11+ for API services/tests; TypeScript 6.x and React 19 for the Plasmo extension  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, pytest, httpx; Plasmo, React, Zustand, Chrome extension APIs; existing job search run, keyword set, popup store, and LinkedIn capture utilities  
**Storage**: PostgreSQL via existing owner-scoped keyword concepts, plus additive owner-scoped storage for last Full-time search text if the existing model cannot represent it cleanly  
**Testing**: pytest contract/integration/unit tests for API persistence, ownership, normalization, and run creation; extension `npm run typecheck`; focused TS unit tests for keyword normalization/state behavior where practical; manual Chrome smoke for Search input, badges, capture payload, and persistence  
**Target Platform**: Local Windows development with Docker Compose API/PostgreSQL and Chrome/Plasmo extension; later Render API/Postgres and Chrome extension distribution remain compatible  
**Project Type**: Full-stack browser-assisted operator workflow: FastAPI service, PostgreSQL persistence, Plasmo popup/background capture flow, and React extension UI  
**Performance Goals**: Search preferences load with the normal authenticated Search view without visible delay; adding/removing badges updates the UI in under 1 second locally; starting capture still opens LinkedIn promptly while preference persistence completes or reports a recoverable error  
**Constraints**: Preserve Search UI split between LinkedIn text/sort and optional post-capture AI filters; capture uses current Search field, not all badges; max 30 saved badges per owner; old badges delete only through explicit badge control; no new job source, no external email discovery, no Gmail permission changes, no AI resume generation in this feature  
**Scale/Scope**: Single-operator/MVP multiuser owner-scoped workflow; one active Full-time search preference per user; up to 30 saved keyword badges; one last search text; existing run/requested keyword traceability remains immutable after capture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature is scoped to `job`/Full-time search preferences and explicitly avoids crossing into `freelance`.
- **II. Specialized, Evidence-Backed Discovery**: PASS. The plan improves keyword reuse for the existing LinkedIn-first discovery flow and preserves `source_query` traceability.
- **III. Structured Opportunity Records**: PASS. Search preferences and keyword badges are structured owner-scoped records, while existing runs and opportunities keep immutable capture evidence.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. The feature does not send emails, generate outreach, submit applications, or affect Gmail OAuth.
- **V. Compatible Architecture and Operator Workflow**: PASS. The API owns owner-scoped persistence; the extension owns local Search UI and capture initiation; no long-running work moves into request handlers.
- **Additional Constraints**: PASS. FastAPI/PostgreSQL/Docker Compose/Render direction remains intact; no secrets are introduced; the discarded external job source remains out of scope.
- **Development Workflow**: PASS. This plan creates research, data model, contracts, quickstart, and updates agent context/handoff.

## Project Structure

### Documentation (this feature)

```text
specs/011-saved-search-keywords/
|-- plan.md              # This file (/speckit.plan command output)
|-- research.md          # Phase 0 output (/speckit.plan command)
|-- data-model.md        # Phase 1 output (/speckit.plan command)
|-- quickstart.md        # Phase 1 output (/speckit.plan command)
|-- contracts/           # Phase 1 output (/speckit.plan command)
`-- tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
  api/
    alembic/versions/
    app/
      api/routes/
        job_search_runs.py
        job_search_preferences.py
      models/
        opportunity.py
        job_search_preferences.py
      schemas/
        job_search_run.py
        job_search_preferences.py
      services/
        job_search_run_service.py
        job_search_preferences_service.py
        opportunity_service.py
    tests/
      contract/
      integration/
      unit/
  extension/
    src/
      api/
        client.ts
        types.ts
      capture/
        linkedin.ts
      components/
        popup/
          SearchView.tsx
      store/
        popupStore.ts
      styles/
        popup.css
docs/
```

**Structure Decision**: Extend the existing `apps/api` and `apps/extension` boundaries. API changes own persistent owner-scoped last-search and saved-badge state; extension changes own Search rendering, badge interactions, and capture-time persistence. The worker should continue consuming `JobSearchRun.requested_keywords` and `search_query` without new responsibilities.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.

## Change Impact Review

**Change Type**: Additive API/schema/UI feature with capture-flow integration  
**Primary Surface**: Full-time Search view, popup store, extension API client/types, job search run creation, owner-scoped keyword persistence  
**Compatibility Risk**: Low to medium. The behavior is small, but it sits on the capture path and must not break run creation, persisted popup state, or AI filter settings.

**Potentially Affected Areas**:

- Extension SearchView, popup store, local persisted popup state, capture payload generation, keyword normalization utilities, and popup CSS.
- API keyword set/search preference routes, schemas, services, migrations, and run creation defaults.
- Tests for job search run contracts, keyword ownership, browser capture contract, and extension typecheck.
- Docs/handoff and active plan context.

**Failure Modes**:

- Capture accidentally uses all saved badges instead of the current Search field.
- Starting capture deletes old saved badges because the current input is treated as a replacement list.
- Last search and saved badges overwrite each other, causing a bloated prefilled input.
- User A sees User B's saved keywords or last search.
- Empty input clears a useful last search or creates blank badges.
- Badge deletion changes existing runs, opportunity keyword matches, source evidence, or dedupe data.
- AI filter settings are reset while saving keywords.
- Preference save failure blocks capture without a clear recovery path.
- Local popup state fights server state and shows stale last search after login/user switch.

**Recommended Safeguards**:

- Treat last search text and saved keyword badges as separate owner-scoped concepts.
- Use current Search field as the only source for capture payload requested keywords.
- Persist last search and merge new badges at capture start; never prune badges except via explicit delete or 30-term cap behavior for newly added terms.
- Hydrate Search state after authenticated session validation and clear/hide it on logout.
- Normalize/dedupe keywords in a shared or mirrored utility with tests in API and extension.
- Keep AI filter state fields untouched during search preference updates.
- Validate ownership in API tests with two users.
- Keep historical run/opportunity records immutable when preferences change.

## Phase 0 Research

See `specs/011-saved-search-keywords/research.md`.

Key decisions:

- Represent last search text separately from saved keyword badge library.
- Persist preferences at capture start and merge only new badge terms.
- Render badges below the Search input with click-to-add and explicit `X` deletion.
- Cap saved badges at 30 per owner in API/service validation.
- Keep run creation and worker behavior compatible by passing current input-derived keywords.

## Phase 1 Design

See:

- `specs/011-saved-search-keywords/data-model.md`
- `specs/011-saved-search-keywords/contracts/openapi.yaml`
- `specs/011-saved-search-keywords/contracts/extension-search.md`
- `specs/011-saved-search-keywords/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Design keeps preferences owner-scoped to the Full-time `job` lane.
- **Evidence-Backed Discovery**: PASS. Runs continue recording requested keywords and source query independently from later preference edits.
- **Structured Records**: PASS. Last search and saved badges have explicit entities, ownership, validation, and lifecycle.
- **Human-Reviewed Outreach**: PASS. No outreach behavior changes.
- **Compatible Architecture**: PASS. API persists state, extension controls Search UI, worker remains unchanged.
- **Additional Constraints**: PASS. No new provider, no secret handling, no external job-source revival.
- **Development Workflow**: PASS. Plan artifacts, active agent context, and handoff are updated.
