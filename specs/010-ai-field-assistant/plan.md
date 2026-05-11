# Implementation Plan: AI Field Assistant

**Branch**: `010-ai-field-assistant` | **Date**: 2026-05-09 | **Spec**: `specs/010-ai-field-assistant/spec.md`
**Input**: Feature specification from `specs/010-ai-field-assistant/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time review, sending, and post-capture intelligence  
**Action Plan Step**: Add an in-browser productivity layer for real application forms before returning to durable async AI generation/post-send hardening  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/010-ai-field-assistant/spec.md` after clarifying domain opt-in, explicit response saving, base-domain activation with exact-page override, and replacing `Keep open` with the persistent shell.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add an authenticated AI Field Assistant to the Full-time Plasmo extension. The feature detects eligible long-answer fields on operator-enabled application domains, shows a field-level magic-wand action, generates reviewable answers from owner-scoped professional context, and offers up to 3 explicitly saved reusable responses per keyword. It also replaces the authenticated `Keep open` window with a persistent, minimizable shell injected into the active tab and hides operational extension chrome when unauthenticated. The implementation extends the existing FastAPI/PostgreSQL/Plasmo architecture with additive owner-scoped settings, response suggestion storage, backend-only generation, content-script field detection, background messaging, and focused contracts/tests.

## Technical Context

**Language/Version**: Python 3.11+ for API services/tests; TypeScript 6.x and React 19 for the Plasmo extension  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, psycopg, pytest, httpx; Plasmo, React, Zustand, Chrome extension APIs; existing resume/settings and AI email generation services as grounding context  
**Storage**: PostgreSQL via existing owner-scoped models; additive tables/settings for assistant activation scopes, field response suggestions, and optional generation audit metadata  
**Testing**: pytest contract/integration/unit tests for API and data constraints; extension `npm run typecheck`; focused TS unit tests for field classification where practical; manual Chrome smoke for injected shell, field overlay, and auth-gated behavior  
**Target Platform**: Local Windows development with Docker Compose API/PostgreSQL and Chrome/Plasmo extension; later Render API/Postgres and Chrome extension distribution remain compatible  
**Project Type**: Full-stack browser-assisted operator workflow: FastAPI service, PostgreSQL persistence, Plasmo popup/background/content scripts, and extension UI embedded in active tabs  
**Performance Goals**: Eligible fields are detected/reconciled without visible typing lag on common application pages; assistant action appears within 1 second after a supported field is visible or focused; 95% of successful answer generations show a reviewable result within 10 seconds under local development conditions; saved-response lookup returns at most 3 choices per keyword  
**Constraints**: Assistant disabled by default on external domains; operator opt-in by base domain with exact-page override; unauthenticated users see only auth flows and no injected controls; secrets, OAuth tokens, model credentials, prompt internals, full resume files, and unrelated DOM content never reach browser-visible surfaces; no automatic form submission; Gmail send OAuth remains separate from Google app auth; no discarded external job-source provider is reintroduced  
**Scale/Scope**: Single-operator/MVP multiuser owner-scoped workflow, dozens of enabled domains/pages, repeated response suggestions capped at 3 per owner+keyword, external application forms in normal browser tabs, no ATS crawler and no automatic opportunity retention cleanup in this pass

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The plan extends the `job`/Full-time operator workflow only and leaves the future `freelance` lane untouched.
- **II. Specialized, Evidence-Backed Discovery**: PASS. LinkedIn remains the active discovery source; this feature assists application forms after discovery and does not add new scraping providers.
- **III. Structured Opportunity Records**: PASS. Reusable field responses, activation scopes, and professional context are structured, owner-scoped data rather than ad hoc browser storage only.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Generated text is reviewable and insert-only by explicit action; no sending or form submission is automatic.
- **V. Compatible Architecture and Operator Workflow**: PASS. Long-running or secret-backed AI work remains behind server-side services; Plasmo remains the local-first authenticated operator UI.
- **Additional Constraints**: PASS. FastAPI/PostgreSQL/Docker Compose/Render direction remains intact, secrets stay environment-managed, and host/page activation is explicit.
- **Development Workflow**: PASS. This plan creates research, data model, contracts, quickstart, updates agent context, and updates `docs/handoff.md`.

## Project Structure

### Documentation (this feature)

```text
specs/010-ai-field-assistant/
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
        field_assistant.py
        user_settings.py
      models/
        field_assistant.py
        user_settings.py
      schemas/
        field_assistant.py
        user_settings.py
      services/
        field_assistant_service.py
        ai_email_generation_service.py
        resume_service.py
        user_settings_service.py
    tests/
      contract/
      integration/
      unit/
  extension/
    background.ts
    contents/
      field-assistant.ts
    src/
      api/
        client.ts
        types.ts
      components/
        assistant/
        popup/
      store/
      styles/
      utils/
docs/
PERSISTENT_EXTENSION_SHELL.md
```

