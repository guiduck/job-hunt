# Tasks: LinkedIn AI Filters

**Input**: Design documents from `specs/008-linkedin-ai-filters/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Included because the specification and quickstart require API/worker tests for pass, reject, fallback, invalid output, ownership, counters, plus extension typecheck coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/008-linkedin-ai-filters/plan.md`, generating executable tasks for Search UI split, broad LinkedIn capture, optional post-capture AI filters, deterministic fallback, diagnostics counters, and ownership validation.

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or depends only on completed prerequisites.
- **[Story]**: Which user story this task belongs to (US1, US2, US3).
- Include exact file paths in descriptions.

## Path Conventions

- API: `apps/api/app/`, `apps/api/tests/`, `apps/api/alembic/versions/`
- Worker: `apps/worker/app/`, `apps/worker/tests/`
- Extension: `apps/extension/src/`, `apps/extension/background.ts`, `apps/extension/contents/`
- Feature docs: `specs/008-linkedin-ai-filters/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared fixtures, artifact review, and type placeholders before schema/runtime changes.

- [X] T001 Review `specs/008-linkedin-ai-filters/spec.md`, `specs/008-linkedin-ai-filters/plan.md`, `specs/008-linkedin-ai-filters/data-model.md`, and `specs/008-linkedin-ai-filters/contracts/openapi.yaml` before implementation
- [X] T002 [P] Add reusable API test fixtures for AI-filtered runs and candidates in `apps/api/tests/conftest.py`
- [X] T003 [P] Add reusable worker test fixtures for AI filter candidate payloads in `apps/worker/tests/conftest.py`
- [X] T004 [P] Add extension capture fixture helpers for broad LinkedIn posts in `apps/extension/src/capture/types.ts`
- [X] T005 [P] Add AI filter environment documentation comments to `.env.example`
- [X] T006 [P] Add placeholder worker AI filter service module in `apps/worker/app/services/job_ai_filter.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add compatible schema, models, schemas, and shared contracts required by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Add additive Alembic migration for AI filter fields on `job_search_runs` and `job_search_candidates` in `apps/api/alembic/versions/012_linkedin_ai_filters.py`
- [X] T008 Update `JobSearchRun` SQLAlchemy fields and AI filter enum constants in `apps/api/app/models/job_search_run.py`
- [X] T009 Update `JobSearchCandidate` SQLAlchemy AI filter fields in `apps/api/app/models/job_search_run.py`
- [X] T010 Update run create/read and candidate Pydantic schemas with search query, sort order, AI filter settings, decisions, signals, and counters in `apps/api/app/schemas/job_search_run.py`
- [X] T011 Update job-search run service create/list/candidate query signatures for optional AI filter fields in `apps/api/app/services/job_search_run_service.py`
- [X] T012 Update job-search run routes for `ai_filter_status` query support in `apps/api/app/api/routes/job_search_runs.py`
- [X] T013 [P] Add API migration tests for old runs/candidates defaulting safely without AI filter fields in `apps/api/tests/integration/test_linkedin_ai_filters_migration.py`
- [X] T014 [P] Add API schema unit tests for AI filter enum values, confidence bounds, and default disabled settings in `apps/api/tests/unit/test_linkedin_ai_filter_schema.py`
- [X] T015 [P] Add API contract tests for additive run create/read fields from `contracts/openapi.yaml` in `apps/api/tests/contract/test_linkedin_ai_filter_contract.py`
- [X] T016 [P] Add worker unit test skeleton for pass, reject, fallback, failed, and skipped AI filter statuses in `apps/worker/tests/unit/test_job_ai_filter.py`
- [X] T017 [P] Add extension TypeScript API types for AI filter settings, signals, statuses, and run counters in `apps/extension/src/api/types.ts`
- [X] T018 [P] Add extension store state/action type placeholders for AI filter settings and disabled-by-default behavior in `apps/extension/src/store/popupStore.ts`
- [X] T019 Update OpenAPI artifact if implementation naming diverges from planned contract in `specs/008-linkedin-ai-filters/contracts/openapi.yaml`
- [X] T020 Run foundational API checks with `cd apps/api && python -m pytest tests/unit/test_linkedin_ai_filter_schema.py tests/integration/test_linkedin_ai_filters_migration.py tests/contract/test_linkedin_ai_filter_contract.py`
- [X] T021 Run foundational worker checks with `cd apps/worker && python -m pytest tests/unit/test_job_ai_filter.py`

