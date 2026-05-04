# Tasks: Job Review Intelligence

**Input**: Design documents from `/specs/005-job-review-intelligence/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Tests are included because the plan and quickstart require API contract/integration/unit tests, worker unit/integration tests, migration coverage, and AI fallback validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/005-job-review-intelligence/plan.md`

> Refresh `docs/handoff.md` whenever implementation status changes materially or work is handed off.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or depends only on completed prerequisites.
- **[Story]**: Maps to a user story from `specs/005-job-review-intelligence/spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare branch-level artifacts and test fixtures before schema or runtime changes.

- [X] T001 Review `specs/005-job-review-intelligence/spec.md`, `specs/005-job-review-intelligence/plan.md`, `specs/005-job-review-intelligence/data-model.md`, and `specs/005-job-review-intelligence/contracts/openapi.yaml` before implementation
- [X] T002 [P] Add reusable API test fixtures for review-ready job opportunities in `apps/api/tests/conftest.py`
- [X] T003 [P] Add reusable worker test fixtures for review analysis candidates in `apps/worker/tests/conftest.py`
- [X] T004 [P] Create placeholder API scoring service module in `apps/api/app/services/job_review_scoring.py`
- [X] T005 [P] Create placeholder worker analysis service module in `apps/worker/app/services/job_review_analyzer.py`
- [X] T006 [P] Create placeholder worker scoring service module in `apps/worker/app/services/job_review_scoring.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add compatible schema, enums, and base contracts required by all user stories.

**Critical**: No user story work can begin until this phase is complete.

- [X] T007 Add Alembic migration for review intelligence fields on `job_search_runs`, `job_search_candidates`, and `job_opportunity_details` in `apps/api/alembic/versions/005_job_review_intelligence.py`
- [X] T008 Update SQLAlchemy enums and review fields in `apps/api/app/models/job_search_run.py`
- [X] T009 Update SQLAlchemy enums and review fields in `apps/api/app/models/opportunity.py`
- [X] T010 Update Pydantic run/candidate schemas with analysis summary and review profile fields in `apps/api/app/schemas/job_search_run.py`
- [X] T011 Update Pydantic opportunity schemas with `JobReviewStatus`, review profile, and review update payload fields in `apps/api/app/schemas/opportunity.py`
- [X] T012 [P] Add API migration tests for old accepted opportunities and safe defaults in `apps/api/tests/integration/test_job_review_intelligence_migration.py`
- [X] T013 [P] Add API schema unit tests for score bounds, review status values, and analysis status values in `apps/api/tests/unit/test_job_review_intelligence_schema.py`
- [X] T014 [P] Add worker deterministic scoring unit test skeleton in `apps/worker/tests/unit/test_job_review_scoring.py`
- [X] T015 [P] Add worker analyzer fallback unit test skeleton in `apps/worker/tests/unit/test_job_review_analyzer.py`
- [X] T016 Implement shared deterministic scoring rules in `apps/worker/app/services/job_review_scoring.py`
- [X] T017 Mirror API-side scoring helpers needed for filters/backfill tests in `apps/api/app/services/job_review_scoring.py`
- [X] T018 Update worker settings for optional AI analysis enablement and metadata in `apps/worker/app/core/config.py`
- [X] T019 Update API route imports and schema exports for new review enums in `apps/api/app/api/routes/opportunities.py`
- [X] T020 Run foundational tests for schema and scoring with `cd apps/api && python -m pytest tests/unit/test_job_review_intelligence_schema.py tests/integration/test_job_review_intelligence_migration.py`
- [X] T021 Run foundational worker tests with `cd apps/worker && python -m pytest tests/unit/test_job_review_scoring.py tests/unit/test_job_review_analyzer.py`

**Checkpoint**: Foundation ready. User story implementation can start.

---

## Phase 3: User Story 1 - Review Prioritized Job Opportunities (Priority: P1) MVP

**Goal**: Accepted `job` opportunities show a 0-100 score, explanation, normalized context, evidence, review status, missing keywords, and preserved source/contact data.

**Independent Test**: Complete a LinkedIn job search run, open accepted `job` opportunities, and confirm review-ready fields are visible without relying on AI.

### Tests for User Story 1

- [X] T022 [P] [US1] Add API contract tests for opportunity review profile response fields in `apps/api/tests/contract/test_job_review_opportunities_contract.py`
- [X] T023 [P] [US1] Add API integration tests for review-ready opportunity detail defaults and source preservation in `apps/api/tests/integration/test_job_review_opportunity_detail.py`
- [X] T024 [P] [US1] Add API update tests for review status and notes preserving evidence and analysis fields in `apps/api/tests/integration/test_job_review_updates.py`
- [X] T025 [P] [US1] Add worker unit tests for deterministic score explanation, missing keywords, seniority, modality, and location detection in `apps/worker/tests/unit/test_job_review_scoring.py`
- [X] T026 [P] [US1] Add worker integration test for accepted candidate persistence with review fields in `apps/worker/tests/integration/test_job_review_persistence.py`

