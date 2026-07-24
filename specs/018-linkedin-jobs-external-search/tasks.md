# Tasks: Full-time LinkedIn Jobs External Search

**Input**: Design documents from `specs/018-linkedin-jobs-external-search/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include focused contract, integration, unit, extension component/store, and manual smoke tasks because the spec and quickstart require measurable behavior, compatibility guards, and real LinkedIn validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Generate dependency-ordered `/speckit-tasks` for `Full-time LinkedIn Jobs External Search`, using the spec and plan where the extension owns LinkedIn browser navigation/inspection and API/worker own persistence, dedupe, validation, diagnostics, and shared utilities.

> Refresh `docs/handoff.md`, `docs/roadmap.md`, and `docs/next-spec-prompt.md` whenever implementation status changes materially or work is being handed off.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label for story phases only
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared source constants, URL utilities, and fixture scaffolding used by every story.

- [X] T001 Audit existing career-page source definitions and URL matching behavior in `apps/worker/app/services/career_page_sources.py` and document reusable source keys in `specs/018-linkedin-jobs-external-search/research.md`
- [X] T002 [P] Add or prepare shared curated source registry tests for current sources and optional Teamtailor in `apps/worker/tests/unit/test_career_page_sources.py`
- [X] T003 [P] Add extension URL utility test fixtures for LinkedIn safety redirects, ATS URLs, Easy Apply-only cards, and unsupported sources in `apps/extension/src/capture/linkedin-jobs.fixtures.ts`
- [X] T004 [P] Add API test fixtures for LinkedIn Jobs external run/candidate payloads in `apps/api/tests/fixtures/linkedin_jobs_external.py`
- [X] T005 [P] Add extension API type placeholders for LinkedIn Jobs external run requests, progress, candidate outcomes, and diagnostics in `apps/extension/src/api/types.ts`
- [X] T006 [P] Add backend schema type placeholders for LinkedIn Jobs external run requests, progress, candidate outcomes, and diagnostics in `apps/api/app/schemas/job_search_run.py`
- [X] T007 Confirm no `apps/web` files are part of this feature by adding a guard note to `specs/018-linkedin-jobs-external-search/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data, contracts, and shared logic that must exist before user stories can be implemented.

**CRITICAL**: No user story implementation should start until this phase is complete.

- [X] T008 Implement shared curated external source registry or adapter export usable by career-page search and LinkedIn Jobs matching in `apps/worker/app/services/career_page_sources.py`
- [X] T009 [P] Implement canonical external application URL normalization and LinkedIn safety redirect decoding utilities in `apps/worker/app/services/external_job_normalizer.py`
- [X] T010 [P] Add unit tests for canonical URL normalization, redirect decoding, selected-source matching, unsupported-source rejection, and Teamtailor gating in `apps/worker/tests/unit/test_external_job_normalizer.py`
- [X] T011 Add additive migration for LinkedIn Jobs external run fields/counters only if existing JSON fields are insufficient in `apps/api/alembic/versions/022_linkedin_jobs_external_search.py`
- [X] T012 Update job search run ORM fields or JSON mapping for `linkedin_jobs_external`, source selections, max pages, navigation method, terminal reason, and diagnostics in `apps/api/app/models/job_search_run.py`
- [X] T013 Update job search candidate/opportunity model mapping only as needed for LinkedIn job URL, decoded apply URL, source key, and candidate outcome in `apps/api/app/models/job_search_run.py` and `apps/api/app/models/opportunity.py`
- [X] T014 Update API schemas for run create/progress/candidate/finalize/latest responses in `apps/api/app/schemas/job_search_run.py`
- [X] T015 Update opportunity schemas to preserve `external_application` lane compatibility and source evidence fields in `apps/api/app/schemas/opportunity.py`
- [X] T016 Add contract tests for LinkedIn Jobs external run create, max page validation, selected source validation, and no LinkedIn credential input in `apps/api/tests/contract/test_linkedin_jobs_external_contract.py`
- [X] T017 [P] Add integration tests for owner isolation across run create/progress/candidate/finalize/latest in `apps/api/tests/integration/test_linkedin_jobs_external_ownership.py`
- [X] T018 Implement API service methods for creating, updating, finalizing, and retrieving LinkedIn Jobs external runs in `apps/api/app/services/job_search_run_service.py`
- [X] T019 Implement API service method for accepting or rejecting inspected LinkedIn Jobs candidates with canonical URL dedupe in `apps/api/app/services/opportunity_service.py`
- [X] T020 Wire LinkedIn Jobs external endpoints into `apps/api/app/api/routes/job_search_runs.py`
- [X] T021 Expose shared curated external source list through the existing or new API route in `apps/api/app/api/routes/job_search_runs.py`
- [X] T022 Update extension API client methods for create run, progress update, submit candidate, finalize run, latest run, and curated sources in `apps/extension/src/api/client.ts`
- [X] T023 Update extension popup store state/actions for external job sources, LinkedIn Jobs run settings, progress, active run, and terminal diagnostics in `apps/extension/src/store/popupStore.ts`
- [X] T024 [P] Add popup store tests for max pages validation, active-run guard, source selection reuse, progress updates, and terminal reset in `apps/extension/src/store/popupStore.test.ts`
- [X] T025 [P] Add extension capture utility tests for URL building, direct navigation mode labels, redirect decoding, source matching, and outcome mapping in `apps/extension/src/capture/linkedin.test.ts`

