# Tasks: LinkedIn Job Bot Foundation

**Input**: Design documents from `specs/002-linkedin-job-bot/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included because the implementation plan requires pytest with API, service, worker, and database integration tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks`

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the local backend/worker skeleton and development configuration.

- [x] T001 Create PostgreSQL local service configuration in `docker-compose.yml`
- [x] T002 Create environment variable template for API, worker, and PostgreSQL in `.env.example`
- [x] T003 [P] Create FastAPI project metadata and dependencies in `apps/api/pyproject.toml`
- [x] T004 [P] Create worker project metadata and dependencies in `apps/worker/pyproject.toml`
- [x] T005 [P] Create FastAPI application entrypoint in `apps/api/app/main.py`
- [x] T006 [P] Create worker application entrypoint in `apps/worker/app/main.py`
- [x] T007 [P] Add API package markers in `apps/api/app/__init__.py`
- [x] T008 [P] Add worker package markers in `apps/worker/app/__init__.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core configuration, database, routing, and test infrastructure required before user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T009 Configure API settings loader in `apps/api/app/core/config.py`
- [x] T010 Configure API database engine/session helpers in `apps/api/app/db/session.py`
- [x] T011 Configure Alembic migration environment in `apps/api/alembic/env.py`
- [x] T012 [P] Configure API pytest fixtures for database integration tests in `apps/api/tests/conftest.py`
- [x] T013 [P] Configure worker pytest fixtures in `apps/worker/tests/conftest.py`
- [x] T014 Create base API router registration in `apps/api/app/api/router.py`
- [x] T015 Create shared error response helpers in `apps/api/app/api/errors.py`
- [x] T016 Create worker settings loader in `apps/worker/app/core/config.py`
- [x] T017 Create worker database/session access in `apps/worker/app/db/session.py`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Prepare Local Opportunity Storage (Priority: P1) MVP

**Goal**: Provide repeatable local storage for captured `job` opportunities with source query, keywords, and evidence.

**Independent Test**: Start the local environment, apply migrations, save one sample `job` opportunity, retrieve it, and restart the environment without losing data.

### Tests for User Story 1

- [x] T018 [P] [US1] Add migration integration test for opportunity storage in `apps/api/tests/integration/test_opportunity_storage_migration.py`
- [x] T019 [P] [US1] Add API integration test for creating and retrieving a sample job opportunity in `apps/api/tests/integration/test_job_opportunity_storage.py`
- [x] T020 [P] [US1] Add unit tests for job opportunity validation rules in `apps/api/tests/unit/test_job_opportunity_validation.py`

### Implementation for User Story 1

- [x] T021 [P] [US1] Implement opportunity, job detail, keyword set, and keyword match models in `apps/api/app/models/opportunity.py`
- [x] T022 [P] [US1] Implement opportunity and job detail schemas in `apps/api/app/schemas/opportunity.py`
- [x] T023 [US1] Create initial Alembic migration for opportunities, job details, keyword sets, and keyword matches in `apps/api/alembic/versions/001_local_opportunity_storage.py`
- [x] T024 [US1] Implement opportunity persistence and retrieval service in `apps/api/app/services/opportunity_service.py`
- [x] T025 [US1] Implement opportunity create/list/detail routes in `apps/api/app/api/routes/opportunities.py`
- [x] T026 [US1] Register opportunity routes in `apps/api/app/api/router.py`
- [x] T027 [US1] Seed fallback job keyword set (`reactjs`, `typescript`, `nextjs`, `nodejs`) in `apps/api/app/db/seed.py`
- [x] T028 [US1] Document local storage setup and reset commands in `specs/002-linkedin-job-bot/quickstart.md`

**Checkpoint**: User Story 1 is complete when a sample `job` opportunity can be saved, retrieved, and retained across local restarts.

---

## Phase 4: User Story 2 - Run a LinkedIn Job Search Skeleton (Priority: P2)

**Goal**: Allow the operator to start a backend-triggered LinkedIn job-search run, inspect status, and persist accepted candidates from worker execution.

**Independent Test**: Start a run through backend operations, inspect run status, verify no more than 50 candidates are inspected, and confirm accepted candidates become structured `job` opportunities.

### Tests for User Story 2

- [x] T029 [P] [US2] Add contract tests for `/job-search-runs` endpoints in `apps/api/tests/contract/test_job_search_runs_contract.py`
- [x] T030 [P] [US2] Add API integration tests for start/status/candidates/opportunities flow in `apps/api/tests/integration/test_job_search_runs_api.py`
- [x] T031 [P] [US2] Add worker unit tests for LinkedIn candidate parsing in `apps/worker/tests/unit/test_linkedin_candidate_parser.py`
- [x] T032 [P] [US2] Add worker unit tests for candidate normalization and rejection outcomes in `apps/worker/tests/unit/test_job_candidate_normalizer.py`
- [x] T033 [P] [US2] Add worker integration test for the 50-candidate cap and run metrics in `apps/worker/tests/integration/test_linkedin_job_search_run.py`

### Implementation for User Story 2

- [x] T034 [P] [US2] Implement job search run and candidate models in `apps/api/app/models/job_search_run.py`
- [x] T035 [P] [US2] Implement job search run and candidate schemas in `apps/api/app/schemas/job_search_run.py`
- [x] T036 [US2] Create Alembic migration for job search runs and candidates in `apps/api/alembic/versions/002_job_search_runs.py`
- [x] T037 [US2] Implement run lifecycle, fallback keyword resolution, status metrics, and cap tracking in `apps/api/app/services/job_search_run_service.py`
- [x] T038 [US2] Implement `/job-search-runs` API routes from the OpenAPI contract in `apps/api/app/api/routes/job_search_runs.py`
- [x] T039 [US2] Register job search run routes in `apps/api/app/api/router.py`
- [x] T040 [P] [US2] Implement LinkedIn candidate parser with public-data and failure handling in `apps/worker/app/services/linkedin_candidate_parser.py`
- [x] T041 [P] [US2] Implement candidate normalizer, contact extraction, evidence validation, and outcome mapping in `apps/worker/app/services/job_candidate_normalizer.py`
- [x] T042 [US2] Implement worker job orchestration for backend-triggered LinkedIn search runs in `apps/worker/app/jobs/linkedin_job_search.py`
- [x] T043 [US2] Wire worker entrypoint to process pending job search runs in `apps/worker/app/main.py`

**Checkpoint**: User Story 2 is complete when a backend-triggered run produces durable status, candidate outcomes, accepted opportunities, cap metrics, and visible failures without running search in the HTTP request handler.

---

## Phase 5: User Story 3 - Review Captured Job Leads Safely (Priority: P3)

**Goal**: Ensure captured `job` opportunities are reviewable, deduplicated, and separated from future `freelance` records.

**Independent Test**: Capture multiple sample job opportunities and confirm the list/detail views expose job-specific structured fields, avoid duplicates, and never mix with freelance prospects.

### Tests for User Story 3

- [x] T044 [P] [US3] Add API integration tests for job-only opportunity filtering in `apps/api/tests/integration/test_job_opportunity_filters.py`
- [x] T045 [P] [US3] Add service unit tests for dedupe key generation and duplicate candidate linking in `apps/api/tests/unit/test_job_opportunity_dedupe.py`
- [x] T046 [P] [US3] Add API integration tests for updating `job_stage` and operator notes in `apps/api/tests/integration/test_job_opportunity_review.py`

### Implementation for User Story 3

- [x] T047 [P] [US3] Implement dedupe key generation helpers in `apps/api/app/services/job_dedupe.py`
- [x] T048 [US3] Integrate duplicate detection and existing opportunity linking in `apps/api/app/services/opportunity_service.py`
- [x] T049 [US3] Extend opportunity list/detail schemas with job description, contact channel, dedupe key, source evidence, and matched keywords in `apps/api/app/schemas/opportunity.py`
- [x] T050 [US3] Extend opportunity routes for `opportunity_type=job`, `contact_channel`, and `matched_keyword` filters in `apps/api/app/api/routes/opportunities.py`
- [x] T051 [US3] Implement job review updates for `job_stage` and `operator_notes` in `apps/api/app/services/opportunity_service.py`

**Checkpoint**: User Story 3 is complete when accepted `job` opportunities are filterable, reviewable, deduplicated, and isolated from freelance records.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and cleanup across all stories.

- [x] T052 [P] Update OpenAPI contract examples for job search runs and job opportunities in `specs/002-linkedin-job-bot/contracts/openapi.yaml`
- [x] T053 [P] Update quickstart validation commands and expected responses in `specs/002-linkedin-job-bot/quickstart.md`
- [x] T054 [P] Add implementation notes for LinkedIn public-data limitations in `docs/bot-1-job-search.md`
- [x] T055 Run full API and worker pytest suites and record fixes in `apps/api/tests/` and `apps/worker/tests/`
- [ ] T056 Run quickstart validation end-to-end using `specs/002-linkedin-job-bot/quickstart.md`
- [x] T057 Update `docs/handoff.md` with implementation status, next step, and latest prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP storage foundation.
- **User Story 2 (Phase 4)**: Depends on Foundational and uses US1 persistence to store accepted opportunities.
- **User Story 3 (Phase 5)**: Depends on US1 storage and can be integrated with US2 accepted run output.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after Foundational.
- **US2 (P2)**: Requires US1 persistence service and models for accepted opportunities.
- **US3 (P3)**: Requires US1 opportunity records; best validated after US2 generates accepted candidates.

### Within Each User Story

- Tests first, then models/schemas, then migrations, then services, then routes/integration.
- Keep worker search execution outside HTTP request handlers.
- Preserve `opportunity_type=job` on all accepted opportunities.
- Do not add outreach sending, resume parsing, full UI, AI scoring, or freelance prospecting.

### Parallel Opportunities

- Setup tasks T003-T008 can run in parallel after T001-T002 are understood.
- Foundational test fixtures T012-T013 can run in parallel with config/session tasks T009-T011.
- US1 tests T018-T020 can run in parallel before implementation.
- US2 tests T029-T033 can run in parallel before implementation.
- US2 worker services T040-T041 can run in parallel after schemas/models are drafted.
- US3 tests T044-T046 can run in parallel before implementation.
- Polish documentation tasks T052-T054 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Add migration integration test for opportunity storage in apps/api/tests/integration/test_opportunity_storage_migration.py"
Task: "Add API integration test for creating and retrieving a sample job opportunity in apps/api/tests/integration/test_job_opportunity_storage.py"
Task: "Add unit tests for job opportunity validation rules in apps/api/tests/unit/test_job_opportunity_validation.py"
Task: "Implement opportunity and job detail schemas in apps/api/app/schemas/opportunity.py"
```

