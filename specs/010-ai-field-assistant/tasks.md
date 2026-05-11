# Tasks: AI Field Assistant

**Input**: Design documents from `specs/010-ai-field-assistant/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included because the plan/quickstart define API, ownership, extension typecheck, and manual validation requirements.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/010-ai-field-assistant` after `/speckit-plan` generated plan, research, data model, contracts, and quickstart.

> Refresh `docs/handoff.md` whenever implementation status changes materially or work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or does not depend on incomplete tasks.
- **[Story]**: Maps task to a specific user story from `spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared feature skeletons, contracts, and test fixtures used by all stories.

- [x] T001 Create API field assistant route skeleton in `apps/api/app/api/routes/field_assistant.py`
- [x] T002 Register the field assistant router in `apps/api/app/main.py`
- [x] T003 [P] Create API field assistant schema skeletons in `apps/api/app/schemas/field_assistant.py`
- [x] T004 [P] Create API field assistant model skeletons in `apps/api/app/models/field_assistant.py`
- [x] T005 [P] Create API field assistant service skeleton in `apps/api/app/services/field_assistant_service.py`
- [x] T006 [P] Create extension field assistant type skeletons in `apps/extension/src/api/types.ts`
- [x] T007 [P] Create extension field assistant API client placeholders in `apps/extension/src/api/client.ts`
- [x] T008 [P] Create extension assistant component directory with placeholder entry in `apps/extension/src/components/assistant/AssistantShell.tsx`
- [x] T009 [P] Create extension content script placeholder in `apps/extension/contents/field-assistant.ts`
- [x] T010 [P] Create extension field assistant utility placeholder in `apps/extension/src/utils/fieldAssistant.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data, routing, safety helpers, and extension messaging needed before user stories can be completed.

**CRITICAL**: No user story is complete until this phase is done.

- [x] T011 Create Alembic migration for `field_assistant_activations`, `field_response_suggestions`, and optional `field_answer_generations` in `apps/api/alembic/versions/015_ai_field_assistant.py`
- [x] T012 Implement SQLAlchemy models and relationships for field assistant entities in `apps/api/app/models/field_assistant.py`
- [x] T013 Export field assistant models from `apps/api/app/models/__init__.py`
- [x] T014 Implement Pydantic request/response schemas from `contracts/openapi.yaml` in `apps/api/app/schemas/field_assistant.py`
- [x] T015 Implement owner-scoped activation normalization helpers for base domains and exact pages in `apps/api/app/services/field_assistant_service.py`
- [x] T016 Implement sanitized field context validation helpers in `apps/api/app/services/field_assistant_service.py`
- [x] T017 Implement keyword normalization and suggestion pruning helpers in `apps/api/app/services/field_assistant_service.py`
- [x] T018 [P] Add API contract tests for field assistant schema shapes in `apps/api/tests/contract/test_field_assistant_contract.py`
- [x] T019 [P] Add migration tests for field assistant tables and uniqueness constraints in `apps/api/tests/integration/test_field_assistant_migration.py`
- [x] T020 [P] Add unit tests for domain/page normalization and sanitization in `apps/api/tests/unit/test_field_assistant_service.py`
- [x] T021 Implement extension message type definitions from `contracts/extension-messages.md` in `apps/extension/src/utils/fieldAssistant.ts`
- [x] T022 Implement unsupported URL scheme and sensitive-field constants in `apps/extension/src/utils/fieldAssistant.ts`
- [x] T023 Add extension utility tests for field type/sensitivity classification in `apps/extension/src/utils/fieldAssistant.test.ts`
- [x] T024 Update extension manifest permissions or host-permission notes only as needed in `apps/extension/package.json`

**Checkpoint**: Foundation ready; user story implementation can start.

---

## Phase 3: User Story 1 - Generate an answer in an application field (Priority: P1) MVP

**Goal**: Authenticated operator enables an external page/domain, sees a magic-wand action on eligible fields, generates a grounded answer, reviews it, and inserts it explicitly without form submission.

**Independent Test**: On a supported test page, enable the assistant, generate for one eligible long-answer field, review the draft, insert it, and confirm no sensitive fields are touched and no form is submitted.

### Tests for User Story 1

- [x] T025 [P] [US1] Add API integration tests for answer generation with sanitized field context in `apps/api/tests/integration/test_field_answer_generation.py`
- [x] T026 [P] [US1] Add API integration tests rejecting unsafe or insufficient field context in `apps/api/tests/integration/test_field_answer_generation.py`
- [x] T027 [P] [US1] Add extension utility tests for eligible textarea, long input, contenteditable, and dynamic field cases in `apps/extension/src/utils/fieldAssistant.test.ts`
- [x] T028 [P] [US1] Add extension utility tests that password, OTP, payment, phone, short email, search, disabled, readonly, and hidden fields are rejected in `apps/extension/src/utils/fieldAssistant.test.ts`

