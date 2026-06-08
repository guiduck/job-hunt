# Tasks: Curated Career Page Search

**Input**: Design documents from `specs/013-serpapi-career-search/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are included because the spec defines independent tests, measurable success criteria, owner-scoped API behavior, worker pipeline behavior, extension UI state, and dashboard metrics that need regression coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/013-serpapi-career-search/plan.md`

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current implementation boundaries and provider assumptions before changing behavior.

- [X] T001 Inspect existing run creation, candidate serialization, and run latest lookup patterns in `apps/api/app/services/job_search_run_service.py`, `apps/api/app/schemas/job_search_run.py`, and `apps/api/app/api/router.py`
- [X] T002 Inspect current opportunities list, metrics, delete, and detail update behavior in `apps/api/app/services/opportunity_service.py`, `apps/api/app/schemas/opportunity.py`, and `apps/api/app/models/opportunity.py`
- [X] T003 Inspect existing worker LinkedIn pipeline persistence, dedupe, AI scoring, and lifecycle handling in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T004 [P] Inspect existing worker normalization/scoring helpers in `apps/worker/app/services/job_candidate_normalizer.py`, `apps/worker/app/services/job_review_analyzer.py`, `apps/worker/app/services/job_review_scoring.py`, and `apps/worker/app/services/job_ai_filter.py`
- [X] T005 [P] Inspect existing extension Search, Jobs, Dashboard, detail, API client, and popup store surfaces in `apps/extension/src/components/popup/SearchView.tsx`, `apps/extension/src/components/popup/JobsView.tsx`, `apps/extension/src/components/popup/DashboardView.tsx`, `apps/extension/src/components/popup/OpportunityDetail.tsx`, `apps/extension/src/api/client.ts`, and `apps/extension/src/store/popupStore.ts`
- [X] T006 [P] Inspect existing test helpers and auth fixtures in `apps/api/tests/conftest.py`, `apps/worker/tests/conftest.py`, and `apps/extension/src/store/popupStore.test.ts`
- [X] T007 Confirm exact environment variable names for the configured search provider key and external search caps in `apps/api/app/core/config.py`, `apps/worker/app/core/config.py`, and `docs/deployment-config-and-storage.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared schema, contracts, config, and typed surfaces required by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 [P] Add failing API contract tests for curated source listing and career-page run creation schemas in `apps/api/tests/contract/test_career_page_search_contract.py`
- [X] T009 [P] Add failing API migration/serialization tests for new career-page run and candidate metadata fields in `apps/api/tests/integration/test_career_page_search_migration.py`
- [X] T010 [P] Add failing worker unit tests for curated source config validation and query construction in `apps/worker/tests/unit/test_career_page_search_provider.py`
- [X] T011 [P] Add failing extension type/store tests for career-page source defaults, latest run state, and duplicate-run disable behavior in `apps/extension/src/store/popupStore.test.ts`
- [X] T012 Add additive Alembic migration for `job_search_runs` career-page metadata fields in `apps/api/alembic/versions/020_career_page_search.py`
- [X] T013 Add additive Alembic migration fields for career-page candidate metadata in `apps/api/alembic/versions/020_career_page_search.py`
- [X] T014 Add any additive opportunity detail fields required for `application_kind` or external source display in `apps/api/alembic/versions/020_career_page_search.py`
- [X] T015 Update `JobSearchRun`, `JobSearchCandidate`, and related enums for `search_kind`, selected sources, source diagnostics, stop reason, accepted limit, inspected cap, and career-page provider metadata in `apps/api/app/models/job_search_run.py`
- [X] T016 Update `JobOpportunityDetail` model for `application_kind` if a persisted field is chosen instead of deriving it from email/application URL in `apps/api/app/models/opportunity.py`
- [X] T017 Update Pydantic schemas for career-page run create/read, source metadata, candidate metadata, stop reasons, and application kind in `apps/api/app/schemas/job_search_run.py`
- [X] T018 Update opportunity schemas to expose `job_application_kind`, apply URL, external source metadata, and new metrics fields in `apps/api/app/schemas/opportunity.py`
- [X] T019 Create shared curated source definitions for API validation in `apps/api/app/services/career_page_sources.py`
- [X] T020 Create mirrored curated source definitions for worker provider queries in `apps/worker/app/services/career_page_sources.py`
- [X] T021 Add backend/worker config for search provider credentials, accepted opportunity max defaults, and inspected-candidate cap in `apps/api/app/core/config.py` and `apps/worker/app/core/config.py`
- [X] T022 Add extension API types for curated sources, career-page run creation, application kind, latest run response, and metrics fields in `apps/extension/src/api/types.ts`
- [X] T023 Add extension API client methods for curated source list, career-page run creation, latest career-page run, run polling, candidates, mark applied, and metrics in `apps/extension/src/api/client.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order.

