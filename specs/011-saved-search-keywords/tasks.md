# Tasks: Saved Search Keywords

**Input**: Design documents from `specs/011-saved-search-keywords/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are included because the plan and quickstart require API contract/integration coverage, ownership validation, run compatibility checks, and extension type/build validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/011-saved-search-keywords/plan.md`

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current surfaces and prepare the implementation boundary without changing behavior.

- [X] T001 Inspect current keyword persistence and run creation behavior in `apps/api/app/models/opportunity.py`, `apps/api/app/services/opportunity_service.py`, and `apps/api/app/services/job_search_run_service.py`
- [X] T002 Inspect current Search UI, popup store persistence, and capture payload flow in `apps/extension/src/components/popup/SearchView.tsx`, `apps/extension/src/store/popupStore.ts`, and `apps/extension/src/capture/linkedin.ts`
- [X] T003 [P] Review route registration patterns in `apps/api/app/main.py` and `apps/api/app/api/routes/__init__.py` before adding the preferences route
- [X] T004 [P] Review existing API auth/ownership test helpers in `apps/api/tests/conftest.py` for two-user preference tests
- [X] T005 [P] Review existing extension store tests in `apps/extension/src/store/popupStore.test.ts` and keyword normalization tests in `apps/extension/src/capture/linkedin.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared API and extension foundations required by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 [P] Add failing unit tests for API keyword normalization and 30-keyword cap in `apps/api/tests/unit/test_job_search_preferences_service.py`
- [X] T007 [P] Add failing extension tests for search keyword parsing, dedupe, badge append behavior, and 30-keyword cap in `apps/extension/src/capture/linkedin.test.ts`
- [X] T008 Create owner-scoped `JobSearchPreference` model in `apps/api/app/models/job_search_preferences.py`
- [X] T009 Add Alembic migration for `job_search_preferences` with unique `user_id + opportunity_type` constraint in `apps/api/alembic/versions/018_job_search_preferences.py`
- [X] T010 Export/import the new preference model in `apps/api/app/models/__init__.py` if required by local metadata discovery
- [X] T011 Create `JobSearchPreferenceRead` and `JobSearchPreferenceUpdate` schemas in `apps/api/app/schemas/job_search_preferences.py`
- [X] T012 Implement shared preference normalization helpers in `apps/api/app/services/job_search_preferences_service.py`
- [X] T013 Implement mirrored extension keyword helper exports in `apps/extension/src/capture/linkedin.ts`
- [X] T014 Add `JobSearchPreference` API types in `apps/extension/src/api/types.ts`
- [X] T015 Add API client methods for get/update/delete search preferences in `apps/extension/src/api/client.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order.

---

## Phase 3: User Story 1 - Save search words as reusable keywords (Priority: P1) MVP

**Goal**: The Search input hydrates from the last captured search, capture persists the current input as last search, new words become saved badges, and the run uses only the current input.

**Independent Test**: Enter `react typescript remoto`, start capture, reopen Search, and confirm the input is `react typescript remoto`, badges include `react`, `typescript`, and `remoto`, and the run payload uses those current input terms only.

### Tests for User Story 1

- [X] T016 [P] [US1] Add contract tests for `GET /job-search-preferences` and `PUT /job-search-preferences` in `apps/api/tests/contract/test_job_search_preferences_contract.py`
- [X] T017 [P] [US1] Add integration tests for last-search persistence and capture-time badge merge in `apps/api/tests/integration/test_job_search_preferences.py`
- [X] T018 [P] [US1] Add integration test proving job search run creation records current input keywords/search query after preference save in `apps/api/tests/integration/test_job_search_preferences.py`
- [X] T019 [P] [US1] Add extension store test for hydrating Search input from server last search in `apps/extension/src/store/popupStore.test.ts`
- [X] T020 [P] [US1] Add extension store test for capture start persisting preferences before sending the capture request in `apps/extension/src/store/popupStore.test.ts`

### Implementation for User Story 1

