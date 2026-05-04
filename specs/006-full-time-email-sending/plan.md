# Implementation Plan: Full-time Email Sending

**Branch**: `006-full-time-email-sending` | **Date**: 2026-05-02 | **Spec**: `specs/006-full-time-email-sending/spec.md`  
**Input**: Feature specification from `specs/006-full-time-email-sending/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 3. Revisao e envio para vagas  
**Action Plan Step**: 5. Envio de emails para vagas  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/006-full-time-email-sending/spec.md` after clarification that resumes are optional with job-application warnings, Gmail/OAuth real sending is required in v1, and duplicate `job_application` sends are blocked after one successful application.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add the first real `Full-time` application-sending workflow on top of the existing local API, worker, PostgreSQL schema, and Plasmo extension. The API adds additive resources for user settings, uploaded resumes, scoped email templates, email draft previews, send approvals, bulk-send previews, Gmail/OAuth provider state, and outreach history. The extension gains `Full-time` templates and settings sections, plus job-detail/list actions to preview, edit, approve, and inspect send history. The worker performs real Gmail/OAuth delivery outside HTTP request handling, records provider outcomes, updates `job_stage=applied` only after successful `job_application` sends, and blocks duplicate job applications while allowing later `job_follow_up`.

## Technical Context

**Language/Version**: Python 3.11+ for API/worker; TypeScript 6.x and React 19 in the Plasmo extension  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, pytest, httpx; Plasmo, React, Zustand; Gmail/OAuth client support added to worker/API provider layer during implementation  
**Storage**: PostgreSQL for templates, resumes metadata, user settings, provider account state, email drafts, send requests, and outreach events; local filesystem for first-version resume files and OAuth token material outside the extension bundle  
**Testing**: pytest for API contracts/integration/unit and worker unit/integration tests; extension `tsc --noEmit` plus focused component/store tests if the repo adds a test runner later; manual local quickstart for Gmail OAuth consent and real send sandbox  
**Target Platform**: Local Windows development with bash-compatible commands, Docker Compose for API/worker/PostgreSQL, Chrome/Plasmo extension pointed at `PLASMO_PUBLIC_API_BASE_URL`; later Render API/worker/Postgres remains compatible  
**Project Type**: Full-stack local operator workflow: FastAPI service, separate worker process, Plasmo Chrome extension UI  
**Performance Goals**: Template/resume/settings list and job-detail history load in under 1 second for local datasets; individual preview creation returns in under 2 seconds; approval requests return after queueing and never wait for provider delivery; bulk preview supports up to 25 selected opportunities  
**Constraints**: Gmail/OAuth real sending is required for v1; provider secrets and OAuth tokens never enter the extension bundle; actual delivery happens in the worker/provider layer outside HTTP request handlers; schema/API changes are additive; `Full-time` and `Freelance` templates remain separated; duplicate `job_application` sends are blocked after success; resumes are optional but missing-CV warnings are required for `job_application`  
**Scale/Scope**: Single local operator account, one Gmail/OAuth sender, tens to hundreds of captured job opportunities, up to 25 opportunities per bulk preparation, one worker process polling pending send requests, no reply inbox sync in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature scopes all templates, settings UI, drafts, sends, and history to `opportunity_type=job` / `Full-time`; no `Freelance` records or templates are exposed in this workflow.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Sending uses already captured LinkedIn job evidence, matched keywords, source URL, company/title fields, and contact email; it does not alter discovery or scrape new data.
- **III. Structured Opportunity Records**: PASS. Templates, resumes, drafts, send requests, provider accounts, and outreach events are structured records with additive migrations and auditable relationships to opportunities.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Every individual and bulk send requires preview plus explicit approval, is provider-backed, evented, auditable, rate-limited, and duplicate-protected.
- **V. Compatible Architecture and Operator Workflow**: PASS. API records operator decisions and exposes contracts; worker/provider performs real Gmail delivery; extension remains local-first and stores no secrets.
- **Additional Constraints**: PASS. PostgreSQL/Docker Compose remain the base; email sending does not happen directly inside request handlers; future Google Maps freelance compatibility is preserved by mode-scoped templates/events.
- **Development Workflow**: PASS. This plan creates research, data model, OpenAPI contract, quickstart, and updates the active Spec Kit rule context and handoff.

## Project Structure

### Documentation (this feature)