### Implementation for User Story 1

- [X] T027 [US1] Implement deterministic review profile builder in `apps/worker/app/services/job_review_scoring.py`
- [X] T028 [US1] Implement seniority, modality, location, normalized company, and normalized role extraction in `apps/worker/app/services/job_review_scoring.py`
- [X] T029 [US1] Add review analysis handoff after candidate normalization in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T030 [US1] Persist candidate review fields in worker `record_candidate` SQL in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T031 [US1] Persist accepted opportunity review fields in worker `create_job_opportunity` SQL in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T032 [US1] Persist review fields through API service `record_candidate` path in `apps/api/app/services/job_search_run_service.py`
- [X] T033 [US1] Persist review fields through API `create_opportunity` path in `apps/api/app/services/opportunity_service.py`
- [X] T034 [US1] Return review profile fields from API opportunity schemas in `apps/api/app/schemas/opportunity.py`
- [X] T035 [US1] Return review profile fields from API candidate schemas in `apps/api/app/schemas/job_search_run.py`
- [X] T036 [US1] Support `review_status` and `operator_notes` updates without overwriting analysis fields in `apps/api/app/services/opportunity_service.py`
- [X] T037 [US1] Wire `review_status` updates in the opportunity PATCH route in `apps/api/app/api/routes/opportunities.py`
- [X] T038 [US1] Ensure existing accepted jobs serialize with `review_status=unreviewed` defaults in `apps/api/app/services/opportunity_service.py`
- [X] T039 [US1] Update OpenAPI implementation expectations for opportunity review profile in `specs/005-job-review-intelligence/contracts/openapi.yaml`
- [X] T040 [US1] Run US1 API tests with `cd apps/api && python -m pytest tests/contract/test_job_review_opportunities_contract.py tests/integration/test_job_review_opportunity_detail.py tests/integration/test_job_review_updates.py`
- [X] T041 [US1] Run US1 worker tests with `cd apps/worker && python -m pytest tests/unit/test_job_review_scoring.py tests/integration/test_job_review_persistence.py`

**Checkpoint**: US1 MVP is functional and independently testable.

---

## Phase 4: User Story 2 - Filter Review-Ready Full-time Leads (Priority: P2)

**Goal**: Operators can filter `Full-time` job opportunities by score, keyword, contact availability, stage, review status, provider status, analysis status, source, and run linkage without showing `Freelance` records.

**Independent Test**: Create mixed accepted job opportunities and verify filters isolate high-score, contactable, pending-review jobs while excluding `Freelance`.

### Tests for User Story 2

- [X] T042 [P] [US2] Add API contract tests for `/opportunities` review filters in `apps/api/tests/contract/test_job_review_filters_contract.py`
- [X] T043 [P] [US2] Add API integration tests for score, keyword, contact, status, provider, analysis, source, and run filters in `apps/api/tests/integration/test_job_review_filters.py`
- [X] T044 [P] [US2] Add API regression tests proving `Freelance` records are excluded from `Full-time` filters in `apps/api/tests/integration/test_job_review_freelance_isolation.py`
- [X] T045 [P] [US2] Add API integration tests for run-scoped review-ready opportunities in `apps/api/tests/integration/test_job_review_run_opportunities.py`

### Implementation for User Story 2

- [X] T046 [US2] Extend `list_opportunities` signature with review filter parameters in `apps/api/app/services/opportunity_service.py`
- [X] T047 [US2] Implement `min_score`, `review_status`, `analysis_status`, `job_stage`, and contact availability filters in `apps/api/app/services/opportunity_service.py`
- [X] T048 [US2] Implement keyword and missing-keyword text filters in `apps/api/app/services/opportunity_service.py`
- [X] T049 [US2] Implement provider status, source query, and run linkage filters in `apps/api/app/services/opportunity_service.py`
- [X] T050 [US2] Add query parameters for review filters to `list_opportunities_endpoint` in `apps/api/app/api/routes/opportunities.py`
- [X] T051 [US2] Add `analysis_status` and `min_score` filters to run candidates service query in `apps/api/app/services/job_search_run_service.py`
- [X] T052 [US2] Add `analysis_status` and `min_score` query parameters to run candidates route in `apps/api/app/api/routes/job_search_runs.py`
- [X] T053 [US2] Ensure run-scoped opportunities include review profile fields in `apps/api/app/api/routes/job_search_runs.py`
- [X] T054 [US2] Add database indexes for score/status/filter fields in `apps/api/alembic/versions/005_job_review_intelligence.py`
- [X] T055 [US2] Update API contract artifact for final filter names in `specs/005-job-review-intelligence/contracts/openapi.yaml`
- [X] T056 [US2] Run US2 API filter tests with `cd apps/api && python -m pytest tests/contract/test_job_review_filters_contract.py tests/integration/test_job_review_filters.py tests/integration/test_job_review_freelance_isolation.py tests/integration/test_job_review_run_opportunities.py`

