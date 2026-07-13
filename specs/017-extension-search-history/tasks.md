# Tasks: Extension Search History

**Input**: Design documents from `specs/017-extension-search-history/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.md`, `contracts/extension-ui.md`, `quickstart.md`

**Tests**: Included because the feature spec defines independent tests and this change touches persistence, owner-scoped API contracts, and extension UI behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Generate `specs/017-extension-search-history/tasks.md` from the clarified and refreshed plan for a Full-time extension History tab with 20 recent LinkedIn Search runs plus date-independent best-keyword ranking.

> Refresh `docs/handoff.md` whenever implementation status changes materially or work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks in the same phase.
- **[Story]**: Maps to the user stories in `spec.md`.
- Every task includes exact file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the working branch context and confirm current feature artifacts before implementation.

- [X] T001 Verify `.specify/feature.json` points to `specs/017-extension-search-history` and note CRLF script limitation in `docs/handoff.md`
- [X] T002 [P] Review current `job_search_runs` model/schema/service surfaces in `apps/api/app/models/job_search_run.py`, `apps/api/app/schemas/job_search_run.py`, and `apps/api/app/services/job_search_run_service.py`
- [X] T003 [P] Review current extension navigation/store/API surfaces in `apps/extension/src/components/popup/TabNav.tsx`, `apps/extension/src/store/popupStore.ts`, `apps/extension/src/api/types.ts`, and `apps/extension/src/api/client.ts`
- [X] T004 [P] Review LinkedIn capture raw post count availability in `apps/extension/contents/linkedin-search.ts`, `apps/extension/background.ts`, and `apps/extension/src/capture/types.ts`
- [X] T005 [P] Review existing run tests for extension and API patterns in `apps/api/tests/contract/test_job_search_runs_contract.py`, `apps/api/tests/integration/test_job_search_runs_api.py`, and `apps/extension/src/store/popupStore.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add raw-count persistence and shared API/extension types required by all user stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T006 Add nullable `raw_linkedin_result_count` and optional source/provenance column to `job_search_runs` in `apps/api/alembic/versions/021_extension_search_history.py`
- [X] T007 Update `JobSearchRun` SQLAlchemy model with nullable raw count fields in `apps/api/app/models/job_search_run.py`
- [X] T008 Update Pydantic create/read schemas for optional `raw_linkedin_result_count` in `apps/api/app/schemas/job_search_run.py`
- [X] T009 Update `create_job_search_run` to persist optional raw count without deriving it from outcome counters in `apps/api/app/services/job_search_run_service.py`
- [X] T010 Ensure `reconcile_run_counters` and worker updates preserve existing non-null raw counts in `apps/api/app/services/job_search_run_service.py` and `apps/worker/app/jobs/linkedin_job_search.py`
- [ ] T011 [P] Add API schema unit coverage for nullable raw count and historical null values in `apps/api/tests/unit/test_linkedin_runs_e2e_schema.py`
- [ ] T012 [P] Add API migration coverage for nullable raw count/backward compatibility in `apps/api/tests/integration/test_linkedin_provider_migration.py`
- [X] T013 Update extension `JobSearchRunCreate` and `JobSearchRun` types with `raw_linkedin_result_count` in `apps/extension/src/api/types.ts`
- [X] T014 Update extension API client payload handling for raw count in `apps/extension/src/api/client.ts`
- [X] T015 Add a shared formatter/helper for unknown raw counts and compact numeric labels in `apps/extension/src/utils/searchHistory.ts`
- [X] T016 [P] Add unit tests for raw-count formatting helpers in `apps/extension/src/utils/searchHistory.test.ts`
- [X] T017 Run focused API schema/migration tests documented in `specs/017-extension-search-history/quickstart.md`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Review Recent Search Runs (Priority: P1) MVP

**Goal**: The operator can open History and review the 20 most recent LinkedIn Search runs with query, tokens, status, raw LinkedIn result count, outcome counters, and safe diagnostics.

**Independent Test**: Run two LinkedIn searches from the extension Search tab using different text, then open History and verify both appear within the 20-run list with query text, timestamp, status, raw count, accepted, rejected, and duplicate counts.

### Tests for User Story 1

- [X] T018 [P] [US1] Add API contract test for `GET /job-search-runs/linkedin/history` returning at most 20 LinkedIn runs in `apps/api/tests/contract/test_search_history_contract.py`
- [X] T019 [P] [US1] Add API integration test for owner-scoped 20-run history and career-page exclusion in `apps/api/tests/integration/test_search_history_api.py`
- [X] T020 [P] [US1] Add extension store/client test for loading History response in `apps/extension/src/store/popupStore.test.ts`
- [X] T021 [P] [US1] Add extension component test for recent-run rendering and unknown raw counts in `apps/extension/src/components/popup/SearchHistoryView.test.tsx`

### Implementation for User Story 1

- [X] T022 [US1] Create `SearchHistoryRun` and `SearchHistoryResponse` response schemas in `apps/api/app/schemas/job_search_run.py`
- [X] T023 [US1] Implement service query for 20 most recent owner-scoped LinkedIn runs in `apps/api/app/services/job_search_run_service.py`
- [X] T024 [US1] Add `GET /job-search-runs/linkedin/history` route returning recent runs in `apps/api/app/api/routes/job_search_runs.py`
- [X] T025 [US1] Capture and send the extension-discovered raw LinkedIn result count when creating authenticated browser runs in `apps/extension/background.ts`
- [X] T026 [US1] Ensure LinkedIn content capture exposes captured/discovered post count consistently in `apps/extension/contents/linkedin-search.ts` and `apps/extension/src/capture/types.ts`
- [X] T027 [US1] Add `history` to `PopupTab` state and default-safe tab handling in `apps/extension/src/store/popupStore.ts`
- [X] T028 [US1] Add `listSearchHistory` API client method in `apps/extension/src/api/client.ts`
- [X] T029 [US1] Implement History data loading state/actions in `apps/extension/src/store/popupStore.ts`
- [X] T030 [US1] Add History tab to authenticated popup navigation in `apps/extension/src/components/popup/TabNav.tsx`
- [X] T031 [US1] Render `SearchHistoryView` for the `history` tab in `apps/extension/src/components/popup/PopupContent.tsx`
- [X] T032 [US1] Create compact recent-run list UI in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [X] T033 [US1] Add History view styles without card-heavy layout in `apps/extension/src/styles/popup.css`
- [X] T034 [US1] Wire safe loading, empty, and error states in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [X] T035 [US1] Run US1 API and extension focused tests listed in `specs/017-extension-search-history/quickstart.md`

**Checkpoint**: MVP recent-run History is functional and independently testable.

---

## Phase 4: User Story 2 - Compare Keyword and Query Productivity (Priority: P1)

**Goal**: The operator can compare exact queries and keyword tokens by raw LinkedIn results, with a date-independent best-keyword ranking below the 20-run list and duplicate counts kept separate.

**Independent Test**: Run the same keyword twice where the second run produces duplicate opportunities. Verify the keyword aggregate increments frequency and total raw results for both runs while duplicate count remains separate.

### Tests for User Story 2

- [X] T036 [P] [US2] Add API contract test for `query_aggregates` and `keyword_aggregates` fields in `apps/api/tests/contract/test_search_history_contract.py`
- [X] T037 [P] [US2] Add API integration test proving duplicate-heavy repeated runs increase raw totals without subtracting duplicates in `apps/api/tests/integration/test_search_history_aggregates.py`
- [X] T038 [P] [US2] Add API integration test for unknown raw counts excluded from averages in `apps/api/tests/integration/test_search_history_aggregates.py`
- [X] T039 [P] [US2] Add extension component test for date-independent keyword ranking below the recent-run list in `apps/extension/src/components/popup/SearchHistoryView.test.tsx`

### Implementation for User Story 2

- [X] T040 [US2] Add aggregate response schemas for query and keyword rankings in `apps/api/app/schemas/job_search_run.py`
- [X] T041 [US2] Implement token normalization and per-run token dedupe helper in `apps/api/app/services/job_search_run_service.py`
- [X] T042 [US2] Implement exact-query aggregate query with null-aware raw totals/averages in `apps/api/app/services/job_search_run_service.py`
- [X] T043 [US2] Implement date-independent keyword aggregate query sorted by total known raw LinkedIn results in `apps/api/app/services/job_search_run_service.py`
- [X] T044 [US2] Extend `GET /job-search-runs/linkedin/history` to include query and keyword aggregates in `apps/api/app/api/routes/job_search_runs.py`
- [X] T045 [US2] Extend extension API types for aggregate rows in `apps/extension/src/api/types.ts`
- [X] T046 [US2] Render exact-query aggregate section in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [X] T047 [US2] Render best-keyword ranking below the 20-run list in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [X] T048 [US2] Label unknown raw-count runs and average behavior in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [X] T049 [US2] Add compact aggregate styles in `apps/extension/src/styles/popup.css`
- [X] T050 [US2] Run aggregate API and extension tests listed in `specs/017-extension-search-history/quickstart.md`

**Checkpoint**: Keyword/query productivity comparison works without penalizing repeated duplicate-heavy searches.

---

## Phase 5: User Story 3 - Inspect a Search Run's Evidence (Priority: P2)

**Goal**: The operator can inspect a history entry enough to understand useful opportunities, duplicates, rejects, AI-filter rejects, and provider/capture issues through existing diagnostics.

**Independent Test**: Open a completed history entry and verify links/details expose run, candidates, opportunities, status, counters, stop reason, diagnostics, and AI-filter counters without leaking secrets.

### Tests for User Story 3

- [ ] T051 [P] [US3] Add API contract test for safe diagnostic fields in history runs in `apps/api/tests/contract/test_search_history_contract.py`
- [ ] T052 [P] [US3] Add extension component test for expanded run diagnostics and detail links in `apps/extension/src/components/popup/SearchHistoryView.test.tsx`

### Implementation for User Story 3

- [X] T053 [US3] Add safe diagnostic construction for failed/partial runs in `apps/api/app/services/job_search_run_service.py`
- [X] T054 [US3] Include AI filter counters and stop/provider diagnostics in history run response in `apps/api/app/schemas/job_search_run.py`
- [ ] T055 [US3] Add run/candidates/opportunities detail link affordances in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [ ] T056 [US3] Add expandable secondary diagnostics for AI counters and safe errors in `apps/extension/src/components/popup/SearchHistoryView.tsx`
- [ ] T057 [US3] Add secret-leak guard assertions for diagnostics in `apps/api/tests/contract/test_search_history_contract.py`
- [ ] T058 [US3] Run US3 focused tests in `apps/api/tests/contract/test_search_history_contract.py` and `apps/extension/src/components/popup/SearchHistoryView.test.tsx`

**Checkpoint**: History diagnostics are useful, safe, and linked to existing evidence surfaces.

---

## Phase 6: User Story 4 - Keep Freelance Web Separate (Priority: P3)

**Goal**: The Full-time extension History feature does not change Freelance web app data, schema, leads, outreach, Email, WhatsApp, or provider configuration.

**Independent Test**: Navigate the Freelance web app and verify no Search History UI, schema dependency, or outreach behavior was introduced there.

### Tests for User Story 4

- [ ] T059 [P] [US4] Add guard test or static check proving no `apps/web` Search History UI/imports were added in `apps/web/tests/unit/full-time-isolation.test.ts`
- [X] T060 [P] [US4] Add API/extension scope regression covering career-page exclusion and Freelance untouched behavior in `apps/api/tests/integration/test_search_history_api.py`

### Implementation for User Story 4

- [X] T061 [US4] Verify no Prisma schema or migration changes were made in `apps/web/prisma/schema.prisma`
- [X] T062 [US4] Verify no Freelance route or component imports Search History code in `apps/web/app/`
- [X] T063 [US4] Document Full-time-only boundary in `docs/search-improvements.md`
- [X] T064 [US4] Run existing Freelance web focused checks referenced in `docs/handoff.md` if `apps/web` was touched; otherwise record not touched in `docs/handoff.md`

**Checkpoint**: Freelance web lane remains isolated from Full-time extension history.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, docs, and handoff after all desired stories are complete.

- [X] T065 [P] Update `docs/search-improvements.md` with implemented raw LinkedIn history behavior and keyword ranking boundary
- [X] T066 [P] Update `docs/plasmo-extension-usage.md` with the History tab workflow and unknown raw-count behavior
- [X] T067 [P] Update `docs/roadmap.md` with `017-extension-search-history` implementation status
- [X] T068 Update `docs/handoff.md` with current phase, completed tasks, validation results, CRLF script limitation, and next step
- [X] T069 Update `docs/next-spec-prompt.md` with the next recommended Spec Kit prompt after implementation
- [X] T070 [P] Run API focused tests from `specs/017-extension-search-history/quickstart.md`
- [X] T071 [P] Run extension typecheck and focused tests from `specs/017-extension-search-history/quickstart.md`
- [X] T072 [P] Run guard search to confirm no `apps/web` Search History coupling in `apps/web/` and record result in `docs/handoff.md`
- [ ] T073 Perform manual smoke from `specs/017-extension-search-history/quickstart.md` against local API/extension if environment is available
- [X] T074 Review `specs/017-extension-search-history/contracts/api.md` and `specs/017-extension-search-history/contracts/extension-ui.md` against implemented behavior
- [X] T075 Confirm all tasks completed or intentionally deferred in `specs/017-extension-search-history/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundation; MVP recent-run History.
- **US2 (Phase 4)**: Depends on Foundation and benefits from US1 UI shell; completes P1 productivity comparison.
- **US3 (Phase 5)**: Depends on US1 response/UI shell; enriches diagnostics.
- **US4 (Phase 6)**: Can start after Foundation but final verification should run after US1-US3 implementation.
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 Review Recent Search Runs (P1)**: MVP; no dependency on other user stories after Foundation.
- **US2 Compare Keyword and Query Productivity (P1)**: Requires aggregate service and can share the History view shell from US1.
- **US3 Inspect Evidence (P2)**: Requires recent run rows from US1; adds details and safe diagnostics.
- **US4 Keep Freelance Web Separate (P3)**: Independent verification lane, final check after implementation.