- [X] T021 [US1] Implement `get_or_create_job_search_preference` and `update_job_search_preference` service functions in `apps/api/app/services/job_search_preferences_service.py`
- [X] T022 [US1] Implement `GET /job-search-preferences` and `PUT /job-search-preferences` route handlers in `apps/api/app/api/routes/job_search_preferences.py`
- [X] T023 [US1] Register the job search preferences router in `apps/api/app/main.py` or the existing route aggregation file
- [X] T024 [US1] Preserve current `JobSearchRunCreate.keywords` and `search_query` behavior while allowing the extension to pass current input-derived terms in `apps/api/app/services/job_search_run_service.py`
- [X] T025 [US1] Add popup store state and actions for `searchPreference`, `savedSearchKeywords`, and last-search hydration in `apps/extension/src/store/popupStore.ts`
- [X] T026 [US1] Hydrate search preferences after authenticated session validation and refresh in `apps/extension/src/store/popupStore.ts`
- [X] T027 [US1] Update `startCapture` to persist the current Search field, merge new badges, and then send capture with current input only in `apps/extension/src/store/popupStore.ts`
- [X] T028 [US1] Render the hydrated Search input value without resetting AI filter settings in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T029 [US1] Keep preference save failures recoverable while preserving the typed capture input in `apps/extension/src/store/popupStore.ts`

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Edit saved keyword badges safely (Priority: P2)

**Goal**: Saved keywords render as badges below the Search input; clicking a badge adds it to the input; clicking `X` deletes the badge without changing the current input or historical data.

**Independent Test**: Add a new word through capture, remove an existing badge with its `X`, reopen Search, and confirm the badge list changed while the input still reflects the last search.

### Tests for User Story 2

- [X] T030 [P] [US2] Add contract test for `DELETE /job-search-preferences/keywords/{keyword}` in `apps/api/tests/contract/test_job_search_preferences_contract.py`
- [X] T031 [P] [US2] Add integration tests for explicit badge deletion and non-deletion during capture in `apps/api/tests/integration/test_job_search_preferences.py`
- [X] T032 [P] [US2] Add extension store test for clicking a badge body to append the keyword once to the Search input in `apps/extension/src/store/popupStore.test.ts`
- [X] T033 [P] [US2] Add extension store test for badge `X` deletion preserving current Search input in `apps/extension/src/store/popupStore.test.ts`

### Implementation for User Story 2

- [X] T034 [US2] Implement `delete_saved_search_keyword` service behavior in `apps/api/app/services/job_search_preferences_service.py`
- [X] T035 [US2] Implement `DELETE /job-search-preferences/keywords/{keyword}` route in `apps/api/app/api/routes/job_search_preferences.py`
- [X] T036 [US2] Add popup store actions to append a badge to the Search input and delete a saved badge in `apps/extension/src/store/popupStore.ts`
- [X] T037 [US2] Render saved keyword badges below the Search input with body click and `X` delete control in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T038 [US2] Add responsive badge styling that avoids overflow in the popup in `apps/extension/src/styles/popup.css`
- [X] T039 [US2] Ensure badge deletion does not mutate current Search input, selected AI filters, or capture progress state in `apps/extension/src/store/popupStore.ts`

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Keep search history owner-scoped and compatible (Priority: P3)

**Goal**: Search preferences are owner-scoped, logout/user switch clears prior state, and historical runs/opportunities/AI filter settings remain compatible.

**Independent Test**: Log in as two users, save different last searches/badges for each, confirm isolation, edit preferences, and confirm prior runs/opportunities keep their original source query and requested keywords.

### Tests for User Story 3

- [X] T040 [P] [US3] Add two-user ownership tests for preferences and badge deletion in `apps/api/tests/integration/test_job_search_preferences_ownership.py`
- [X] T041 [P] [US3] Add integration test that editing preferences does not mutate historical run requested keywords or search query in `apps/api/tests/integration/test_job_search_preferences.py`
- [X] T042 [P] [US3] Add API compatibility test proving AI filter settings payload remains unchanged by preference persistence in `apps/api/tests/integration/test_linkedin_ai_filters_compatibility.py`
- [X] T043 [P] [US3] Add extension store test clearing saved search state on logout/user switch in `apps/extension/src/store/popupStore.test.ts`

### Implementation for User Story 3

- [X] T044 [US3] Enforce owner scoping on all preference queries/mutations in `apps/api/app/services/job_search_preferences_service.py`
- [X] T045 [US3] Ensure preference routes require `current_user` and return 404/empty owner-scoped state appropriately in `apps/api/app/api/routes/job_search_preferences.py`
- [X] T046 [US3] Clear search preference state during logout in `apps/extension/src/store/popupStore.ts`
- [X] T047 [US3] Ensure Search hydration runs after auth session validation and never displays another user's previous local state in `apps/extension/src/store/popupStore.ts`
- [X] T048 [US3] Verify preference updates do not write to opportunities, job opportunity details, keyword matches, or existing run records in `apps/api/app/services/job_search_preferences_service.py`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, docs alignment, and regression coverage.