### Implementation for User Story 1

- [x] T029 [US1] Implement `POST /field-assistant/generate` route in `apps/api/app/api/routes/field_assistant.py`
- [x] T030 [US1] Implement server-side answer generation orchestration using existing professional context services in `apps/api/app/services/field_assistant_service.py`
- [x] T031 [US1] Add safe field answer prompt/context assembly using sender profile, portfolio URL, LinkedIn URL, and default resume context in `apps/api/app/services/field_assistant_service.py`
- [x] T032 [US1] Integrate field answer generation with existing AI generation utilities without exposing prompt secrets in `apps/api/app/services/ai_email_generation_service.py`
- [x] T033 [US1] Implement field detection, keyword inference, sensitive-field blocking, and dynamic rescans in `apps/extension/src/utils/fieldAssistant.ts`
- [x] T034 [US1] Implement content script scanning, overlay mounting, field identity tracking, and safe insertion revalidation in `apps/extension/contents/field-assistant.ts`
- [x] T035 [US1] Implement magic-wand button styles and safe anchored positioning in `apps/extension/src/styles/field-assistant.css`
- [x] T036 [US1] Import field assistant content styles from `apps/extension/contents/field-assistant.ts`
- [x] T037 [US1] Implement answer generation API client method in `apps/extension/src/api/client.ts`
- [x] T038 [US1] Add generated-answer review UI with insert, replace, append, discard, loading, and error states in `apps/extension/src/components/assistant/FieldAnswerMenu.tsx`
- [x] T039 [US1] Wire field menu generation and explicit insertion messages in `apps/extension/contents/field-assistant.ts`
- [x] T040 [US1] Ensure field assistant controls are inactive when auth session is missing in `apps/extension/src/store/authSession.ts`

**Checkpoint**: US1 MVP works independently with backend generation, field overlay, review, and explicit insertion.

---

## Phase 4: User Story 2 - Reuse recent answers by keyword (Priority: P2)

**Goal**: Operator can explicitly save useful generated/edited/manual responses and reuse up to 3 saved responses for the same owner+keyword.

**Independent Test**: Save responses for one keyword, reopen a matching field, see up to 3 suggestions, reuse one, and confirm unsaved generated answers are not retained.

### Tests for User Story 2

- [x] T041 [P] [US2] Add API integration tests for explicit suggestion save and no autosave after generation in `apps/api/tests/integration/test_field_response_suggestions.py`
- [x] T042 [P] [US2] Add API integration tests enforcing the 3 suggestions per owner+keyword cap in `apps/api/tests/integration/test_field_response_suggestions.py`
- [x] T043 [P] [US2] Add API integration tests for owner isolation of response suggestions in `apps/api/tests/integration/test_field_assistant_ownership.py`
- [x] T044 [P] [US2] Add extension utility tests for keyword normalization and suggestion display ordering in `apps/extension/src/utils/fieldAssistant.test.ts`

### Implementation for User Story 2

- [x] T045 [US2] Implement `GET /field-assistant/suggestions` route in `apps/api/app/api/routes/field_assistant.py`
- [x] T046 [US2] Implement `POST /field-assistant/suggestions` route in `apps/api/app/api/routes/field_assistant.py`
- [x] T047 [US2] Implement `POST /field-assistant/suggestions/{suggestion_id}/used` route in `apps/api/app/api/routes/field_assistant.py`
- [x] T048 [US2] Implement owner-scoped suggestion save, list, usage update, and pruning logic in `apps/api/app/services/field_assistant_service.py`
- [x] T049 [US2] Implement suggestion API client methods in `apps/extension/src/api/client.ts`
- [x] T050 [US2] Add suggestion response types to `apps/extension/src/api/types.ts`
- [x] T051 [US2] Add saved response dropdown, explicit save action, and discard behavior to `apps/extension/src/components/assistant/FieldAnswerMenu.tsx`
- [x] T052 [US2] Add optional edit-before-save UI state to `apps/extension/src/components/assistant/FieldAnswerMenu.tsx`
- [x] T053 [US2] Wire suggestion reuse and usage recording through field assistant messages in `apps/extension/contents/field-assistant.ts`

**Checkpoint**: US2 works independently after US1; response reuse is explicit, owner-scoped, and capped.

---

## Phase 5: User Story 3 - Keep the assistant available during long application sessions (Priority: P3)

**Goal**: Replace authenticated `Keep open` with a persistent, minimizable shell injected into the active tab and controlled through extension messaging.

