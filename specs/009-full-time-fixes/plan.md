# Implementation Plan: Full-time Workflow Fixes

**Branch**: `009-full-time-fixes` | **Date**: 2026-05-09 | **Spec**: `specs/009-full-time-fixes/spec.md`
**Input**: Feature specification from `specs/009-full-time-fixes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time LinkedIn MVP hardening after post-capture AI filters  
**Action Plan Step**: 4. Revisao operacional / 5. Envio de emails para vagas / 5.5. Login de usuario, ownership e prontidao para deploy  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/009-full-time-fixes/spec.md` after adding continuity requirements for defensive Search feedback, composite AI signal tolerance, and fallback dedupe identity when company/title extraction is empty.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Harden the current `Full-time` Plasmo workflow with a focused compatibility pass: sanitize job contact emails at all storage/use boundaries, add Google as a primary app authentication path while keeping Gmail sending OAuth separate, remove region from the base LinkedIn capture path and keep it inside optional AI filters, paginate owner-scoped opportunities at 50 per page with page-scoped selection semantics, add an owner-scoped sender LinkedIn URL to settings and generated email context, and move AI bulk message generation toward an item-progress model where completed items are reviewable before the full batch finishes. The plan also preserves real-run fixes discovered during hardening: Search feedback must keep run-level counters visible if secondary detail endpoints fail, composite AI work-mode signals must not break candidate serialization, and dedupe must use source URL as a fallback discriminator when company/title extraction is empty. The implementation should extend the existing FastAPI/PostgreSQL/API-worker/Plasmo architecture, preserve existing contracts where possible, and avoid any reintroduction of the discarded external job-source spike.

## Technical Context

**Language/Version**: Python 3.11+ for API/worker; TypeScript 6.x and React 19 in the Plasmo extension  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, psycopg, pytest, httpx; Plasmo, React, Zustand; existing Gmail OAuth/API and OpenAI-compatible AI email generation services  
**Storage**: PostgreSQL via Docker Compose locally and managed Postgres on Render; additive migrations for user auth identity links, user settings, list pagination metadata as query contract, and AI generation batch/item progress  
**Testing**: pytest for API contract/integration/unit tests and worker tests; extension `npm run typecheck`; focused manual popup smoke for Google auth separation, Jobs pagination, Search region behavior, and bulk AI progress  
**Target Platform**: Local Windows development using Docker Compose API/worker/PostgreSQL and Chrome/Plasmo extension; later Render API/worker/Postgres remains compatible  
**Project Type**: Full-stack local operator workflow: FastAPI service, separate worker process, PostgreSQL persistence, Plasmo Chrome extension UI  
**Performance Goals**: Jobs page loads at most 50 cards by default and stays usable with at least 500 saved Full-time opportunities; list filters/search/sort return page results fast enough for popup interaction; Search run feedback shows nonzero run counters within one refresh cycle when run data is available; AI bulk generation exposes per-item status updates without blocking the operator on a single opaque response  
**Constraints**: Preserve `job`/`freelance` separation; LinkedIn remains the only active job discovery source; Gmail send OAuth remains separate from Google primary auth; secrets and model keys stay backend/worker-only; long-running AI generation must not run as a single blocking HTTP request when item progress is required; schema and API changes must be additive or backward-compatible where practical; candidate serialization must tolerate broader AI signal values without hiding run progress  
**Scale/Scope**: Single-operator/MVP multiuser owner-scoped data model, hundreds of saved Full-time opportunities, bulk email generation capped at the existing 50 selected items per batch, no Next.js web app and no Freelance Google Maps feature in this pass

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The plan targets `opportunity_type=job` and the Plasmo `Full-time` workflow only, without changing `Freelance` behavior.
- **II. Specialized, Evidence-Backed Discovery**: PASS. LinkedIn remains the discovery source; region moves to post-capture AI evaluation while source query/evidence remain preserved and source URL is available as fallback identity when parsed company/title are missing.
- **III. Structured Opportunity Records**: PASS. Email cleanup, sender profile, pagination metadata, auth identity links, and AI generation progress are structured additions, not opaque UI-only state.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. AI generation creates reviewable content only; Gmail sending still requires separate OAuth and explicit operator approval.
- **V. Compatible Architecture and Operator Workflow**: PASS. API owns contracts/session/data; worker owns long-running generation; Plasmo remains the local-first operator UI.
- **Additional Constraints**: PASS. FastAPI/PostgreSQL/Docker Compose/Render direction remains intact, secrets remain server-side, and no external job-source provider is reintroduced.
- **Development Workflow**: PASS. This plan creates research, data model, OpenAPI contract, quickstart, updates agent context, and updates `docs/handoff.md`.

## Project Structure

### Documentation (this feature)

```text
specs/009-full-time-fixes/
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
        auth.py
        email_sending.py
        opportunities.py
        user_settings.py
      core/config.py
      models/
        email.py
        opportunity.py
        user.py
      schemas/
        auth.py
        email.py
        opportunity.py
        user_settings.py
      services/
        auth_service.py
        auth_session_service.py
        bulk_email_service.py
        email_constants.py
        google_oauth_service.py
        job_search_run_service.py
        opportunity_service.py
        user_settings_service.py
    tests/
      contract/
      integration/
      unit/
  worker/
    app/
      jobs/
      services/
    tests/
      integration/
      unit/
  extension/
    background.ts
    contents/linkedin-search.ts
    src/
      api/
      capture/
      components/popup/
      store/
      styles/
docs/
docker-compose.yml
```