- [X] T049 [P] Update `docs/search-improvements.md` with the saved last-search + keyword badge behavior
- [X] T050 [P] Update `docs/bot-1-job-search.md` with Search input, saved badges, 30-keyword cap, and current-input capture semantics
- [X] T051 [P] Update `docs/roadmap.md` with the saved search keyword polish under the current Full-time phase
- [X] T052 Update `docs/handoff.md` with implementation status, validation results, next step, and latest prompt
- [X] T053 Update `docs/next-spec-prompt.md` with the next recommended Spec Kit prompt after this small search polish
- [X] T054 Run API validation from `specs/011-saved-search-keywords/quickstart.md` using `docker compose exec api python -m compileall app alembic`
- [X] T055 Run focused API tests from `specs/011-saved-search-keywords/quickstart.md`
- [X] T056 Run extension validation from `specs/011-saved-search-keywords/quickstart.md` using `npm run typecheck` and `npm run build` in `apps/extension`
- [ ] T057 Perform manual Chrome smoke from `specs/011-saved-search-keywords/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from US1 state/actions.
- **User Story 3 (Phase 5)**: Depends on Foundational and validates cross-user compatibility after US1/US2 behavior exists.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: MVP. Can be implemented after Foundational and delivers last search + capture-time persistence.
- **US2 (P2)**: Adds badge reuse/deletion. Can start after Foundational, but UI/state integration is simpler after US1 actions exist.
- **US3 (P3)**: Hardening/compatibility. Should complete before release because it validates ownership and regression boundaries.

### Within Each User Story

- Tests first where listed.
- API schema/model/service before API route behavior.
- API client/types before extension store integration.
- Store actions before SearchView rendering.
- Core behavior before CSS/polish.

### Parallel Opportunities

- Setup inspections T003-T005 can run in parallel.
- Foundational tests T006-T007 can run in parallel.
- US1 test tasks T016-T020 can run in parallel.
- US2 test tasks T030-T033 can run in parallel.
- US3 test tasks T040-T043 can run in parallel.
- Documentation tasks T049-T051 can run in parallel after behavior is final.

---

## Parallel Example: User Story 1

```bash
# API and extension tests can be prepared together:
Task: "Add contract tests for GET/PUT preferences in apps/api/tests/contract/test_job_search_preferences_contract.py"
Task: "Add extension store test for hydrating Search input in apps/extension/src/store/popupStore.test.ts"

# API route and extension client can be implemented by different workers after schemas exist:
Task: "Implement job_search_preferences route handlers in apps/api/app/api/routes/job_search_preferences.py"
Task: "Add API client methods in apps/extension/src/api/client.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add DELETE preference contract test in apps/api/tests/contract/test_job_search_preferences_contract.py"
Task: "Add extension store tests for badge append/delete in apps/extension/src/store/popupStore.test.ts"
Task: "Add responsive badge styling in apps/extension/src/styles/popup.css"
```

## Parallel Example: User Story 3

```bash
Task: "Add ownership tests in apps/api/tests/integration/test_job_search_preferences_ownership.py"
Task: "Add extension logout/user switch test in apps/extension/src/store/popupStore.test.ts"
Task: "Add AI filter compatibility assertion in apps/api/tests/integration/test_linkedin_ai_filters_compatibility.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate: start capture with `react typescript remoto`, reopen Search, confirm last search and saved badges.
5. Stop and demo if a minimal saved-search improvement is enough.

### Incremental Delivery

1. Setup + Foundational -> persistence and contracts ready.
2. US1 -> last search and capture-time merge.
3. US2 -> badge quick access and manual deletion.
4. US3 -> ownership and compatibility hardening.
5. Polish -> docs, quickstart, regression validation.

### Validation Commands

```bash
docker compose exec api python -m compileall app alembic
docker compose exec api python -m pytest tests/contract/test_job_search_preferences_contract.py tests/contract/test_job_search_runs_contract.py tests/integration/test_job_search_preferences.py tests/integration/test_job_search_preferences_ownership.py tests/integration/test_linkedin_ai_filters_compatibility.py

cd apps/extension
npm run typecheck
npm run build
```

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks.
- `[US1]`, `[US2]`, and `[US3]` labels map to the prioritized user stories in `spec.md`.
- Preserve current capture feedback and AI filter state while adding preference persistence.
- Do not reintroduce external job source UI, configs, provider code, or automated email discovery.
- Do not implement ATS resume generation in this feature.