### Parallel Opportunities

- Setup review tasks T002-T005 can run in parallel.
- Foundation test tasks T011-T012 and extension helper task T016 can run in parallel after schema shape is known.
- US1 tests T018-T021 can be written in parallel before implementation.
- US2 tests T036-T039 can be written in parallel before aggregate implementation.
- US3 tests T051-T052 can be written in parallel before diagnostic implementation.
- US4 guard tests T059-T060 can be written in parallel with US3.
- Polish docs T065-T067 and validation T070-T072 can run in parallel where tooling allows.

---

## Parallel Example: User Story 1

```text
Task: "Add API contract test for GET /job-search-runs/linkedin/history returning at most 20 LinkedIn runs in apps/api/tests/contract/test_search_history_contract.py"
Task: "Add API integration test for owner-scoped 20-run history and career-page exclusion in apps/api/tests/integration/test_search_history_api.py"
Task: "Add extension store/client test for loading History response in apps/extension/src/store/popupStore.test.ts"
Task: "Add extension component test for recent-run rendering and unknown raw counts in apps/extension/src/components/popup/SearchHistoryView.test.tsx"
```

## Parallel Example: User Story 2

```text
Task: "Add API integration test proving duplicate-heavy repeated runs increase raw totals without subtracting duplicates in apps/api/tests/integration/test_search_history_aggregates.py"
Task: "Add API integration test for unknown raw counts excluded from averages in apps/api/tests/integration/test_search_history_aggregates.py"
Task: "Add extension component test for date-independent keyword ranking below the recent-run list in apps/extension/src/components/popup/SearchHistoryView.test.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Implement US1 recent-run History list.
3. Validate with API contract/integration tests and extension component/store tests.
4. Stop and confirm the operator can see the 20 most recent LinkedIn Search runs with raw counts and outcome counters.

### Full P1 Delivery (US1 + US2)

1. Complete MVP recent-run list.
2. Add query and keyword aggregates.
3. Confirm best-keyword ranking is date-independent and duplicate counts remain separate.
4. Validate unknown historical raw counts are not treated as zero.

### Incremental Delivery

1. US1 -> Recent run history.
2. US2 -> Productivity ranking.
3. US3 -> Evidence/diagnostic detail.
4. US4 -> Isolation verification.
5. Polish -> Docs, quickstart, and final smoke.

---

## Notes

- The official Spec Kit prerequisite script currently fails in this Windows workspace because CRLF line endings are interpreted by Bash; use `.specify/feature.json` to resolve the active feature until scripts are normalized.
- Do not derive raw LinkedIn counts from accepted/rejected/duplicate/AI counters.
- Do not backfill historical raw counts to zero.
- Do not change `apps/web` Freelance schema, routes, components, provider settings, Email, WhatsApp, leads, or outreach behavior.
- Keep the extension UI compact and operational; avoid landing-page or decorative card-heavy treatment.