**Checkpoint**: Foundation ready - additive fields, schemas, contracts, and placeholders exist.

---

## Phase 3: User Story 1 - Start A Broad LinkedIn Search (Priority: P1) MVP

**Goal**: Operator starts LinkedIn capture with only text query and recent/relevant sort order; AI filters are disabled by default and do not affect capture.

**Independent Test**: Start a search with `hiring typescript` and recent sort, confirm LinkedIn opens with query/sort only, posts are captured broadly, and existing run/history rendering still works without AI filter fields.

### Tests for User Story 1

- [X] T022 [P] [US1] Add extension URL builder regression tests or type assertions for query/sort-only LinkedIn URLs in `apps/extension/src/capture/linkedin.ts`
- [X] T023 [P] [US1] Add API contract test proving `POST /job-search-runs` works without AI filter settings in `apps/api/tests/contract/test_linkedin_ai_filter_contract.py`
- [X] T024 [P] [US1] Add API integration test proving existing runs without AI filter data render with safe defaults in `apps/api/tests/integration/test_linkedin_ai_filters_compatibility.py`

### Implementation for User Story 1

- [X] T025 [US1] Change `buildLinkedInContentSearchUrl` to accept only search query text, optional region text as query text, and sort order in `apps/extension/src/capture/linkedin.ts`
- [X] T026 [US1] Remove pre-capture remote, onsite, region, and excluded keyword filtering from `filterCapturedPosts` usage in `apps/extension/src/capture/linkedin.ts`
- [X] T027 [US1] Update capture request types to separate LinkedIn search query/sort from AI filter settings in `apps/extension/src/capture/types.ts`
- [X] T028 [US1] Update background capture flow to capture broad posts and avoid dropping posts by AI filter settings in `apps/extension/background.ts`
- [X] T029 [US1] Refactor Search UI into `LinkedIn search` and disabled-by-default `AI filters` sections in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T030 [US1] Update popup store defaults so AI filters are disabled and legacy local filter values do not affect new searches in `apps/extension/src/store/popupStore.ts`
- [X] T031 [US1] Update capture start payload creation to send broad collection inputs and omit AI filters unless explicitly enabled in `apps/extension/src/store/popupStore.ts`
- [X] T032 [US1] Update extension API run create type usage for `search_query`, `search_sort_order`, and optional AI filter fields in `apps/extension/src/api/types.ts`
- [X] T033 [US1] Update Search UI copy and layout styles for the two sections in `apps/extension/src/styles/popup.css`
- [X] T034 [US1] Preserve old run rendering defaults in extension run diagnostics in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T035 [US1] Run US1 API checks with `cd apps/api && python -m pytest tests/contract/test_linkedin_ai_filter_contract.py tests/integration/test_linkedin_ai_filters_compatibility.py`
- [X] T036 [US1] Run US1 extension typecheck with `cd apps/extension && npm run typecheck`

**Checkpoint**: US1 MVP is functional and independently testable.

---

## Phase 4: User Story 2 - Filter Captured Posts With Optional AI Review (Priority: P2)

**Goal**: Operator can enable optional AI filters so otherwise acceptable captured candidates are evaluated after collection for work mode, accepted/excluded regions, and excluded keywords before opportunity creation.

**Independent Test**: Enable remote-only and excluded-region filters, capture a mixed sample, and confirm passed candidates continue into opportunities while rejected candidates retain reason, confidence, signals, and evidence.

### Tests for User Story 2