**Checkpoint**: Backend contracts, shared URL/source logic, and extension state/client are ready for user story work.

---

## Phase 3: User Story 1 - Run LinkedIn Jobs External Search (Priority: P1) MVP

**Goal**: Start a default LinkedIn Jobs external search, inspect jobs in the logged-in browser tab, skip Easy Apply, save curated external URLs, dedupe duplicates, and show terminal diagnostics.

**Independent Test**: Log into LinkedIn and the extension, run LinkedIn Jobs external search with no keywords and max pages 1, confirm accepted curated URLs appear in `External applications`, Easy Apply jobs are skipped, duplicates are counted, and diagnostics are terminal.

### Tests for User Story 1

- [X] T026 [P] [US1] Add API integration test for accepted LinkedIn Jobs candidate creating an `external_application` opportunity in `apps/api/tests/integration/test_linkedin_jobs_external_pipeline.py`
- [X] T027 [P] [US1] Add API integration test for duplicate canonical apply URL returning duplicate outcome without creating a new opportunity in `apps/api/tests/integration/test_linkedin_jobs_external_pipeline.py`
- [X] T028 [P] [US1] Add API integration test that Easy Apply, missing external apply, unsupported source, and failed decode outcomes do not create opportunities in `apps/api/tests/integration/test_linkedin_jobs_external_pipeline.py`
- [X] T029 [P] [US1] Add extension capture tests for card inspection outcomes and counters in `apps/extension/src/capture/linkedin.test.ts`
- [X] T030 [P] [US1] Add extension Search UI test for starting default LinkedIn Jobs search with no keywords and rendering default-browse helper text in `apps/extension/src/components/popup/SearchView.test.tsx`

### Implementation for User Story 1

- [X] T031 [US1] Implement LinkedIn Jobs search URL builder for default browse, classic base URL, max pages metadata, and navigation method output in `apps/extension/src/capture/linkedin.ts`
- [X] T032 [US1] Implement LinkedIn Jobs tab opening/focusing and renderable-results wait flow in `apps/extension/contents/linkedin-search.ts`
- [X] T033 [US1] Implement LinkedIn Jobs result list scrolling and pagination loop up to `maxPages` in `apps/extension/contents/linkedin-search.ts`
- [X] T034 [US1] Implement job card selection, detail panel wait, apply button detection, Easy Apply classification, and missing-apply classification in `apps/extension/contents/linkedin-search.ts`
- [X] T035 [US1] Implement external apply href capture, LinkedIn safety redirect decoding, canonical URL generation, and selected-source matching in `apps/extension/src/capture/linkedin.ts`
- [X] T036 [US1] Implement candidate submission for accepted/skipped/duplicate/failure outcomes through `apps/extension/src/api/client.ts`
- [X] T037 [US1] Implement run progress and terminal finalize calls with pages visited, jobs inspected, external links found, accepted, skipped Easy Apply, unsupported source, duplicates, failures, navigation method, and terminal reason in `apps/extension/src/store/popupStore.ts`
- [X] T038 [US1] Implement backend accepted opportunity creation with `job_application_kind=external_application`, LinkedIn Jobs source evidence, LinkedIn job URL, decoded application URL, and default job stage in `apps/api/app/services/opportunity_service.py`
- [X] T039 [US1] Implement backend candidate outcome persistence and run counter reconciliation in `apps/api/app/services/job_search_run_service.py`
- [X] T040 [US1] Add LinkedIn Jobs latest/active run diagnostics rendering inside the External jobs area in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T041 [US1] Ensure accepted LinkedIn Jobs opportunities appear in the existing Jobs `External applications` lane without Gmail send actions in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T042 [US1] Add safe terminal and error messages for login required, no renderable results, no next page, navigation failed, and DOM inspection failed in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T043 [US1] Run focused API tests for LinkedIn Jobs external pipeline and external applications in `apps/api/tests/integration/test_linkedin_jobs_external_pipeline.py` and `apps/api/tests/integration/test_external_application_jobs.py`
- [X] T044 [US1] Run focused extension tests for LinkedIn Jobs capture, popup store, and Search UI in `apps/extension/src/capture/linkedin.test.ts`, `apps/extension/src/store/popupStore.test.ts`, and `apps/extension/src/components/popup/SearchView.test.tsx`

