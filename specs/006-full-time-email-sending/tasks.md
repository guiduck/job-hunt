# Tasks: Full-time Email Sending

**Input**: Design documents from `specs/006-full-time-email-sending/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included because `quickstart.md` defines expected automated API/worker coverage and this feature performs real provider-backed email sending.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/006-full-time-email-sending`, generating executable tasks for Full-time templates, user settings/resumes, Gmail/OAuth individual sending, bulk-send foundation, and email history.

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- API: `apps/api/app/`, `apps/api/tests/`, `apps/api/alembic/versions/`
- Worker: `apps/worker/app/`, `apps/worker/tests/`
- Extension: `apps/extension/src/`
- Feature docs: `specs/006-full-time-email-sending/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies, environment knobs, and local ignored paths needed before schema/API/worker/UI work.

- [x] T001 Add Gmail/OAuth and email MIME dependencies to `apps/worker/pyproject.toml`
- [x] T002 Add any API-side upload/hash helper dependencies needed for resume metadata to `apps/api/pyproject.toml`
- [x] T003 [P] Add Gmail OAuth, resume storage, and email send limit variables to `.env.example`
- [x] T004 [P] Ensure `.local/gmail/` and `.local/resumes/` remain ignored in `.gitignore`
- [x] T005 [P] Document local Gmail OAuth and resume storage setup in `docs/linkedin-browser-collector-usage.md`
- [x] T006 Add email send worker environment wiring to `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, models, routing, and shared types that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create additive Alembic migration for user settings, resume attachments, email templates, email drafts, send requests, bulk batches, sending provider accounts, and outreach events in `apps/api/alembic/versions/006_full_time_email_sending.py`
- [x] T008 [P] Create email SQLAlchemy models and enums in `apps/api/app/models/email.py`
- [x] T009 [P] Create user settings SQLAlchemy model in `apps/api/app/models/user_settings.py`
- [x] T010 Register new models in `apps/api/app/models/__init__.py`
- [x] T011 [P] Create email Pydantic schemas from `contracts/openapi.yaml` in `apps/api/app/schemas/email.py`
- [x] T012 [P] Create user settings and resume Pydantic schemas in `apps/api/app/schemas/user_settings.py`
- [x] T013 Add email sending and resume storage settings to `apps/api/app/core/config.py`
- [x] T014 Add Gmail/OAuth, send polling, and resume storage settings to `apps/worker/app/core/config.py`
- [x] T015 [P] Create shared email validation and template variable constants in `apps/api/app/services/email_constants.py`
- [x] T016 [P] Add extension email/settings/resume TypeScript types in `apps/extension/src/api/types.ts`
- [x] T017 Add extension API client methods for settings, resumes, templates, drafts, bulk email, provider status, and email history in `apps/extension/src/api/client.ts`
- [x] T018 Add email template, settings, draft, bulk, and provider state slices/actions to `apps/extension/src/store/popupStore.ts`
- [x] T019 Add `templates` and `settings` tabs to popup navigation in `apps/extension/src/store/popupStore.ts` and `apps/extension/src/components/popup/TabNav.tsx`
- [x] T020 Register new API routers in `apps/api/app/api/router.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order or in parallel where noted.

---

## Phase 3: User Story 1 - Manage Full-time Email Templates (Priority: P1) MVP

**Goal**: Operator can create, list, edit, activate/deactivate, and preview `Full-time` `job_application` and `job_follow_up` templates without exposing freelance templates.

**Independent Test**: Create a job application template, render a preview with sample opportunity data, deactivate it, and confirm it no longer appears as selectable for new sends while history references remain possible.

### Tests for User Story 1

- [x] T021 [P] [US1] Add API contract tests for `GET/POST/PATCH /email-templates` in `apps/api/tests/contract/test_email_templates.py`
- [x] T022 [P] [US1] Add API contract test for `POST /email-templates/{template_id}/preview` fallback warnings in `apps/api/tests/contract/test_email_template_preview.py`
- [x] T023 [P] [US1] Add service unit tests for template variable rendering and `Freelance` exclusion in `apps/api/tests/unit/test_email_template_service.py`

### Implementation for User Story 1

- [x] T024 [P] [US1] Implement email template CRUD service in `apps/api/app/services/email_template_service.py`
- [x] T025 [P] [US1] Implement template rendering and fallback warning service in `apps/api/app/services/email_preview_service.py`
- [x] T026 [US1] Implement email template routes in `apps/api/app/api/routes/email_templates.py`
- [x] T027 [US1] Seed an optional default Full-time application template in `apps/api/app/db/seed.py`
- [x] T028 [P] [US1] Add Templates view component for list/create/edit/activate/deactivate in `apps/extension/src/components/popup/TemplatesView.tsx`
- [x] T029 [P] [US1] Add template preview panel component in `apps/extension/src/components/popup/TemplatePreviewPanel.tsx`
- [x] T030 [US1] Render Templates tab in `apps/extension/src/components/popup/PopupContent.tsx`
- [x] T031 [US1] Add template form and preview styles in `apps/extension/src/styles/popup.css`
- [x] T032 [US1] Verify template workflow via `cd apps/api && pytest apps/api/tests/contract/test_email_templates.py apps/api/tests/contract/test_email_template_preview.py apps/api/tests/unit/test_email_template_service.py`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Prepare and Send One Job Application Email (Priority: P1)

**Goal**: Operator can prepare an email from one eligible job, edit the rendered subject/body, explicitly approve it, queue real Gmail/OAuth delivery, and mark the job applied only after successful `job_application` send.

**Independent Test**: Select one job with recruiter email, create/edit draft, approve send, process worker delivery, and verify send history plus `job_stage=applied`; cancellation and provider failure must not send or mark applied.

### Tests for User Story 2

- [x] T033 [P] [US2] Add API contract tests for `POST /email-drafts`, `PATCH /email-drafts/{draft_id}`, and `POST /email-drafts/{draft_id}/approve-send` in `apps/api/tests/contract/test_email_drafts.py`
- [x] T034 [P] [US2] Add API contract tests for `GET /sending/provider-account` with no secrets exposed in `apps/api/tests/contract/test_sending_provider_account.py`
- [x] T035 [P] [US2] Add integration tests for individual approval, duplicate application blocking, provider unauthorized, and job-stage success-only update in `apps/api/tests/integration/test_individual_email_send.py`
- [x] T036 [P] [US2] Add worker unit tests for Gmail provider success/failure mapping in `apps/worker/tests/unit/test_gmail_provider.py`
- [x] T037 [P] [US2] Add worker integration tests for pending send request processing and outreach event recording in `apps/worker/tests/integration/test_email_sending_job.py`

### Implementation for User Story 2

- [x] T038 [P] [US2] Implement provider account status service in `apps/api/app/services/email_provider_service.py`
- [x] T039 [P] [US2] Implement draft creation/editing service with immutable rendered snapshots in `apps/api/app/services/email_draft_service.py`
- [x] T040 [US2] Implement send approval and duplicate `job_application` blocking service in `apps/api/app/services/email_send_service.py`
- [x] T041 [US2] Implement email draft and approve-send routes in `apps/api/app/api/routes/email_sending.py`
- [x] T042 [US2] Implement provider account route in `apps/api/app/api/routes/email_sending.py`
- [x] T043 [P] [US2] Implement Gmail/OAuth provider adapter in `apps/worker/app/services/gmail_provider.py`
- [x] T044 [US2] Implement worker delivery service that attaches optional resumes and maps provider outcomes in `apps/worker/app/services/email_delivery.py`
- [x] T045 [US2] Implement pending send request polling job in `apps/worker/app/jobs/email_sending.py`
- [x] T046 [US2] Integrate email sending job into worker loop in `apps/worker/app/main.py`
- [x] T047 [US2] Add API-side event creation and job-stage update on successful `job_application` sends in `apps/api/app/services/email_send_service.py`
- [x] T048 [P] [US2] Add email compose/preview component to job detail in `apps/extension/src/components/popup/EmailDraftPanel.tsx`
- [x] T049 [US2] Add prepare/send action wiring to job detail in `apps/extension/src/components/popup/OpportunityDetail.tsx`
- [x] T050 [US2] Add provider status and send approval state handling to `apps/extension/src/store/popupStore.ts`
- [x] T051 [US2] Add email draft, warning, and confirmation styles in `apps/extension/src/styles/popup.css`
- [x] T052 [US2] Verify individual send flow with `cd apps/api && pytest apps/api/tests/contract/test_email_drafts.py apps/api/tests/contract/test_sending_provider_account.py apps/api/tests/integration/test_individual_email_send.py`
- [x] T053 [US2] Verify worker delivery with `cd apps/worker && pytest apps/worker/tests/unit/test_gmail_provider.py apps/worker/tests/integration/test_email_sending_job.py`

**Checkpoint**: User Stories 1 and 2 work independently; MVP can manage templates and send one real email through Gmail/OAuth.

---

## Phase 5: User Story 3 - Manage Resumes in User Settings (Priority: P2)

**Goal**: Operator can manage user settings and resume metadata from a settings page; new previews select the last uploaded available CV by default, while all sends remain possible without an attachment.

**Independent Test**: Upload/register resumes in settings, create a preview with the newest resume selected, remove the resume, see a `job_application` no-CV warning, and confirm history records whether a resume was attached.

### Tests for User Story 3

- [x] T054 [P] [US3] Add API contract tests for `GET/PATCH /user-settings` in `apps/api/tests/contract/test_user_settings.py`
- [x] T055 [P] [US3] Add API contract tests for `GET/POST/PATCH /user-settings/resumes` in `apps/api/tests/contract/test_resume_attachments.py`
- [x] T056 [P] [US3] Add integration tests for newest available resume defaulting and no-CV job application warnings in `apps/api/tests/integration/test_resume_defaults.py`

### Implementation for User Story 3

- [x] T057 [P] [US3] Implement user settings service in `apps/api/app/services/user_settings_service.py`
- [x] T058 [P] [US3] Implement resume metadata and newest-available lookup service in `apps/api/app/services/resume_service.py`
- [x] T059 [US3] Implement user settings and resume routes in `apps/api/app/api/routes/user_settings.py`
- [x] T060 [US3] Integrate newest available resume default into draft creation in `apps/api/app/services/email_draft_service.py`
- [x] T061 [US3] Add resume unavailable handling to worker delivery in `apps/worker/app/services/email_delivery.py`
- [x] T062 [P] [US3] Add Settings view for operator profile and resume list in `apps/extension/src/components/popup/SettingsView.tsx`
- [x] T063 [P] [US3] Add resume metadata form component in `apps/extension/src/components/popup/ResumeSettingsPanel.tsx`
- [x] T064 [US3] Render Settings tab in `apps/extension/src/components/popup/PopupContent.tsx`
- [x] T065 [US3] Add settings and resume styles in `apps/extension/src/styles/popup.css`
- [x] T066 [US3] Verify settings/resume flow with `cd apps/api && pytest apps/api/tests/contract/test_user_settings.py apps/api/tests/contract/test_resume_attachments.py apps/api/tests/integration/test_resume_defaults.py`

**Checkpoint**: User Story 3 works independently and enhances User Story 2 with resume defaults/warnings.

---

## Phase 6: User Story 4 - Review Bulk Send Summary Before Approval (Priority: P2)

**Goal**: Operator can select up to 25 job opportunities, preview sendable/skipped/blocked outcomes, approve the batch, and queue one tracked outcome per selected recipient.

**Independent Test**: Select valid, missing-email, invalid-email, and already-applied opportunities; confirm preview counts; approve valid batch; verify each recipient has a send request or skipped event and partial failures preserve per-recipient status.

### Tests for User Story 4

- [x] T067 [P] [US4] Add API contract tests for `POST /bulk-email/preview` and `POST /bulk-email/{batch_id}/approve` in `apps/api/tests/contract/test_bulk_email.py`
- [x] T068 [P] [US4] Add integration tests for bulk limit, missing-email skip, duplicate skip, invalid recipient block, and partial success in `apps/api/tests/integration/test_bulk_email_send.py`

### Implementation for User Story 4

- [x] T069 [P] [US4] Implement bulk preview and summary service in `apps/api/app/services/bulk_email_service.py`
- [x] T070 [US4] Implement bulk approval service that creates per-recipient send requests or skipped events in `apps/api/app/services/bulk_email_service.py`
- [x] T071 [US4] Implement bulk email routes in `apps/api/app/api/routes/email_sending.py`
- [x] T072 [US4] Add bulk batch completion updates from worker outcomes in `apps/worker/app/services/email_delivery.py`
- [x] T073 [P] [US4] Add selectable job rows and bulk action state in `apps/extension/src/components/popup/JobsView.tsx`
- [x] T074 [P] [US4] Add bulk send preview/confirmation component in `apps/extension/src/components/popup/BulkEmailPanel.tsx`
- [x] T075 [US4] Add bulk preview and approve actions to `apps/extension/src/store/popupStore.ts`
- [x] T076 [US4] Add bulk selection and summary styles in `apps/extension/src/styles/popup.css`
- [x] T077 [US4] Verify bulk send flow with `cd apps/api && pytest apps/api/tests/contract/test_bulk_email.py apps/api/tests/integration/test_bulk_email_send.py`

**Checkpoint**: User Story 4 works independently after templates and shared send foundations exist.

---

## Phase 7: User Story 5 - Inspect Application Send History (Priority: P3)

**Goal**: Operator can inspect job email history with template, resume, recipient, status, provider message ID, timestamp, and error details.

**Independent Test**: Open a job with sent, failed, skipped duplicate, and skipped missing-contact events and confirm the timeline displays each status without marking failed sends as applied.

### Tests for User Story 5

- [x] T078 [P] [US5] Add API contract tests for `GET /opportunities/{opportunity_id}/email-history` in `apps/api/tests/contract/test_email_history.py`
- [x] T079 [P] [US5] Add integration tests for history ordering, failed-send visibility, and duplicate application blocking visibility in `apps/api/tests/integration/test_email_history.py`

### Implementation for User Story 5

- [x] T080 [P] [US5] Implement outreach event query service in `apps/api/app/services/outreach_history_service.py`
- [x] T081 [US5] Implement opportunity email-history route in `apps/api/app/api/routes/email_sending.py`
- [x] T082 [P] [US5] Add email history timeline component in `apps/extension/src/components/popup/EmailHistoryTimeline.tsx`
- [x] T083 [US5] Render email history in job detail in `apps/extension/src/components/popup/OpportunityDetail.tsx`
- [x] T084 [US5] Add email history loading and refresh actions to `apps/extension/src/store/popupStore.ts`
- [x] T085 [US5] Add history timeline styles in `apps/extension/src/styles/popup.css`
- [x] T086 [US5] Verify history flow with `cd apps/api && pytest apps/api/tests/contract/test_email_history.py apps/api/tests/integration/test_email_history.py`

**Checkpoint**: All user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate the feature end-to-end, harden secrets handling, and update documentation after implementation.

- [x] T087 [P] Add generated OpenAPI/schema drift check or manual contract comparison notes in `specs/006-full-time-email-sending/contracts/openapi.yaml`
- [x] T088 [P] Update API and worker README/setup notes for Gmail OAuth and resume storage in `README.md`
- [x] T089 [P] Update feature quickstart with any final command adjustments discovered during implementation in `specs/006-full-time-email-sending/quickstart.md`
- [x] T090 Audit extension code for absence of Gmail secrets/tokens and document result in `docs/handoff.md`
- [x] T091 Run full API test suite with `cd apps/api && pytest`
- [ ] T092 Run full worker test suite with `cd apps/worker && pytest`
- [x] T093 Run extension typecheck with `cd apps/extension && npm run typecheck`
- [ ] T094 Run local quickstart validation from `specs/006-full-time-email-sending/quickstart.md`
- [x] T095 Update `docs/handoff.md` with implementation status, validation results, next step, and latest prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **US1 Templates (Phase 3)**: Depends on Foundational - MVP starting point for reusable content.
- **US2 Individual Send (Phase 4)**: Depends on Foundational and benefits from US1 templates; delivers first real email send.
- **US3 Settings/Resumes (Phase 5)**: Depends on Foundational; can run alongside US1/US2 after shared models exist, but US2 resume defaults are complete only after US3.
- **US4 Bulk Send (Phase 6)**: Depends on US1 templates, US2 send request foundations, and Foundational.
- **US5 History (Phase 7)**: Depends on outreach events created by US2/US4 but can implement query/UI independently once event schema exists.
- **Polish (Phase 8)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on other stories.
- **User Story 2 (P1)**: Can start after Foundational; needs at least one active template from US1 for full manual validation.
- **User Story 3 (P2)**: Can start after Foundational; enhances US2 with resume defaults but remains independently testable.
- **User Story 4 (P2)**: Requires US2 send request mechanics and US1 templates.
- **User Story 5 (P3)**: Requires outreach events from US2 or US4 for realistic validation.

### Within Each User Story

- Tests before implementation tasks.
- Models/schemas before services.
- Services before routes.
- API contracts before extension client/store usage.
- Worker provider/delivery before full send quickstart validation.

### Parallel Opportunities

- Setup tasks T003-T005 can run in parallel.
- Foundational model/schema/config/type tasks T008-T016 can run in parallel after T007 is understood.
- Test tasks within each user story can run in parallel.
- Extension component work can run in parallel with API service work when contracts are stable.
- Worker Gmail provider tasks can run in parallel with API draft/template work after shared schema decisions are complete.

---

## Parallel Example: User Story 1

```bash
Task: "T021 [US1] Add API contract tests for email template CRUD in apps/api/tests/contract/test_email_templates.py"
Task: "T022 [US1] Add API contract test for template preview fallback warnings in apps/api/tests/contract/test_email_template_preview.py"
Task: "T023 [US1] Add service unit tests for template rendering in apps/api/tests/unit/test_email_template_service.py"
Task: "T028 [US1] Add Templates view component in apps/extension/src/components/popup/TemplatesView.tsx"
Task: "T029 [US1] Add template preview panel component in apps/extension/src/components/popup/TemplatePreviewPanel.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T033 [US2] Add API contract tests for email drafts in apps/api/tests/contract/test_email_drafts.py"
Task: "T036 [US2] Add worker unit tests for Gmail provider in apps/worker/tests/unit/test_gmail_provider.py"
Task: "T038 [US2] Implement provider account status service in apps/api/app/services/email_provider_service.py"
Task: "T043 [US2] Implement Gmail/OAuth provider adapter in apps/worker/app/services/gmail_provider.py"
Task: "T048 [US2] Add email compose/preview component in apps/extension/src/components/popup/EmailDraftPanel.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T054 [US3] Add API contract tests for user settings in apps/api/tests/contract/test_user_settings.py"
Task: "T055 [US3] Add API contract tests for resumes in apps/api/tests/contract/test_resume_attachments.py"
Task: "T057 [US3] Implement user settings service in apps/api/app/services/user_settings_service.py"
Task: "T058 [US3] Implement resume metadata service in apps/api/app/services/resume_service.py"
Task: "T062 [US3] Add Settings view in apps/extension/src/components/popup/SettingsView.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational schema/types/routes registration.
3. Complete Phase 3: User Story 1 templates.
4. Complete Phase 4: User Story 2 individual Gmail/OAuth sending.
5. Stop and validate individual send from a reviewed job before bulk work.

### Incremental Delivery

1. Templates make reusable content and preview possible.
2. Individual sending proves provider auth, queueing, worker delivery, duplicate blocking, and applied-stage updates.
3. Settings/resumes improve default CV selection and profile variables.
4. Bulk send builds on the same send request/event foundation.
5. History closes the operator loop for follow-up and later response tracking.

### Risk Controls

- Keep provider secrets and OAuth tokens out of extension code and git.
- Keep delivery outside API request handlers.
- Update `job_stage=applied` only after successful `job_application` provider result.
- Block duplicate `job_application` sends in API services, not only in UI.
- Preserve rendered subject/body snapshots for audit history.