---

## Phase 3: User Story 1 - Search Curated Career Pages (Priority: P1) MVP

**Goal**: A logged-in operator can start a fresh career-page search from `/search` using keywords, selected curated sources, max accepted opportunities, latest run state, disabled duplicate start, and no company/board/tenant input.

**Independent Test**: Enter `react frontend remoto`, keep at least one curated source selected, start career-page search, confirm a fresh owner-scoped run is created, the button disables while running, diagnostics show selected sources and counters, and resulting accepted opportunities contain source evidence plus an external URL without requiring company/board/tenant input.

### Tests for User Story 1

- [X] T024 [P] [US1] Add contract tests for `GET /job-search/curated-sources` in `apps/api/tests/contract/test_career_page_search_contract.py`
- [X] T025 [P] [US1] Add contract tests for `POST /job-search-runs/career-page` including selected sources, accepted max, duplicate active run conflict, and missing provider config in `apps/api/tests/contract/test_career_page_search_contract.py`
- [X] T026 [P] [US1] Add integration tests proving career-page run creation is owner-scoped and creates a fresh run on each click after previous terminal completion in `apps/api/tests/integration/test_career_page_search.py`
- [X] T027 [P] [US1] Add integration tests for selected source validation and all active source defaults in `apps/api/tests/integration/test_career_page_search.py`
- [X] T028 [P] [US1] Add worker unit tests for provider query generation per source without company/board/tenant input in `apps/worker/tests/unit/test_career_page_search_provider.py`
- [X] T029 [P] [US1] Add worker integration test for run lifecycle, selected source diagnostics, accepted max, inspected cap, and terminal stop reason in `apps/worker/tests/integration/test_career_page_search_pipeline.py`
- [X] T030 [P] [US1] Add extension store tests for source defaults, latest search timestamp, and active run disable behavior in `apps/extension/src/store/popupStore.test.ts`
- [X] T031 [P] [US1] Add extension component test or focused render test for career-page controls in `apps/extension/src/components/popup/SearchView.test.tsx`

### Implementation for User Story 1