**Checkpoint**: User Story 1 is independently functional and is the MVP.

---

## Phase 4: User Story 2 - Search By Operator Keywords (Priority: P2)

**Goal**: Use operator-entered search text and saved keyword badges for classic LinkedIn Jobs search, preserving OR-style intent and remote/hybrid terms in evidence.

**Independent Test**: Enter multiple terms, start LinkedIn Jobs external search, and confirm the run evidence records keyword terms, search mode, date/sort choices, and source query while accepted URLs still use deterministic save rules.

### Tests for User Story 2

- [X] T045 [P] [US2] Add API contract test for classic keyword request payload with query terms, date posted, sort, selected sources, and max pages in `apps/api/tests/contract/test_linkedin_jobs_external_contract.py`
- [X] T046 [P] [US2] Add extension utility tests for OR-style query generation and remote/hybrid term preservation in `apps/extension/src/capture/linkedin.test.ts`
- [X] T047 [P] [US2] Add Search UI test for saved keyword reuse and classic LinkedIn Jobs date/sort controls in `apps/extension/src/components/popup/SearchView.test.tsx`

### Implementation for User Story 2

- [X] T048 [US2] Implement classic LinkedIn Jobs query term parsing from current search text and saved keyword interactions in `apps/extension/src/capture/linkedin.ts`
- [X] T049 [US2] Implement URL/query construction for OR-style keyword search, date posted, sort, and no hardcoded geography in `apps/extension/src/capture/linkedin.ts`
- [X] T050 [US2] Add LinkedIn Jobs date posted and sort controls scoped to classic mode in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T051 [US2] Persist LinkedIn Jobs search text, selected sources, date, sort, and max pages in popup store without changing existing LinkedIn post saved-keyword behavior in `apps/extension/src/store/popupStore.ts`
- [X] T052 [US2] Persist classic search intent and source evidence in run/candidate/opportunity records in `apps/api/app/services/job_search_run_service.py` and `apps/api/app/services/opportunity_service.py`
- [X] T053 [US2] Add run detail/latest response fields for search mode, query terms, date posted, sort, and navigation method in `apps/api/app/schemas/job_search_run.py`
- [X] T054 [US2] Update diagnostics UI to show classic search intent and selected filters without implying LinkedIn guaranteed geography behavior in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T055 [US2] Run focused API and extension tests for classic keyword mode in `apps/api/tests/contract/test_linkedin_jobs_external_contract.py` and `apps/extension/src/components/popup/SearchView.test.tsx`

**Checkpoint**: User Story 2 works independently after foundation and can be demoed without assisted mode.

---

## Phase 5: User Story 3 - Keep Search Types Clear (Priority: P3)

**Goal**: Reorganize Search into clear `External jobs` and `LinkedIn posts` tabs so controls are scoped to the correct search type and existing workflows remain intact.

**Independent Test**: Open Search and verify `External jobs` contains career-page plus LinkedIn Jobs controls, while `LinkedIn posts` contains post capture and post AI filters with existing behavior unchanged.

### Tests for User Story 3

- [X] T056 [P] [US3] Add Search UI tests for `External jobs` and `LinkedIn posts` tab rendering and scoped controls in `apps/extension/src/components/popup/SearchView.test.tsx`
- [X] T057 [P] [US3] Add regression tests that existing LinkedIn post capture controls and AI filters still submit existing payloads in `apps/extension/src/components/popup/SearchView.test.tsx`
- [X] T058 [P] [US3] Add regression tests that existing career-page search controls still use shared source selections in `apps/extension/src/components/popup/SearchView.test.tsx`

### Implementation for User Story 3