- [X] T037 [P] [US2] Add worker unit tests for AI filter pass, reject, matched exclusion keyword, accepted region, and work-mode signals in `apps/worker/tests/unit/test_job_ai_filter.py`
- [X] T038 [P] [US2] Add worker unit tests for confidence below 0.70, missing config, invalid output, rate limit, and unavailable provider fallback in `apps/worker/tests/unit/test_job_ai_filter.py`
- [X] T039 [P] [US2] Add worker integration tests proving AI-rejected candidates do not create opportunities and retain evidence in `apps/worker/tests/integration/test_linkedin_ai_filter_pipeline.py`
- [X] T040 [P] [US2] Add API integration tests for persisted AI filter decisions, reasons, confidence, and signals in `apps/api/tests/integration/test_linkedin_ai_filter_candidates.py`
- [X] T041 [P] [US2] Add extension type coverage for enabled AI filter payload shape in `apps/extension/src/api/types.ts`

### Implementation for User Story 2

- [X] T042 [US2] Implement AI filter settings normalization and defaults in `apps/api/app/schemas/job_search_run.py`
- [X] T043 [US2] Persist run-level `ai_filters_enabled`, `ai_filter_settings`, `search_query`, and `search_sort_order` on run creation in `apps/api/app/services/job_search_run_service.py`
- [X] T044 [US2] Implement deterministic/local AI filter fallback decision helper in `apps/worker/app/services/job_ai_filter.py`
- [X] T045 [US2] Implement structured AI filter output validation and confidence threshold handling in `apps/worker/app/services/job_ai_filter.py`
- [X] T046 [US2] Implement AI filter prompt/input assembly from title, headline, description, source URL, contact context, evidence, and filter settings in `apps/worker/app/services/job_ai_filter.py`
- [X] T047 [US2] Add worker configuration for optional AI filter provider/model without exposing secrets to extension in `apps/worker/app/core/config.py`
- [X] T048 [US2] Integrate AI filter evaluation after parsing/normalization and before opportunity creation in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T049 [US2] Add `rejected_ai_filter` and `failed_ai_filter` outcome handling in worker candidate recording in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T050 [US2] Persist candidate AI filter fields in worker `record_candidate` SQL in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T051 [US2] Ensure AI-filter rejected candidates keep `source_evidence`, `source_url`, `source_query`, title/headline, and description fields in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T052 [US2] Update API service-created candidate path to persist AI filter fields for non-worker tests in `apps/api/app/services/job_search_run_service.py`
- [X] T053 [US2] Return AI filter decisions and signals from candidate schemas in `apps/api/app/schemas/job_search_run.py`
- [X] T054 [US2] Wire enabled AI filter controls and accepted/excluded region fields in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T055 [US2] Add AI filter settings state/actions and payload serialization in `apps/extension/src/store/popupStore.ts`
- [X] T056 [US2] Ensure extension API client never sends or receives AI provider secrets in `apps/extension/src/api/client.ts`
- [X] T057 [US2] Add AI filters section styles and disabled/enabled states in `apps/extension/src/styles/popup.css`
- [X] T058 [US2] Run US2 worker tests with `cd apps/worker && python -m pytest tests/unit/test_job_ai_filter.py tests/integration/test_linkedin_ai_filter_pipeline.py`
- [X] T059 [US2] Run US2 API tests with `cd apps/api && python -m pytest tests/integration/test_linkedin_ai_filter_candidates.py`
- [X] T060 [US2] Run US2 extension typecheck with `cd apps/extension && npm run typecheck`

**Checkpoint**: US2 works independently once broad capture and foundational fields exist.

---

## Phase 5: User Story 3 - Understand Run Outcomes And Fallbacks (Priority: P3)

**Goal**: Operator can inspect run and candidate diagnostics for inspected, accepted, AI-rejected, duplicate, fallback, skipped, and failed outcomes while ownership prevents cross-user access.

**Independent Test**: Run captures with pass, reject, fallback, duplicate, disabled-AI, and failed-evaluation cases, then verify counters, candidate details, retained evidence, and two-user isolation.

### Tests for User Story 3