- [X] T032 [US1] Implement `list_curated_career_sources` service behavior in `apps/api/app/services/career_page_sources.py`
- [X] T033 [US1] Implement `create_career_page_search_run` owner-scoped service with duplicate active-run guard in `apps/api/app/services/job_search_run_service.py`
- [X] T034 [US1] Implement latest run lookup by `search_kind=career_page` in `apps/api/app/services/job_search_run_service.py`
- [X] T035 [US1] Add curated source and career-page run endpoints in `apps/api/app/api/router.py` or the existing API route module
- [X] T036 [US1] Ensure career-page run creation returns 503 when provider key/config is unavailable without breaking LinkedIn run creation in `apps/api/app/services/job_search_run_service.py`
- [X] T037 [US1] Implement worker SerpApi-style provider adapter with per-source query generation in `apps/worker/app/services/career_page_search_provider.py`
- [X] T038 [US1] Implement external provider result shape and safe text extraction helpers in `apps/worker/app/services/career_page_search_provider.py`
- [X] T039 [US1] Implement career-page run polling/claiming and status lifecycle in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T040 [US1] Register career-page run processing in the worker loop in `apps/worker/app/main.py`
- [X] T041 [US1] Persist source-level diagnostics, provider status, counters, cap reached, and stop reason during worker processing in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T042 [US1] Persist accepted career-page opportunities and candidates with source evidence, source query, source URL, selected source key, and apply URL in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T043 [US1] Add structured log events for career-page provider start, source progress, candidate inspected, candidate accepted/rejected, cap reached, and run terminal state in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T044 [US1] Add popup store state/actions for curated sources, selected sources, latest career-page run, career-page run progress, and duplicate-start prevention in `apps/extension/src/store/popupStore.ts`
- [X] T045 [US1] Hydrate curated sources and latest career-page run after authenticated session validation in `apps/extension/src/store/popupStore.ts`
- [X] T046 [US1] Render career-page source checkboxes, latest search label, and separate career-page search button below LinkedIn search in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T047 [US1] Disable the career-page search button while a career-page run is pending/running and keep LinkedIn controls independent in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T048 [US1] Poll career-page run status and candidates without depending on LinkedIn scroll/capture settings in `apps/extension/src/store/popupStore.ts`
- [X] T049 [US1] Add compact responsive styles for source checkbox controls, latest search label, and career-page progress state in `apps/extension/src/styles/popup.css`

**Checkpoint**: User Story 1 should be fully functional and independently testable as the MVP.

---

## Phase 4: User Story 2 - Review External Applications Separately (Priority: P1)

**Goal**: Jobs with usable email appear in `With email`; no-email jobs with usable apply URL appear in `External applications`; external cards use the existing card density, have one open-URL action, allow bulk delete, and never bulk-open URLs.

**Independent Test**: Create at least one email-bearing LinkedIn job, one email-bearing career-page job, and one no-email career-page job; open Jobs; switch between `With email` and `External applications`; confirm each lane shows only the correct jobs and actions.

### Tests for User Story 2

- [X] T050 [P] [US2] Add API integration tests for `job_application_kind=email` and `job_application_kind=external_application` opportunity list filters in `apps/api/tests/integration/test_external_application_jobs.py`
- [X] T051 [P] [US2] Add API integration tests proving career-page jobs with email remain eligible for bulk email preview/generation in `apps/api/tests/integration/test_external_application_jobs.py`
- [X] T052 [P] [US2] Add API integration tests proving no-email external application jobs are excluded from email bulk preview and counted as missing recipient if selected directly in `apps/api/tests/integration/test_external_application_jobs.py`
- [X] T053 [P] [US2] Add extension store/view tests for Jobs `With email` and `External applications` filters in `apps/extension/src/store/popupStore.test.ts`
- [X] T054 [P] [US2] Add extension behavior tests proving external application bulk actions include delete but not bulk open/email in `apps/extension/src/components/popup/JobsView.test.tsx`

### Implementation for User Story 2

- [X] T055 [US2] Implement application kind derivation/filtering for opportunities in `apps/api/app/services/opportunity_service.py`
- [X] T056 [US2] Update opportunities list endpoint handling for `job_application_kind` without breaking existing keyword/stage/provider pagination filters in `apps/api/app/services/opportunity_service.py`
- [X] T057 [US2] Preserve career-page apply URL in opportunity detail responses for both email and external application jobs in `apps/api/app/schemas/opportunity.py`
- [X] T058 [US2] Ensure bulk email preview uses sanitized contact email and continues accepting career-page jobs with email in `apps/api/app/services/bulk_email_service.py`
- [X] T059 [US2] Ensure no-email external application jobs do not create email drafts/send requests through bulk or individual email paths in `apps/api/app/services/bulk_email_service.py` and `apps/api/app/services/email_draft_service.py`
- [X] T060 [US2] Add Jobs view tab/segmented state for `With email` and `External applications` in `apps/extension/src/store/popupStore.ts`
- [X] T061 [US2] Update Jobs list API calls to pass `job_application_kind` while preserving current pagination, keyword filters, selection, and delete-all-listed behavior in `apps/extension/src/store/popupStore.ts`
- [X] T062 [US2] Render Jobs segmented controls and correct empty states for `With email` and `External applications` in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T063 [US2] Render external application cards with existing card information density and one primary apply URL action in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T064 [US2] Preserve apply URL display/supporting action in opportunity detail for email-bearing career-page jobs in `apps/extension/src/components/popup/OpportunityDetail.tsx`
- [X] T065 [US2] Hide bulk email actions and bulk open URL behavior in the external applications tab while keeping bulk delete available in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T066 [US2] Add CSS for compact Jobs segmented controls and external apply action without introducing card-in-card layout in `apps/extension/src/styles/popup.css`