- [X] T059 [US3] Refactor `SearchView` into internal sections for `ExternalJobsSearchPanel` and `LinkedInPostsSearchPanel` in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T060 [US3] Add compact tab state for `External jobs` and `LinkedIn posts` without disrupting top-level popup navigation in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T061 [US3] Move existing career-page search controls and source checkboxes into the External jobs section in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T062 [US3] Move existing LinkedIn post capture and post AI filter controls into the LinkedIn posts section in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T063 [US3] Ensure unrelated disabled controls are hidden or explained so date/sort/source controls do not appear to affect LinkedIn post capture in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T064 [US3] Update popup styles for compact nested Search tabs, stable control dimensions, and no text overlap in `apps/extension/src/styles/popup.css`
- [X] T065 [US3] Update API client/store references only as needed to preserve existing career-page and LinkedIn post actions in `apps/extension/src/api/client.ts` and `apps/extension/src/store/popupStore.ts`
- [X] T066 [US3] Run extension typecheck and focused Search UI regression tests in `apps/extension`

**Checkpoint**: User Story 3 keeps old Search behavior intact while making the new source understandable.

---

## Phase 6: User Story 4 - Use LinkedIn Assisted Jobs Mode (Priority: P4)

**Goal**: Offer best-effort assisted LinkedIn Jobs mode with clear limitations and the same deterministic external URL acceptance rules.

**Independent Test**: Enable assisted mode, confirm date/sort are disabled or explained, start a run, and verify it navigates to assisted Jobs or gracefully reports an assisted navigation terminal reason.

### Tests for User Story 4

- [X] T067 [P] [US4] Add Search UI test for assisted mode disabling or explaining date/sort controls in `apps/extension/src/components/popup/SearchView.test.tsx`
- [X] T068 [P] [US4] Add capture tests for assisted navigation method, fallback terminal reason, and deterministic accept/skip rules in `apps/extension/src/capture/linkedin.test.ts`
- [X] T069 [P] [US4] Add API contract test for assisted mode run creation and diagnostics fields in `apps/api/tests/contract/test_linkedin_jobs_external_contract.py`

### Implementation for User Story 4

- [X] T070 [US4] Add assisted mode checkbox, explanatory note, and scoped disabled date/sort behavior in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T071 [US4] Implement assisted navigation attempt with account-dependent direct or click-path behavior in `apps/extension/contents/linkedin-search.ts`
- [X] T072 [US4] Add assisted navigation terminal reasons such as `assisted_entry_unavailable` and `assisted_navigation_failed` in `apps/extension/src/capture/types.ts`
- [X] T073 [US4] Persist assisted mode, navigation method, and terminal reasons in run diagnostics through `apps/api/app/services/job_search_run_service.py`
- [X] T074 [US4] Ensure assisted mode still uses source allowlist, Easy Apply skipping, redirect decoding, canonical dedupe, and no AI quality filter in `apps/extension/src/capture/linkedin.ts`
- [X] T075 [US4] Run focused assisted mode API and extension tests in `apps/api/tests/contract/test_linkedin_jobs_external_contract.py` and `apps/extension/src/components/popup/SearchView.test.tsx`

**Checkpoint**: Assisted mode is optional, honest about limitations, and cannot bypass deterministic quality gates.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Compatibility, docs, manual smoke, and final validation across stories.