**Structure Decision**: Extend the existing `apps/api` and `apps/extension` boundaries. API changes own persistence, owner scoping, sanitized generation requests, and reusable response contracts. Extension background/content/popup changes own tab activation, injected shell lifecycle, field detection, and operator review/insert UI. No worker requirement is introduced for the first field-answer generation slice unless later performance evidence shows generation needs durable queueing.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.

## Change Impact Review

**Change Type**: Additive API/schema/UI feature plus replacement of one authenticated extension shell path  
**Primary Surface**: Plasmo popup/background/content scripts, authenticated Settings, field assistant UI, user settings, AI generation context, response suggestion persistence  
**Compatibility Risk**: Medium. The feature touches external web pages and Chrome extension permissions, but it is domain opt-in and does not change existing LinkedIn capture or Gmail send contracts.

**Potentially Affected Areas**:

- Extension auth boundary, AppHeader/TabNav visibility, SettingsView, popup store, background messaging, content scripts, styles, and API client/types
- API user settings, new field assistant routes/schemas/services/models, migrations, owner-scoped tests, and AI generation service context assembly
- Docs, quickstart, OpenAPI contract, and handoff/roadmap status

**Failure Modes**:

- Assistant appears on unauthenticated tabs or domains that were not explicitly enabled.
- Field detection shows controls on sensitive inputs, short search/email/phone fields, or unrelated forms.
- Injected UI overlaps important page content or becomes impossible to close.
- A generated answer is inserted into the wrong field after DOM changes.
- Full DOM, OAuth tokens, secrets, resume files, or unrelated page content leak into browser-visible state or requests.
- Response suggestions are saved automatically despite the explicit-save requirement.
- Saved suggestions cross owner boundaries or exceed the 3 per owner+keyword cap.
- Replacing `Keep open` removes a useful path before the persistent shell can reliably open, minimize, restore, and close.
- New content-script host permissions are broader than the actual domain opt-in UX implies.

**Recommended Safeguards**:

- Treat enabled-domain/page records as owner-scoped settings and always check auth/session before injection.
- Use denylist and positive eligibility checks for field detection, with test fixtures for sensitive and dynamic fields.
- Keep field overlays anchored and removable; store active field identity defensively and verify the field still exists before insertion.
- Use sanitized field metadata only: keyword, label/question text, URL/domain, and confidence signals.
- Require explicit `insert`, `save`, and `discard` actions in UI state and contracts.
- Enforce database/API cap of 3 saved suggestions per owner+keyword.
- Implement persistent shell as the replacement for authenticated `Keep open`, with manual fallback only through normal popup reopen if injection fails.
- Keep Chrome host permissions as narrow as possible; if broad permissions become unavoidable, gate activation through explicit domain/page enablement.

## Phase 0 Research

See `specs/010-ai-field-assistant/research.md`.

Key decisions:

- Use owner-scoped domain/page activation, disabled by default.
- Use a page-injected persistent shell for authenticated users and replace `Keep open`.
- Use content-script field detection with conservative eligibility and sensitive-field blocking.
- Use backend-only answer generation with sanitized field context and existing professional context.
- Store reusable responses only after explicit operator save, capped at 3 per owner+keyword.
- Keep v1 generation synchronous through API with visible loading/errors, deferring durable queueing unless latency evidence demands it.

## Phase 1 Design

See:

- `specs/010-ai-field-assistant/data-model.md`
- `specs/010-ai-field-assistant/contracts/openapi.yaml`
- `specs/010-ai-field-assistant/contracts/extension-messages.md`
- `specs/010-ai-field-assistant/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. The design is scoped to Full-time application assistance and leaves Freelance untouched.
- **Evidence-Backed Discovery**: PASS. Discovery remains LinkedIn-first; no external source provider is added.
- **Structured Records**: PASS. Activation scopes and saved suggestions have explicit entities, ownership, constraints, and lifecycle rules.
- **Human-Reviewed Outreach**: PASS. Field answers require review and explicit insertion; the assistant cannot submit forms or grant Gmail send access.
- **Compatible Architecture**: PASS. API owns trusted context and persistence; extension owns local UI/field interaction; no heavy scraping moves into HTTP.
- **Additional Constraints**: PASS. Secrets remain server-side, host activation is explicit, and schema changes are additive.
- **Development Workflow**: PASS. Plan artifacts, active agent context, and handoff are updated.