**Checkpoint**: User Stories 1 and 2 should both work independently and preserve existing email workflows.

---

## Phase 5: User Story 3 - Evaluate External Jobs With AI Matching (Priority: P2)

**Goal**: External job candidates are evaluated with existing AI/deterministic matching, rejected candidates remain traceable, fallback behavior is safe, and accepted opportunities include match score/explanation when available.

**Independent Test**: Run a career-page search with AI evaluation enabled, confirm accepted opportunities show match score/explanation, rejected/stale/unrelated candidates are counted with reasons, and an AI failure does not fail the whole run.

### Tests for User Story 3

- [X] T067 [P] [US3] Add worker unit tests for external job normalization, email extraction, apply URL validation, stale signal detection, and application kind classification in `apps/worker/tests/unit/test_external_job_normalizer.py`
- [X] T068 [P] [US3] Add worker unit tests for external job AI evaluation prompt/input mapping and fallback behavior in `apps/worker/tests/unit/test_external_job_ai_evaluation.py`
- [X] T069 [P] [US3] Add worker integration tests proving accepted external candidates persist match score/explanation and rejected candidates persist reasons/counters in `apps/worker/tests/integration/test_career_page_search_pipeline.py`
- [X] T070 [P] [US3] Add API integration tests proving candidate diagnostics expose AI/fallback status and source-level rejection counts in `apps/api/tests/integration/test_career_page_search_candidates.py`

### Implementation for User Story 3

- [X] T071 [US3] Implement external job normalization helper for provider result title, company, description, emails, apply URL, source URL, source evidence, and matched keywords in `apps/worker/app/services/external_job_normalizer.py`
- [X] T072 [US3] Reuse or adapt `job_review_analyzer` for external candidate AI matching with resume/profile/search context in `apps/worker/app/services/job_review_analyzer.py`
- [X] T073 [US3] Implement deterministic fallback scoring and safe rejection rules for missing apply URL, stale results, weak match, and missing evidence in `apps/worker/app/services/external_job_normalizer.py`
- [X] T074 [US3] Integrate normalization, AI evaluation, fallback, and candidate outcome persistence in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T075 [US3] Persist AI model name, prompt version, confidence, score factors, missing keywords, normalized title/company, and rejection reason for external candidates in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T076 [US3] Ensure external accepted opportunities copy match score/explanation and normalized role/company into `job_opportunity_details` in `apps/worker/app/jobs/career_page_job_search.py`
- [X] T077 [US3] Update API candidate serialization to include external AI/fallback diagnostics without breaking LinkedIn candidate schemas in `apps/api/app/schemas/job_search_run.py`
- [X] T078 [US3] Update Search progress UI to display accepted/rejected/duplicate/cap counters for career-page runs in `apps/extension/src/components/popup/SearchView.tsx`

**Checkpoint**: External search quality filtering and diagnostics should be independently testable.

---

## Phase 6: User Story 4 - Track Manual External Applications (Priority: P2)

**Goal**: The operator can open an external application URL, manually mark the job as applied, and update status/dashboard state without creating Gmail send requests or email outreach events.