- [X] T061 [P] [US3] Add API contract tests for run-level AI filter counters and `ai_filter_status` candidate query parameter in `apps/api/tests/contract/test_linkedin_ai_filter_diagnostics_contract.py`
- [X] T062 [P] [US3] Add API integration tests for pass, reject, fallback, skipped, duplicate, and failed counter reconciliation in `apps/api/tests/integration/test_linkedin_ai_filter_counters.py`
- [X] T063 [P] [US3] Add API integration tests for two-user run and candidate AI filter ownership isolation in `apps/api/tests/integration/test_linkedin_ai_filter_ownership.py`
- [X] T064 [P] [US3] Add worker integration tests proving duplicate and provider-failure candidates are skipped, not AI-rejected, in `apps/worker/tests/integration/test_linkedin_ai_filter_counters.py`
- [X] T065 [P] [US3] Add extension type coverage for displaying run counters and candidate AI filter diagnostics in `apps/extension/src/api/types.ts`

### Implementation for User Story 3

- [X] T066 [US3] Aggregate AI filter counters and run-level `ai_filter_status` in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T067 [US3] Add API-side counter reconciliation for service-created candidates in `apps/api/app/services/job_search_run_service.py`
- [X] T068 [US3] Add `ai_filter_status` filtering to candidate list queries in `apps/api/app/services/job_search_run_service.py`
- [X] T069 [US3] Expose `ai_filter_status` query parameter on run candidates route in `apps/api/app/api/routes/job_search_runs.py`
- [X] T070 [US3] Return run-level AI filter counters and errors from API run schemas in `apps/api/app/schemas/job_search_run.py`
- [X] T071 [US3] Ensure owner-scoped run and candidate queries apply to AI filter diagnostics in `apps/api/app/services/job_search_run_service.py`
- [X] T072 [US3] Display run AI filter counters in Search diagnostics in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T073 [US3] Display candidate AI filter reason/confidence/status in candidate diagnostics links or panels in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T074 [US3] Add diagnostics styles for passed, rejected, fallback, failed, and skipped statuses in `apps/extension/src/styles/popup.css`
- [X] T075 [US3] Update quickstart validation details after implementation in `specs/008-linkedin-ai-filters/quickstart.md`
- [X] T076 [US3] Run US3 API diagnostics tests with `cd apps/api && python -m pytest tests/contract/test_linkedin_ai_filter_diagnostics_contract.py tests/integration/test_linkedin_ai_filter_counters.py tests/integration/test_linkedin_ai_filter_ownership.py`
- [X] T077 [US3] Run US3 worker diagnostics tests with `cd apps/worker && python -m pytest tests/integration/test_linkedin_ai_filter_counters.py`
- [X] T078 [US3] Run US3 extension typecheck with `cd apps/extension && npm run typecheck`

**Checkpoint**: US3 diagnostics and ownership behavior are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final compatibility, documentation, and validation across all user stories.

- [X] T079 [P] Update `.env.example` with final AI filter model/config names and backend/worker-only secret guidance
- [X] T080 [P] Update `docs/search-improvements.md` with implemented Search/AI filter behavior and fallback semantics
- [X] T081 [P] Update `docs/overview.md` and `docs/roadmap.md` with current Fase 3.5 implementation status
- [X] T082 Update `docs/handoff.md` with implementation status, validation results, next step, and latest prompt
- [X] T083 [P] Update `README.md` with focused validation commands for LinkedIn AI filters
- [X] T084 [P] Review `specs/008-linkedin-ai-filters/contracts/openapi.yaml` against implemented API field names
- [X] T085 Run focused API suite with `cd apps/api && python -m pytest tests/contract/test_linkedin_ai_filter_contract.py tests/contract/test_linkedin_ai_filter_diagnostics_contract.py tests/integration/test_linkedin_ai_filters_compatibility.py tests/integration/test_linkedin_ai_filter_candidates.py tests/integration/test_linkedin_ai_filter_counters.py tests/integration/test_linkedin_ai_filter_ownership.py`
- [X] T086 Run focused worker suite with `cd apps/worker && python -m pytest tests/unit/test_job_ai_filter.py tests/integration/test_linkedin_ai_filter_pipeline.py tests/integration/test_linkedin_ai_filter_counters.py`
- [X] T087 Run extension typecheck with `cd apps/extension && npm run typecheck`
- [ ] T088 Run manual quickstart smoke scenarios from `specs/008-linkedin-ai-filters/quickstart.md`
- [X] T089 Review final git diff for generated files, secrets, build artifacts, and accidental changes in repository root

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **US1 Broad Search MVP (Phase 3)**: Depends on Foundational completion.
- **US2 Optional AI Filtering (Phase 4)**: Depends on Foundational and benefits from US1 broad capture behavior.
- **US3 Diagnostics & Fallbacks (Phase 5)**: Depends on Foundational and benefits from US2 persisted decisions/counters.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP. Can start after Phase 2 and does not require AI provider configuration.
- **User Story 2 (P2)**: Can start after Phase 2, but should integrate with US1's broad capture to avoid preserving old pre-filter behavior.
- **User Story 3 (P3)**: Can start after Phase 2 for ownership/counter tests, but full value depends on US2 candidate decisions.