**Independent Test**: Open shell, click into page fields, minimize/restore/close it, enable base domain or exact page, and confirm it remains available without the native popup.

### Tests for User Story 3

- [x] T054 [P] [US3] Add API integration tests for activation create/list/update/delete and base-domain/exact-page matching in `apps/api/tests/integration/test_field_assistant_activation.py`
- [x] T055 [P] [US3] Add API integration tests for activation owner isolation in `apps/api/tests/integration/test_field_assistant_ownership.py`
- [x] T056 [P] [US3] Add extension utility tests for base-domain and exact-page matching in `apps/extension/src/utils/fieldAssistant.test.ts`

### Implementation for User Story 3

- [x] T057 [US3] Implement activation list/create/update/delete routes in `apps/api/app/api/routes/field_assistant.py`
- [x] T058 [US3] Implement activation service methods and `last_used_at` update behavior in `apps/api/app/services/field_assistant_service.py`
- [x] T059 [US3] Implement activation API client methods in `apps/extension/src/api/client.ts`
- [x] T060 [US3] Add activation and shell state fields/actions to `apps/extension/src/store/popupStore.ts`
- [x] T061 [US3] Implement background message handling for page status, enable current, open shell, minimize shell, and close shell in `apps/extension/background.ts`
- [x] T062 [US3] Implement persistent shell iframe mounting, resizing, minimizing, restoring, and cleanup in `apps/extension/contents/field-assistant.ts`
- [x] T063 [US3] Implement `AssistantShell` container UI in `apps/extension/src/components/assistant/AssistantShell.tsx`
- [x] T064 [US3] Implement shell styles, minimized affordance, and close/disable controls in `apps/extension/src/styles/field-assistant.css`
- [x] T065 [US3] Add Settings UI for enabled domains/pages list, disable, delete, and exact-page/base-domain labels in `apps/extension/src/components/popup/SettingsView.tsx`
- [x] T066 [US3] Add popup action to enable current base domain or exact page in `apps/extension/src/components/popup/PopupContent.tsx`
- [x] T067 [US3] Replace authenticated `Keep open` button path with persistent shell open action in `apps/extension/src/components/popup/AppHeader.tsx`
- [x] T068 [US3] Remove obsolete authenticated keep-open window behavior from `apps/extension/background.ts`

**Checkpoint**: US3 replaces `Keep open` as the primary persistent workflow and supports opt-in domains/pages.

---

## Phase 6: User Story 4 - Authenticated-only extension experience (Priority: P4)

**Goal**: Unauthenticated users see only auth flows, and no operational title/nav/actions or page assistant controls are visible before login.

**Independent Test**: Clear session, open popup and an enabled-looking page, confirm only login/register/reset UI appears and no assistant controls are injected; log in and confirm operational UI returns.

### Tests for User Story 4

- [ ] T069 [P] [US4] Add extension auth boundary tests for unauthenticated popup chrome hiding in `apps/extension/src/components/popup/AuthView.test.tsx`
- [ ] T070 [P] [US4] Add extension utility tests that content script page status rejects unauthenticated sessions in `apps/extension/src/utils/fieldAssistant.test.ts`

### Implementation for User Story 4

- [x] T071 [US4] Refactor popup root gating so unauthenticated users render only auth flows in `apps/extension/src/components/popup/PopupContent.tsx`
- [x] T072 [US4] Hide title, email, logout, tabs, and operational actions until authenticated in `apps/extension/src/components/popup/AppHeader.tsx`
- [x] T073 [US4] Ensure tab navigation is not rendered for unauthenticated users in `apps/extension/src/components/popup/TabNav.tsx`
- [x] T074 [US4] Ensure background/content field assistant messages require authenticated session before injecting controls in `apps/extension/background.ts`
- [x] T075 [US4] Ensure sign-out closes or disables existing injected assistant UI in `apps/extension/contents/field-assistant.ts`

**Checkpoint**: US4 cleans the unauthenticated UX and prevents assistant injection without a valid app session.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, regression coverage, and handoff updates across all stories.