**Independent Test**: Open an external application job, click the apply URL, mark it applied, confirm `job_stage=applied`, confirm no Gmail send request/outreach event exists, and confirm dashboard external-unapplied count decreases.

### Tests for User Story 4

- [X] T079 [P] [US4] Add API contract tests for `PATCH /opportunities/{opportunity_id}/mark-applied` in `apps/api/tests/contract/test_external_application_contract.py`
- [X] T080 [P] [US4] Add API integration tests proving manual external apply sets `job_stage=applied` and creates no Gmail send request or outreach event in `apps/api/tests/integration/test_external_application_jobs.py`
- [X] T081 [P] [US4] Add API integration tests proving owner scoping and invalid opportunity handling for mark-applied in `apps/api/tests/integration/test_external_application_ownership.py`
- [X] T082 [P] [US4] Add extension store/view tests for marking an external application applied and refreshing the selected opportunity in `apps/extension/src/store/popupStore.test.ts`

### Implementation for User Story 4

- [X] T083 [US4] Implement owner-scoped `mark_job_opportunity_applied` service behavior in `apps/api/app/services/opportunity_service.py`
- [X] T084 [US4] Add `PATCH /opportunities/{opportunity_id}/mark-applied` endpoint in `apps/api/app/api/router.py` or the existing opportunities route module
- [X] T085 [US4] Ensure manual mark-applied skips `send_requests`, `email_drafts`, and `outreach_events` creation in `apps/api/app/services/opportunity_service.py`
- [X] T086 [US4] Add extension API client method for mark applied in `apps/extension/src/api/client.ts`
- [X] T087 [US4] Add popup store action to mark external applications applied and refresh Jobs/dashboard state in `apps/extension/src/store/popupStore.ts`
- [X] T088 [US4] Render `Mark applied` action only for external application jobs that are not already applied in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T089 [US4] Show applied status consistently in external job card/detail views in `apps/extension/src/components/popup/JobsView.tsx` and `apps/extension/src/components/popup/OpportunityDetail.tsx`

**Checkpoint**: Manual external application tracking should work without touching Gmail send workflows.

---

## Phase 7: User Story 5 - See Email And External Counts On Dashboard (Priority: P3)

**Goal**: The dashboard shows separate Full-time metrics for email jobs and external application jobs awaiting manual application, and metrics update after deletion or applied-status changes.

**Independent Test**: Seed mixed jobs, refresh dashboard, verify separate email/external counts, mark an external job applied, delete another, and confirm metrics update without requiring a new search.

### Tests for User Story 5

- [X] T090 [P] [US5] Add API integration tests for `email_job_count`, `email_unsent_count`, `external_application_count`, and `external_unapplied_count` in `apps/api/tests/integration/test_opportunity_metrics.py`
- [X] T091 [P] [US5] Add API integration tests proving metrics update after external mark-applied and delete operations in `apps/api/tests/integration/test_opportunity_metrics.py`
- [X] T092 [P] [US5] Add extension store/view tests for dashboard metrics rendering and refresh behavior in `apps/extension/src/store/popupStore.test.ts` and `apps/extension/src/components/popup/DashboardView.test.tsx`

### Implementation for User Story 5

- [X] T093 [US5] Extend opportunity metrics aggregation for email and external application counts in `apps/api/app/services/opportunity_service.py`
- [X] T094 [US5] Extend metrics schema/response with new count fields while preserving existing total/unsent compatibility fields in `apps/api/app/schemas/opportunity.py`
- [X] T095 [US5] Update extension metrics types and API client parsing for new dashboard fields in `apps/extension/src/api/types.ts` and `apps/extension/src/api/client.ts`
- [X] T096 [US5] Update popup store dashboard refresh after career-page run completion, mark-applied, and delete actions in `apps/extension/src/store/popupStore.ts`
- [X] T097 [US5] Render separate email and external application metrics in `apps/extension/src/components/popup/DashboardView.tsx`
- [X] T098 [US5] Add compact dashboard styling for the additional metrics without turning the dashboard into nested cards in `apps/extension/src/styles/popup.css`