## Parallel Example: User Story 2

```bash
Task: "Add contract tests for /job-search-runs endpoints in apps/api/tests/contract/test_job_search_runs_contract.py"
Task: "Add worker unit tests for LinkedIn candidate parsing in apps/worker/tests/unit/test_linkedin_candidate_parser.py"
Task: "Implement LinkedIn candidate parser with public-data and failure handling in apps/worker/app/services/linkedin_candidate_parser.py"
Task: "Implement candidate normalizer, contact extraction, evidence validation, and outcome mapping in apps/worker/app/services/job_candidate_normalizer.py"
```

## Parallel Example: User Story 3

```bash
Task: "Add API integration tests for job-only opportunity filtering in apps/api/tests/integration/test_job_opportunity_filters.py"
Task: "Add service unit tests for dedupe key generation and duplicate candidate linking in apps/api/tests/unit/test_job_opportunity_dedupe.py"
Task: "Implement dedupe key generation helpers in apps/api/app/services/job_dedupe.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational configuration and test fixtures.
3. Complete Phase 3 User Story 1.
4. Validate local storage independently by creating and retrieving a sample `job` opportunity.
5. Stop and confirm local persistence before adding automated search.

### Incremental Delivery

1. US1: local data foundation and sample `job` opportunity persistence.
2. US2: backend-triggered run lifecycle and worker-generated accepted opportunities.
3. US3: review, filtering, deduplication, and lane separation.
4. Polish: update docs/contracts and run quickstart validation.

### Validation Gates

- After US1: sample job opportunity persists across local restart.
- After US2: run status and candidate outcomes are visible, capped at 50 candidates, and accepted records include contact/evidence.
- After US3: job opportunities are deduplicated, filterable, and separated from freelance records.

## Notes

- `[P]` tasks use different files and can be worked in parallel.
- Every story phase remains independently testable at its checkpoint.
- Keep platform-boundary failures visible instead of fabricating opportunities.
- Keep email sending, resume attachments, UI, AI scoring, and freelance prospecting out of this feature.