**Checkpoint**: US2 works independently once foundational and US1 review fields exist.

---

## Phase 5: User Story 3 - Understand Analysis and Fallback Status (Priority: P3)

**Goal**: Runs and candidates show whether review fields came from deterministic-only analysis, valid AI assistance, fallback after AI failure, skipped analysis, or failed analysis.

**Independent Test**: Run the collection flow with AI disabled, AI valid, and AI invalid/unavailable, then confirm visible run/candidate/opportunity status and fallback behavior.

### Tests for User Story 3

- [X] T057 [P] [US3] Add API contract tests for run and candidate analysis status fields in `apps/api/tests/contract/test_job_review_analysis_contract.py`
- [X] T058 [P] [US3] Add worker unit tests for AI disabled, valid structured output, invalid JSON, incomplete output, timeout, and unavailable analyzer in `apps/worker/tests/unit/test_job_review_analyzer.py`
- [X] T059 [P] [US3] Add worker integration tests for run analysis counters and fallback persistence in `apps/worker/tests/integration/test_job_review_analysis_visibility.py`
- [X] T060 [P] [US3] Add worker integration tests for provider failure candidates using skipped analysis without fabricated opportunities in `apps/worker/tests/integration/test_job_review_provider_failures.py`
- [X] T061 [P] [US3] Add API integration tests for analysis status visibility on runs, candidates, and opportunities in `apps/api/tests/integration/test_job_review_analysis_visibility.py`

### Implementation for User Story 3

- [X] T062 [US3] Implement structured deterministic analyzer result object in `apps/worker/app/services/job_review_analyzer.py`
- [X] T063 [US3] Implement optional AI analyzer interface and disabled-by-default behavior in `apps/worker/app/services/job_review_analyzer.py`
- [X] T064 [US3] Validate AI structured output before persistence in `apps/worker/app/services/job_review_analyzer.py`
- [X] T065 [US3] Implement fallback status and error code/message mapping in `apps/worker/app/services/job_review_analyzer.py`
- [X] T066 [US3] Integrate analyzer statuses into candidate processing in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T067 [US3] Persist run-level analysis counters and aggregate analysis status in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T068 [US3] Add API-side analysis counter reconciliation for service-created candidates in `apps/api/app/services/job_search_run_service.py`
- [X] T069 [US3] Expose run analysis summary fields in `apps/api/app/schemas/job_search_run.py`
- [X] T070 [US3] Ensure provider failure, duplicate, and non-reviewable candidates use `analysis_status=skipped` in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T071 [US3] Update worker configuration documentation for optional AI analysis in `apps/worker/app/core/config.py`
- [X] T072 [US3] Run US3 API tests with `cd apps/api && python -m pytest tests/contract/test_job_review_analysis_contract.py tests/integration/test_job_review_analysis_visibility.py`
- [X] T073 [US3] Run US3 worker tests with `cd apps/worker && python -m pytest tests/unit/test_job_review_analyzer.py tests/integration/test_job_review_analysis_visibility.py tests/integration/test_job_review_provider_failures.py`

**Checkpoint**: US3 analysis visibility is independently functional.

---

## Phase 6: Historical Score Adjustment

**Purpose**: Add the clarified historical outcome adjustment shared by US1 and US2 after baseline review fields and filters exist.

- [X] T074 [P] Add API unit tests for historical similarity and adjustment calculations in `apps/api/tests/unit/test_job_review_historical_scoring.py`
- [X] T075 [P] Add worker unit tests for historical similarity and adjustment calculations in `apps/worker/tests/unit/test_job_review_historical_scoring.py`
- [X] T076 Add historical signal query helper using `review_status`, `job_stage`, matched keywords, and normalized roles in `apps/api/app/services/job_review_scoring.py`
- [X] T077 Add historical adjustment logic to worker scoring factors in `apps/worker/app/services/job_review_scoring.py`
- [X] T078 Persist `historical_similarity_signals` and `score_factors.historical_adjustment` from worker-created opportunities in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T079 Add integration tests for historical adjustments after `saved`, `responded`, `interview`, `rejected`, and `ignored` outcomes in `apps/api/tests/integration/test_job_review_historical_adjustment.py`
- [X] T080 Run historical scoring tests with `cd apps/api && python -m pytest tests/unit/test_job_review_historical_scoring.py tests/integration/test_job_review_historical_adjustment.py`
- [X] T081 Run worker historical scoring tests with `cd apps/worker && python -m pytest tests/unit/test_job_review_historical_scoring.py`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, cleanup, and handoff.