**Checkpoint**: Dashboard metrics should reflect the two Full-time operating lanes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation alignment, lifecycle planning, regression validation, and operational closeout.

- [X] T099 [P] Add focused API compatibility tests proving existing LinkedIn run creation, LinkedIn candidates, Gmail OAuth/send, and AI field assistant routes still work without career-page config in `apps/api/tests/integration/test_career_page_search_compatibility.py`
- [X] T100 [P] Add worker compatibility tests proving LinkedIn worker pipeline remains unaffected by career-page provider config in `apps/worker/tests/integration/test_career_page_search_compatibility.py`
- [X] T101 [P] Add extension regression tests proving LinkedIn Search controls, saved keyword badges, and AI filter settings remain independent of career-page controls in `apps/extension/src/store/popupStore.test.ts`
- [X] T102 Record the 1-month job lifecycle as a retention planning note without destructive cleanup in `docs/search-improvements.md`
- [X] T103 [P] Update `docs/architecture.md` with worker-owned curated provider search and backend-only provider key boundaries
- [X] T104 [P] Update `docs/domain-model.md` with application kind, external application jobs, career-page candidates, and manual `job_stage=applied` semantics
- [X] T105 [P] Update `docs/roadmap.md` with implementation status after selected tasks are completed
- [X] T106 Update `docs/handoff.md` with implementation status, validation results, next step, and latest prompt
- [X] T107 Update `docs/next-spec-prompt.md` with the next recommended Spec Kit prompt after implementation closeout
- [X] T108 Run API compile and migration validation from `specs/013-serpapi-career-search/quickstart.md` using `docker compose exec api python -m compileall app alembic`
- [X] T109 Run focused API tests from `specs/013-serpapi-career-search/quickstart.md`
- [X] T110 Run focused worker tests from `specs/013-serpapi-career-search/quickstart.md`
- [X] T111 Run extension validation from `specs/013-serpapi-career-search/quickstart.md` using `npm.cmd run typecheck` and `npm.cmd run build` in `apps/extension`
- [ ] T112 Perform manual extension smoke from `specs/013-serpapi-career-search/quickstart.md` with mixed email and external application jobs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **US1 Search Curated Career Pages (Phase 3)**: Depends on Foundational - MVP scope.
- **US2 Review External Applications Separately (Phase 4)**: Depends on Foundational and benefits from US1-created opportunities.
- **US3 Evaluate External Jobs With AI Matching (Phase 5)**: Depends on Foundational and can integrate into the US1 worker pipeline.
- **US4 Track Manual External Applications (Phase 6)**: Depends on Foundational and is easiest after US2 exposes external application jobs.
- **US5 Dashboard Counts (Phase 7)**: Depends on Foundational and benefits from US2/US4 semantics.
- **Polish (Phase 8)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: MVP. Delivers the new `/search` provider run and persistence pipeline.
- **US2 (P1)**: Required for usable daily review; can start after the application kind schema exists, but needs US1 data or fixtures to validate.
- **US3 (P2)**: Quality layer; can be developed in parallel with US2 after foundational schema and provider result normalization exist.
- **US4 (P2)**: Status/tracking layer for no-email jobs; depends on US2 exposing external application jobs.
- **US5 (P3)**: Dashboard layer; depends on application kind and applied-status semantics.

### Within Each User Story

- Tests should be written first and fail before implementation where listed.
- Migrations/models before schemas.
- Schemas before API route/client typing.
- Worker provider/normalizer before pipeline persistence.
- API client/types before extension store integration.
- Store actions before component rendering.
- Story complete before moving to next priority unless parallel work is explicitly split by file ownership.

### Parallel Opportunities