- [x] T076 [P] Update `docs/plasmo-extension-usage.md` with field assistant activation, persistent shell, and auth-only UX instructions
- [x] T077 [P] Update `docs/architecture.md` with final field assistant API/content-script/shell responsibilities
- [x] T078 [P] Update `docs/domain-model.md` with final activation and response suggestion entities
- [x] T079 [P] Update `PERSISTENT_EXTENSION_SHELL.md` with any implementation decisions that changed during build
- [x] T080 Update `docs/roadmap.md` with implementation status and remaining follow-ups
- [x] T081 Update `docs/handoff.md` with completed tasks, validation commands, current status, and next recommended step
- [x] T082 Update `docs/next-spec-prompt.md` with the next recommended spec prompt after field assistant implementation
- [x] T083 Run API focused validation from `specs/010-ai-field-assistant/quickstart.md`
- [x] T084 Run extension `npm run typecheck` in `apps/extension`
- [x] T085 Run extension `npm run build` in `apps/extension`
- [ ] T086 Perform manual Chrome smoke from `specs/010-ai-field-assistant/quickstart.md`
- [x] T087 Inspect extension bundle/source for accidental secret, token, full DOM, or resume-content exposure in `apps/extension/build/`
- [ ] T088 Run regression checks for LinkedIn Search capture, Jobs pagination/search, Settings, sender LinkedIn URL, and Gmail OAuth separation using `specs/010-ai-field-assistant/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational and is the MVP.
- **US2 (Phase 4)**: Depends on Foundational and practically benefits from US1's field menu, but API suggestion storage can be built in parallel after Foundation.
- **US3 (Phase 5)**: Depends on Foundational; persistent shell can be developed in parallel with US1/US2 after messaging contracts exist.
- **US4 (Phase 6)**: Depends on Foundational; popup auth cleanup can be implemented independently but final injection gating should be validated with US3.
- **Polish (Phase 7)**: Depends on all targeted user stories.

### User Story Dependencies

- **US1 (P1)**: Foundation only; delivers generation/insertion MVP.
- **US2 (P2)**: Foundation plus UI integration with US1 menu for best user value.
- **US3 (P3)**: Foundation; replaces `Keep open` and can integrate US1/US2 controls into shell.
- **US4 (P4)**: Foundation; should be completed before public testing of US1/US3.

### Parallel Opportunities

- Setup skeletons T003-T010 can run in parallel.
- Foundation tests T018-T020 and extension utility T023 can run in parallel after schemas/helpers are sketched.
- US1 API tests T025-T026 and extension tests T027-T028 can run in parallel.
- US2 API tests T041-T043 and extension test T044 can run in parallel.
- US3 activation tests T054-T056 can run in parallel.
- Documentation updates T076-T079 can run in parallel after implementation behavior is known.

---

## Parallel Example: User Story 1

```text
Task: "Add API integration tests for answer generation with sanitized field context in apps/api/tests/integration/test_field_answer_generation.py"
Task: "Add extension utility tests for eligible textarea, long input, contenteditable, and dynamic field cases in apps/extension/src/utils/fieldAssistant.test.ts"
Task: "Implement field detection, keyword inference, sensitive-field blocking, and dynamic rescans in apps/extension/src/utils/fieldAssistant.ts"
```

## Parallel Example: User Story 2

```text
Task: "Add API integration tests enforcing the 3 suggestions per owner+keyword cap in apps/api/tests/integration/test_field_response_suggestions.py"
Task: "Implement suggestion API client methods in apps/extension/src/api/client.ts"
Task: "Add optional edit-before-save UI state to apps/extension/src/components/assistant/FieldAnswerMenu.tsx"
```

## Parallel Example: User Story 3

```text
Task: "Add API integration tests for activation create/list/update/delete and base-domain/exact-page matching in apps/api/tests/integration/test_field_assistant_activation.py"
Task: "Implement persistent shell iframe mounting, resizing, minimizing, restoring, and cleanup in apps/extension/contents/field-assistant.ts"
Task: "Add Settings UI for enabled domains/pages list, disable, delete, and exact-page/base-domain labels in apps/extension/src/components/popup/SettingsView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 generation/insertion path.
3. Validate no sensitive fields get controls and no form submission occurs.
4. Demo one field answer generated, reviewed, and inserted on a manually enabled page.

### Incremental Delivery

1. US1: generate, review, insert one answer.
2. US2: explicitly save and reuse up to 3 responses per keyword.
3. US3: replace `Keep open` with persistent shell and Settings domain/page management.
4. US4: finalize unauthenticated UI cleanup and injection gating.
5. Polish: docs, quickstart, regression, manual smoke.

### Parallel Team Strategy

1. One developer owns API/data contracts and tests.
2. One developer owns extension content script, field detection, and insertion safety.
3. One developer owns popup/shell UI and Settings integration.
4. Integrate around the message contract in `specs/010-ai-field-assistant/contracts/extension-messages.md`.

---

## Notes

- [P] tasks are intentionally limited to files that can be edited independently.
- All endpoint/data tasks must preserve owner scoping.
- All extension tasks must preserve backend-only secrets and explicit operator action.
- Stop at each checkpoint to validate the story independently before continuing.