**Structure Decision**: Extend the existing `apps/api`, `apps/worker`, and `apps/extension` boundaries. API changes cover auth/session, owner-scoped settings, paginated opportunities, and progress contracts. Worker changes cover long-running AI generation progress and any queued generation execution. Extension changes cover login/register Google buttons, Search UI region placement, Jobs pagination/selection, sender profile input, and progress display. No new web app, queue product, or external job-source module is introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.

## Change Impact Review

**Change Type**: Additive auth, schema, API contract, worker processing, and Plasmo UI hardening  
**Primary Surface**: Auth routes/UI, opportunities list contract, Search filters, user settings, bulk AI generation, email validation/sanitization  
**Compatibility Risk**: Medium-high. The pass crosses several flows, but each is a focused hardening change over existing patterns.

**Potentially Affected Areas**:

- API models/schemas/routes/services, Alembic migrations, owner-scoped contract/integration tests
- Worker AI email generation flow and any polling/queue execution path for item-level progress
- Extension auth UI/store/client, SearchView, JobsView, SettingsView, BulkEmailPanel, popup persistence
- Docs, OpenAPI contract, handoff, quickstart, and focused smoke validation

**Failure Modes**:

- Google sign-in could be confused with Gmail send OAuth or accidentally mark sending as connected.
- Email cleanup could over-trim valid addresses or accept invalid values after sanitization.
- Pagination could break selection, delete, or bulk email expectations across pages.
- Old persisted region state could keep affecting base LinkedIn search.
- A synchronous AI generation endpoint could continue hiding progress until the whole batch finishes.
- Completed AI items could become editable while still creating accidental send requests without review.
- Owner scoping regressions could expose settings, identity links, opportunities, or generation batches across users.
- Candidate detail serialization could fail on real AI signal values and make Search feedback appear empty even when the run has valid counters.
- Dedupe could collapse different recruiter posts into one duplicate when company/title extraction is empty and only email/keywords match.

**Recommended Safeguards**:

- Keep Google primary auth routes/names/copy distinct from `/sending/google-oauth/*` Gmail provider routes.
- Centralize email sanitization and run it before persistence and before draft/send validation.
- Return paginated opportunity metadata while preserving existing list item shape; keep `All listed` page-scoped.
- Treat region fields as AI filter payload only and clear/ignore legacy base-search region usage when AI filters are disabled.
- Make Search verification resilient: run-level status/counters remain the primary feedback source if candidates/opportunities detail calls fail.
- Normalize or tolerate composite AI signal values such as mixed work modes before returning candidate details.
- Include source URL in dedupe identity only when company/title are missing, preserving stronger company/title dedupe when those fields exist.
- Represent AI generation batch and items durably with item statuses and polling/read endpoints.
- Gate every generated message behind existing review/edit/approve-send controls.
- Add focused owner-isolation tests for Google identity link, sender profile URL, paginated opportunities, and AI generation batches.

## Phase 0 Research

See `specs/009-full-time-fixes/research.md`.

Key decisions:

- Use additive Google identity linking for primary app authentication and keep Gmail OAuth provider records separate.
- Centralize email sanitization around contact extraction/storage and recipient validation rather than only UI cleanup.
- Change opportunities list to a paginated response with default 50 items and page-scoped selection semantics.
- Keep LinkedIn base capture query text/sort-only; region is serialized only with enabled AI filters.
- Store sender LinkedIn URL in owner-scoped user settings and include it in template/AI context.
- Model AI bulk generation as a durable batch with per-item progress, where completed items are reviewable while remaining items continue.
- Keep run-level Search feedback independent from secondary detail endpoint success.
- Treat composite AI work-mode signals as mixed/unknown-compatible values instead of response-breaking errors.
- Use source URL as fallback dedupe discriminator when company/title extraction is empty.

## Phase 1 Design

See:

- `specs/009-full-time-fixes/data-model.md`
- `specs/009-full-time-fixes/contracts/openapi.yaml`
- `specs/009-full-time-fixes/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Contracts remain scoped to `job`/Full-time and leave Freelance untouched.
- **Evidence-Backed Discovery**: PASS. Search region changes preserve LinkedIn source evidence and use AI filtering only after capture.
- **Structured Records**: PASS. Data model defines identity links, sender profile URL, paginated list envelope, and AI generation batch/items.
- **Human-Reviewed Outreach**: PASS. Progress exposes generated content for review but never creates sends without operator approval.
- **Compatible Architecture**: PASS. API/worker/extension responsibilities stay aligned; long-running generation moves out of blocking HTTP handling.
- **Additional Constraints**: PASS. Server-side secrets stay server-side, Gmail OAuth remains separate, and the discarded external source is explicitly excluded.
- **Development Workflow**: PASS. Plan artifacts, active agent context, and handoff are updated.