- Setup inspections T004-T006 can run in parallel.
- Foundational tests T008-T011 can run in parallel.
- US1 tests T024-T031 can run in parallel.
- US2 tests T050-T054 can run in parallel.
- US3 tests T067-T070 can run in parallel.
- US4 tests T079-T082 can run in parallel.
- US5 tests T090-T092 can run in parallel.
- Documentation updates T103-T105 can run in parallel after implementation behavior is stable.

---

## Parallel Example: User Story 1

```bash
Task: "Add contract tests for POST /job-search-runs/career-page in apps/api/tests/contract/test_career_page_search_contract.py"
Task: "Add worker unit tests for provider query generation in apps/worker/tests/unit/test_career_page_search_provider.py"
Task: "Add extension store tests for source defaults and duplicate-run disable behavior in apps/extension/src/store/popupStore.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add API integration tests for job_application_kind list filters in apps/api/tests/integration/test_external_application_jobs.py"
Task: "Add extension view tests for Jobs tabs in apps/extension/src/components/popup/JobsView.test.tsx"
Task: "Implement opportunity list filtering in apps/api/app/services/opportunity_service.py"
```

## Parallel Example: User Story 3

```bash
Task: "Add worker unit tests for external job normalization in apps/worker/tests/unit/test_external_job_normalizer.py"
Task: "Add worker unit tests for external job AI evaluation in apps/worker/tests/unit/test_external_job_ai_evaluation.py"
Task: "Add API integration tests for candidate diagnostics in apps/api/tests/integration/test_career_page_search_candidates.py"
```

## Parallel Example: User Story 4

```bash
Task: "Add API contract tests for PATCH /opportunities/{opportunity_id}/mark-applied in apps/api/tests/contract/test_external_application_contract.py"
Task: "Add extension store tests for marking an external application applied in apps/extension/src/store/popupStore.test.ts"
```

## Parallel Example: User Story 5

```bash
Task: "Add API metrics integration tests in apps/api/tests/integration/test_opportunity_metrics.py"
Task: "Add extension dashboard rendering tests in apps/extension/src/components/popup/DashboardView.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational schema/config/types.
3. Complete Phase 3: User Story 1.
4. Validate: start a career-page search from Search, confirm fresh run, selected sources, disabled duplicate button, provider diagnostics, accepted opportunities, and no company/board/tenant input.
5. Stop and demo if the MVP search pipeline is enough for first provider testing.

### Incremental Delivery

1. Setup + Foundational -> schema/contracts/provider config ready.
2. US1 -> fresh external provider run and opportunity persistence.
3. US2 -> operator can review external jobs separately and preserve email flow.
4. US3 -> AI/fallback quality layer and diagnostics.
5. US4 -> manual external application status.
6. US5 -> dashboard metrics.
7. Polish -> docs, regression, quickstart, smoke.

### Validation Commands

```powershell
docker compose exec api python -m compileall app alembic
docker compose exec api python -m pytest tests/contract/test_career_page_search_contract.py tests/contract/test_external_application_contract.py tests/integration/test_career_page_search.py tests/integration/test_external_application_jobs.py tests/integration/test_external_application_ownership.py tests/integration/test_opportunity_metrics.py tests/integration/test_career_page_search_compatibility.py
docker compose exec worker python -m pytest tests/unit/test_career_page_search_provider.py tests/unit/test_external_job_normalizer.py tests/unit/test_external_job_ai_evaluation.py tests/integration/test_career_page_search_pipeline.py tests/integration/test_career_page_search_compatibility.py

cd apps/extension
npm.cmd run typecheck
npm.cmd run build
```

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks.
- `[US1]` through `[US5]` labels map to the prioritized user stories in `spec.md`.
- Keep provider keys and OpenAI keys out of the extension.
- Do not reintroduce the discarded external email-enrichment spike.
- Do not require company names, board names, tenant names, or ATS client identifiers from the operator.
- Do not implement automatic form submission or ATS resume generation in this feature.
- Do not implement destructive 1-month cleanup in this feature unless a dedicated retention workflow is explicitly added.