- [X] T076 [P] Add guard test that `apps/web` paths and Freelance Prisma migrations are untouched by this feature in `apps/api/tests/integration/test_linkedin_jobs_external_freelance_isolation.py`
- [X] T077 [P] Add guard test that LinkedIn Jobs external search does not create Gmail drafts, send requests, email events, or WhatsApp/outreach events in `apps/api/tests/integration/test_linkedin_jobs_external_no_outreach.py`
- [X] T078 [P] Add regression test that Search History still excludes or clearly separates LinkedIn Jobs external runs from LinkedIn post history in `apps/api/tests/integration/test_job_search_runs_api.py`
- [X] T079 [P] Add regression test that career-page search still works with shared source keys after source registry refactor in `apps/api/tests/contract/test_career_page_search_contract.py`
- [X] T080 [P] Update implementation notes and validation commands in `specs/018-linkedin-jobs-external-search/quickstart.md`
- [X] T081 Update `docs/search-improvements.md` with implemented LinkedIn Jobs external search behavior, diagnostics, and deterministic no-AI quality gate
- [X] T082 Update `docs/handoff.md` with implementation status, validation results, remaining smoke tasks, and next recommended step
- [X] T083 Update `docs/roadmap.md` with delivered state or remaining implementation status for LinkedIn Jobs external search
- [X] T084 Prepare the next Spec Kit prompt in `docs/next-spec-prompt.md` after implementation, preserving History Drilldown and Freelance discovery as backlog where appropriate
- [X] T085 Run API focused tests for LinkedIn Jobs external search, career-page compatibility, external applications, Search History, no outreach, and Freelance isolation in `apps/api`
- [X] T086 Run worker focused tests for source registry and URL normalization compatibility in `apps/worker`
- [X] T087 Run extension focused tests and `npm.cmd run typecheck` in `apps/extension`
- [X] T088 Run extension build in `apps/extension`
- [ ] T089 Manually smoke direct LinkedIn Jobs URL behavior without hardcoded geography and record result in `specs/018-linkedin-jobs-external-search/quickstart.md`
- [ ] T090 Manually smoke direct LinkedIn Jobs URL with any required geoId only if needed and record whether it is reliable in `specs/018-linkedin-jobs-external-search/quickstart.md`
- [ ] T091 Manually smoke fallback navigation by clicking through LinkedIn Jobs from home/feed and record result in `specs/018-linkedin-jobs-external-search/quickstart.md`
- [ ] T092 Manually smoke a max-pages-1 run with mixed Easy Apply, unsupported source, duplicate, and accepted source outcomes and record counters in `docs/handoff.md`
- [ ] T093 Manually verify accepted opportunities appear in `External applications` and can be marked applied through the existing flow in `docs/handoff.md`
- [X] T094 Run `rg "linkedin_jobs_external|LinkedIn Jobs|linkedin-jobs" apps\\web` and document no unintended Freelance coupling in `docs/handoff.md`
- [X] T095 Review generated diagnostics for secrets/cookies/raw HTML leakage and document result in `docs/handoff.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundation; MVP path.
- **US2 (Phase 4)**: Depends on Foundation and reuses US1 run/persistence flow.
- **US3 (Phase 5)**: Depends on Foundation; can proceed in parallel with US1/US2 after shared store/API contracts are stable, but final validation depends on US1 controls.
- **US4 (Phase 6)**: Depends on Foundation and US1 capture flow.
- **Polish (Phase 7)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: Required MVP; no dependency on US2-US4.
- **US2**: Adds classic keyword/date/sort behavior on top of US1 run mechanics.
- **US3**: Mostly UI organization; can be developed after Foundation but must regression-test existing Search flows.
- **US4**: Optional assisted mode; should come after US1 so deterministic acceptance rules are already proven.

### Parallel Opportunities

- Setup fixture/test scaffolding tasks T002-T006 can run in parallel.
- Foundation tests T016-T017, T024-T025 can run in parallel with schema/model work once interfaces are agreed.
- US1 tests T026-T030 can be written in parallel before implementation.
- US2 tests T045-T047 can run in parallel.
- US3 tests T056-T058 can run in parallel.
- US4 tests T067-T069 can run in parallel.
- Polish guard/doc tasks T076-T080 can run in parallel after story implementation.

---

## Parallel Example: User Story 1

```text
Task: "T026 Add API integration test for accepted LinkedIn Jobs candidate creating an external_application opportunity"
Task: "T027 Add API integration test for duplicate canonical apply URL"
Task: "T028 Add API integration test for rejected outcomes not creating opportunities"
Task: "T029 Add extension capture tests for card inspection outcomes and counters"
Task: "T030 Add extension Search UI test for default browse"
```

## Parallel Example: User Story 3

```text
Task: "T056 Add Search UI tests for External jobs and LinkedIn posts tab rendering"
Task: "T057 Add regression tests for existing LinkedIn post capture and AI filters"
Task: "T058 Add regression tests for existing career-page search controls"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 US1.
4. Stop and validate: a no-keyword LinkedIn Jobs external search saves curated URLs into `External applications`, skips Easy Apply, dedupes repeats, and shows terminal diagnostics.

### Incremental Delivery

1. Foundation -> shared source/URL/backend contracts ready.
2. US1 -> default browse MVP with deterministic save/skip/dedupe.
3. US2 -> keyword/date/sort classic search.
4. US3 -> clearer tabbed Search UX and regression-safe old flows.
5. US4 -> assisted LinkedIn Jobs mode as optional best-effort.
6. Polish -> guard tests, docs, manual LinkedIn smoke, and final validation.

### Safety Notes

- Do not move LinkedIn authentication to the API or worker.
- Do not apply AI quality filters before saving LinkedIn Jobs external opportunities.
- Do not add accepted-opportunity caps.
- Do not introduce email, WhatsApp, outreach, cleanup, deletion, or Freelance behavior.
- Keep diagnostics safe: no LinkedIn cookies, tokens, raw credentials, or oversized DOM/HTML blobs.