- [X] T082 [P] Update implementation notes in `specs/005-job-review-intelligence/quickstart.md`
- [X] T083 [P] Update API contract artifact after implementation details settle in `specs/005-job-review-intelligence/contracts/openapi.yaml`
- [X] T084 [P] Update product documentation for review intelligence status and scoring in `docs/search-improvements.md`
- [X] T085 [P] Update product documentation for Full-time review fields in `docs/bot-1-job-search.md`
- [X] T086 Run full API test suite with `cd apps/api && python -m pytest`
- [X] T087 Run full worker test suite with `cd apps/worker && python -m pytest`
- [X] T088 Run Docker Compose config validation with `docker compose config`
- [X] T089 Run Docker Compose quickstart validation from `specs/005-job-review-intelligence/quickstart.md`
- [X] T090 Update `docs/handoff.md` with implementation status, validation results, known Docker status, next step, and latest prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundation**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2 and is the MVP.
- **Phase 4 US2**: Depends on Phase 2 and the review fields produced by US1.
- **Phase 5 US3**: Depends on Phase 2 and can be implemented after or alongside US1 if review field persistence contracts are stable.
- **Phase 6 Historical Score Adjustment**: Depends on US1 review fields and benefits from US2 filters.
- **Phase 7 Polish**: Depends on all desired implementation phases.

### User Story Dependencies

- **US1 Review Prioritized Job Opportunities**: MVP, no dependency on US2 or US3 after foundation.
- **US2 Filter Review-Ready Full-time Leads**: Depends on review fields from US1 but remains independently testable through seeded data.
- **US3 Understand Analysis and Fallback Status**: Depends on shared analysis fields from foundation and can be validated through AI-disabled/fallback fixtures.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Apply migrations and schema fields before services.
- Implement services before routes.
- Run story-specific tests before moving to the next priority.

## Parallel Opportunities

- T002, T003, T004, T005, and T006 can run in parallel after T001.
- T012, T013, T014, and T015 can run in parallel after schema task definitions are understood.
- US1 tests T022 through T026 can run in parallel.
- US2 tests T042 through T045 can run in parallel.
- US3 tests T057 through T061 can run in parallel.
- Documentation tasks T082 through T085 can run in parallel after implementation behavior is stable.

## Parallel Example: User Story 1

```bash
Task: "T022 [US1] Add API contract tests for opportunity review profile response fields in apps/api/tests/contract/test_job_review_opportunities_contract.py"
Task: "T023 [US1] Add API integration tests for review-ready opportunity detail defaults and source preservation in apps/api/tests/integration/test_job_review_opportunity_detail.py"
Task: "T025 [US1] Add worker unit tests for deterministic score explanation, missing keywords, seniority, modality, and location detection in apps/worker/tests/unit/test_job_review_scoring.py"
```

## Parallel Example: User Story 2

```bash
Task: "T042 [US2] Add API contract tests for /opportunities review filters in apps/api/tests/contract/test_job_review_filters_contract.py"
Task: "T043 [US2] Add API integration tests for score, keyword, contact, status, provider, analysis, source, and run filters in apps/api/tests/integration/test_job_review_filters.py"
Task: "T044 [US2] Add API regression tests proving Freelance records are excluded from Full-time filters in apps/api/tests/integration/test_job_review_freelance_isolation.py"
```

## Parallel Example: User Story 3

```bash
Task: "T057 [US3] Add API contract tests for run and candidate analysis status fields in apps/api/tests/contract/test_job_review_analysis_contract.py"
Task: "T058 [US3] Add worker unit tests for AI disabled, valid structured output, invalid JSON, incomplete output, timeout, and unavailable analyzer in apps/worker/tests/unit/test_job_review_analyzer.py"
Task: "T060 [US3] Add worker integration tests for provider failure candidates using skipped analysis without fabricated opportunities in apps/worker/tests/integration/test_job_review_provider_failures.py"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation and migration.
3. Complete Phase 3 US1.
4. Validate US1 with accepted supplied-content run and opportunity detail review fields.
5. Stop and review before adding filters, AI fallback, and historical adjustment complexity.

### Incremental Delivery

1. Foundation creates additive schema and review contracts.
2. US1 makes every accepted `job` opportunity review-ready.
3. US2 adds operational filters for the future `Full-time` list.
4. US3 adds AI/fallback visibility and run/candidate analysis summaries.
5. Historical adjustment refines scoring without replacing current evidence.
6. Polish validates docs, tests, and quickstart.

### Risk Controls

- Keep all schema changes additive and defaulted for existing records.
- Keep AI disabled by default until valid structured output tests pass.
- Never allow analysis failure to fabricate accepted opportunities.
- Keep `review_status` independent from `job_stage`.
- Enforce `opportunity_type=job` in `Full-time` filters.