```text
specs/006-full-time-email-sending/
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
      api/routes/
        email_templates.py
        email_sending.py
        user_settings.py
      core/config.py
      models/
        email.py
        opportunity.py
        user_settings.py
      schemas/
        email.py
        user_settings.py
      services/
        email_template_service.py
        email_preview_service.py
        email_send_service.py
        user_settings_service.py
    tests/
      contract/
      integration/
      unit/
  worker/
    app/
      core/config.py
      jobs/
        email_sending.py
        linkedin_job_search.py
      services/
        gmail_provider.py
        email_delivery.py
    tests/
      integration/
      unit/
  extension/
    src/
      api/
      components/popup/
      store/
      styles/
docs/
docker-compose.yml
```

**Structure Decision**: Extend the current `apps/api`, `apps/worker`, and `apps/extension` architecture. API owns persistence models, validation, preview rendering, approval/queueing, and read contracts. Worker owns Gmail/OAuth provider delivery, retries/status updates, and event recording. Extension owns the local operator UI for settings, templates, job detail/list send actions, and history. No new web app, backend, queue service, or shared package is introduced in this feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.

## Change Impact Review

**Change Type**: Additive schema, API contract, worker provider integration, and extension UI expansion  
**Primary Surface**: Opportunity detail/list send actions, templates/settings UI, Gmail/OAuth configuration, worker polling, database migrations, API route contracts  
**Compatibility Risk**: High. This feature sends real email, handles local files/tokens, and updates application state after provider success.

**Potentially Affected Areas**:

- API models/schemas/routes/services, Alembic migrations, settings, contract and integration tests
- Worker main loop, new send processor, Gmail/OAuth provider adapter, retry/failure handling, token/config loading
- Extension navigation, API client/types, popup store, templates/settings screens, job detail/list actions, bulk selection
- Local `.env.example`, `.gitignore`/ignored storage paths, Docker Compose env wiring, docs and handoff

**Failure Modes**:

- Provider secrets or OAuth tokens accidentally exposed to the extension or committed to git.
- API approval request performs real delivery synchronously and blocks or fails mid-request.
- A failed provider send marks a job as `applied`.
- Bulk send applies to missing-email, invalid-email, or already-applied opportunities.
- Edited templates mutate historical send records instead of preserving a snapshot/reference.
- Resume files are missing at delivery time or attached when the operator removed them.
- Gmail OAuth setup is incomplete, causing confusing approval failures.

**Recommended Safeguards**:

- Store provider credentials/tokens only in backend/worker-controlled local paths or env-backed config; keep extension limited to provider status and approval APIs.
- Model send requests and outreach events as append-only/auditable records; update `job_stage=applied` only on successful `job_application` send.
- Persist rendered subject/body and selected resume metadata on drafts/send requests so history remains stable after template edits.
- Enforce duplicate application blocking in API service logic, not only in the extension.
- Add API contract tests for missing email, invalid email, missing resume warning, provider unauthorized, duplicate application, partial bulk success, and `Freelance` template exclusion.

## Phase 0 Research

See `specs/006-full-time-email-sending/research.md`.

Key decisions:

- Gmail/OAuth is the required v1 real-send path, wrapped by a provider adapter so SMTP or another provider can be added later.
- Templates are mode-scoped records with immutable rendered snapshots on drafts/send requests for auditability.
- Resume files are local-first files with database metadata; the last uploaded available CV is selected by default but attachments remain optional.
- API creates previews and approvals; worker/provider executes delivery and records per-recipient events.
- Bulk send remains preview-first with skip/block summaries and no duplicate `job_application` sends; future volume limits should come from plan/subscription rules, not hardcoded constants.

## Phase 1 Design

See:

- `specs/006-full-time-email-sending/data-model.md`
- `specs/006-full-time-email-sending/contracts/openapi.yaml`
- `specs/006-full-time-email-sending/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Data model and contracts include `mode`/`opportunity_type` scoping for templates, drafts, events, and UI entry points; `Freelance` remains a future lane.
- **Evidence-Backed Discovery**: PASS. Draft rendering uses structured company/title/keywords/source evidence already captured from job discovery.
- **Structured Records**: PASS. User settings, resumes, templates, drafts, send requests, provider account state, and outreach events are explicit entities with validation and state transitions.
- **Human-Reviewed Outreach**: PASS. Every send path includes preview, explicit approval, queueing, provider-backed delivery, audit events, rate-limit fields, and duplicate protection.
- **Compatible Architecture**: PASS. Long-running/retriable sending remains in worker/provider code; API remains orchestration and query surface; extension stores no secrets.
- **Additional Constraints**: PASS. PostgreSQL/Alembic, Docker Compose, local-first extension, Gmail/OAuth v1, and future provider/freelance compatibility remain explicit.
- **Development Workflow**: PASS. Plan artifacts, contract, quickstart, handoff, and rule context are updated for the active feature.