### Within Each User Story

- Tests should be written or updated before implementation where practical.
- Data model/schema before service logic.
- Worker filter service before worker run-loop integration.
- API schemas/services before extension API types consume new fields.
- Extension capture and UI changes before manual quickstart smoke.

### Parallel Opportunities

- Setup fixture/docs placeholder tasks T002-T006 can run in parallel.
- Foundational tests T013-T018 can run in parallel after T007-T012 designs settle.
- US1 API tests, extension URL tests, and compatibility tests T022-T024 can run in parallel.
- US2 worker tests, API integration tests, and extension type tasks T037-T041 can run in parallel.
- US3 API contract, API integration, worker integration, and extension type tasks T061-T065 can run in parallel.
- Polish docs tasks T079-T084 can run in parallel after field names stabilize.

---

## Parallel Example: User Story 1

```bash
Task: "Add extension URL builder regression tests or type assertions for query/sort-only LinkedIn URLs in apps/extension/src/capture/linkedin.ts"
Task: "Add API contract test proving POST /job-search-runs works without AI filter settings in apps/api/tests/contract/test_linkedin_ai_filter_contract.py"
Task: "Add API integration test proving existing runs without AI filter data render with safe defaults in apps/api/tests/integration/test_linkedin_ai_filters_compatibility.py"
```

## Parallel Example: User Story 2

```bash
Task: "Add worker unit tests for AI filter pass, reject, matched exclusion keyword, accepted region, and work-mode signals in apps/worker/tests/unit/test_job_ai_filter.py"
Task: "Add API integration tests for persisted AI filter decisions, reasons, confidence, and signals in apps/api/tests/integration/test_linkedin_ai_filter_candidates.py"
Task: "Add extension type coverage for enabled AI filter payload shape in apps/extension/src/api/types.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add API contract tests for run-level AI filter counters and ai_filter_status candidate query parameter in apps/api/tests/contract/test_linkedin_ai_filter_diagnostics_contract.py"
Task: "Add API integration tests for two-user run and candidate AI filter ownership isolation in apps/api/tests/integration/test_linkedin_ai_filter_ownership.py"
Task: "Add worker integration tests proving duplicate and provider-failure candidates are skipped, not AI-rejected, in apps/worker/tests/integration/test_linkedin_ai_filter_counters.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational schema/types.
3. Complete Phase 3: Broad LinkedIn search UI/capture.
4. Stop and validate: Search UI only uses query/sort, AI filters are disabled by default, and existing runs render.

### Incremental Delivery

1. Setup + Foundational: additive fields and safe compatibility.
2. US1: broad search MVP without AI dependency.
3. US2: optional AI filter pass/reject/fallback before opportunity creation.
4. US3: complete counters, diagnostics, and owner-scoped inspection.
5. Polish: docs, quickstart, focused test suites, manual smoke.

### Risk-Based Order

1. Protect compatibility first: migrations and old-run serialization.
2. Remove extension pre-filtering before adding AI filtering, so capture stays broad.
3. Add AI filter decisions as a separate status from review `analysis_status`.
4. Validate fallback and ownership before relying on manual smoke results.

---

## Notes

- [P] tasks touch different files or depend only on completed prerequisites.
- Each user story has an independent test path and checkpoint.
- Do not expose `OPENAI_API_KEY`, model names containing secrets, OAuth tokens, or provider credentials to extension payloads or responses.
- Preserve existing deterministic/local behavior for fallback and old runs.
- Do not remove existing review intelligence fields or overload `analysis_status` for AI filter state.
