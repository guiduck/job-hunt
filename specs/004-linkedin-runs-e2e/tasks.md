# Tasks: LinkedIn Runs End-to-End Execution

**Input**: Design documents from `specs/004-linkedin-runs-e2e/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included because the feature specification explicitly requires automated coverage for worker loop behavior, persistence, lifecycle transitions, stale running recovery, provider failures, deduplication, and contract-visible response fields.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `specs/004-linkedin-runs-e2e/plan.md`, after planning the worker loop, persisted collection inputs, lifecycle metrics, stale running recovery, broad English/Portuguese LinkedIn contact invitation detection, contracts, and Docker quickstart.

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare contracts, configuration, and dependency baselines for end-to-end API/worker execution.

- [X] T001 Review existing API and worker dependency boundaries for shared SQLAlchemy model/service reuse in `apps/api/pyproject.toml` and `apps/worker/pyproject.toml`
- [X] T002 [P] Add worker settings for loop mode, poll interval, stale-running handling, and max runs per loop in `apps/worker/app/core/config.py`
- [X] T003 [P] Add or confirm API/worker database URL examples for the shared PostgreSQL connection in `.env.example`
- [X] T004 [P] Review Docker Compose service naming and shared environment variables for PostgreSQL, API, and worker in `docker-compose.yml`
- [X] T005 [P] Add task-generation status and latest prompt notes in `docs/handoff.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared persistence primitives required before any user story can process API-created runs end-to-end.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 [P] Add API model support for persisted LinkedIn collection inputs in `apps/api/app/models/job_search_run.py`
- [X] T007 [P] Add API schema support for persisted LinkedIn collection inputs and stale provider error fields in `apps/api/app/schemas/job_search_run.py`
- [X] T008 Create additive Alembic migration for persisted collection inputs or equivalent run JSON field in `apps/api/alembic/versions/004_linkedin_runs_e2e.py`
- [X] T009 Update API run creation to persist `collection_inputs` for asynchronous worker consumption in `apps/api/app/services/job_search_run_service.py`
- [X] T010 [P] Add worker access to API models/services or extracted shared persistence helpers in `apps/worker/app/db/session.py`
- [X] T011 [P] Add worker tests fixtures for PostgreSQL/session-backed run processing in `apps/worker/tests/conftest.py`
- [X] T012 [P] Add API migration test for persisted collection inputs in `apps/api/tests/integration/test_linkedin_runs_e2e_migration.py`
- [X] T013 [P] Add API schema tests for collection input persistence and stale failure response fields in `apps/api/tests/unit/test_linkedin_runs_e2e_schema.py`
- [X] T014 Update OpenAPI contract baseline with persisted input and stale failure expectations in `specs/004-linkedin-runs-e2e/contracts/openapi.yaml`

**Checkpoint**: Foundation ready - API-created runs have all source inputs and fields needed for worker-side processing.

---

## Phase 3: User Story 1 - Process Pending Runs Automatically (Priority: P1) MVP

**Goal**: A run created through the API is picked up by the separate worker and reaches a terminal status without a manual internal processing call.

**Independent Test**: Create a pending run in the shared database, run the worker loop once or as a short polling process, and verify the run transitions from `pending` to `running` to a terminal status.

### Tests for User Story 1

- [X] T015 [P] [US1] Add worker unit tests for selecting pending runs and ignoring non-pending runs in `apps/worker/tests/unit/test_linkedin_worker_loop.py`
- [X] T016 [P] [US1] Add worker unit tests for claiming a pending run as `running` with `started_at` in `apps/worker/tests/unit/test_linkedin_worker_loop.py`
- [X] T017 [P] [US1] Add worker integration test for processing an API-created pending run with supplied public content in `apps/worker/tests/integration/test_linkedin_runs_e2e_worker_loop.py`
- [X] T018 [P] [US1] Add API integration test showing run remains pending immediately after creation and is inspectable before worker processing in `apps/api/tests/integration/test_linkedin_runs_e2e_lifecycle.py`
- [X] T019 [P] [US1] Add contract test for `POST /job-search-runs` and `GET /job-search-runs/{run_id}` lifecycle fields in `apps/api/tests/contract/test_linkedin_runs_e2e_contract.py`

### Implementation for User Story 1

- [X] T020 [US1] Implement pending-run query and claim helpers in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T021 [US1] Implement one-run processing orchestration using persisted run keywords, hiring-intent terms, collection inputs, and candidate limit in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T022 [US1] Replace placeholder `process_pending_runs()` with loop/run-once behavior in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T023 [US1] Update worker entrypoint to run the polling loop with configuration and graceful no-pending behavior in `apps/worker/app/main.py`
- [X] T024 [US1] Ensure run lifecycle helper methods set `running`, terminal status, `started_at`, and `completed_at` consistently in `apps/api/app/services/job_search_run_service.py`
- [X] T025 [US1] Wire worker collection inputs into existing `collect_and_inspect_candidates()` without running inside API request handlers in `apps/worker/app/jobs/linkedin_job_search.py`

**Checkpoint**: User Story 1 is complete when the worker can process an API-created pending run without a manual internal call.

---

## Phase 4: User Story 2 - Persist Candidate Outcomes and Accepted Opportunities (Priority: P2)

**Goal**: Every inspected candidate is persisted with source evidence/outcome, and only contactable candidates create accepted `job` opportunities visible through run-scoped and global views.

**Independent Test**: Process mixed supplied candidates with public email, explicit LinkedIn contact invitation, missing contact, weak evidence, and duplicates; verify candidates and accepted opportunities are visible through the documented endpoints.

### Tests for User Story 2

- [X] T026 [P] [US2] Add worker parser tests for broad English and Portuguese LinkedIn contact invitation phrases in `apps/worker/tests/unit/test_linkedin_candidate_parser.py`
- [X] T027 [P] [US2] Add worker parser test rejecting loose poster profile URLs without explicit contact invitation in `apps/worker/tests/unit/test_linkedin_candidate_parser.py`
- [X] T028 [P] [US2] Add worker integration test for persisted accepted email and LinkedIn contact candidates from supplied content in `apps/worker/tests/integration/test_linkedin_runs_e2e_persistence.py`
- [X] T029 [P] [US2] Add API integration test for `/job-search-runs/{run_id}/candidates` candidate outcome visibility in `apps/api/tests/integration/test_linkedin_runs_e2e_candidates.py`
- [X] T030 [P] [US2] Add API integration test for `/job-search-runs/{run_id}/opportunities` and `/opportunities?opportunity_type=job` visibility in `apps/api/tests/integration/test_linkedin_runs_e2e_opportunities.py`
- [X] T031 [P] [US2] Add API integration test for duplicate candidate persistence without duplicate accepted opportunities in `apps/api/tests/integration/test_linkedin_runs_e2e_deduplication.py`
- [X] T032 [P] [US2] Add contract tests for candidate and opportunity response fields from `specs/004-linkedin-runs-e2e/contracts/openapi.yaml` in `apps/api/tests/contract/test_linkedin_runs_e2e_contract.py`

### Implementation for User Story 2

- [X] T033 [US2] Move LinkedIn contact invitation phrase catalog into maintainable parser constants in `apps/worker/app/services/linkedin_candidate_parser.py`
- [X] T034 [US2] Ensure parser preserves contact invitation evidence, poster profile URL, source query, source type, provider status, and matched keywords in `apps/worker/app/services/linkedin_candidate_parser.py`
- [X] T035 [US2] Ensure normalizer accepts only public email or explicit LinkedIn contact invitation with poster profile URL in `apps/worker/app/services/job_candidate_normalizer.py`
- [X] T036 [US2] Persist each normalized candidate through run recording logic during worker processing in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T037 [US2] Ensure candidate recording creates accepted `job` opportunities and links `opportunity_id` for accepted/duplicate outcomes in `apps/api/app/services/job_search_run_service.py`
- [X] T038 [US2] Ensure opportunity creation preserves contact channel, poster profile URL, collection source type, hiring-intent term, matched keywords, source evidence, and dedupe key in `apps/api/app/services/opportunity_service.py`
- [X] T039 [US2] Ensure run-scoped opportunity listing returns accepted opportunities with populated job detail in `apps/api/app/api/routes/job_search_runs.py`
- [X] T040 [US2] Ensure global opportunity filtering by `opportunity_type=job` returns accepted LinkedIn jobs in `apps/api/app/api/routes/opportunities.py`

**Checkpoint**: User Story 2 is complete when all inspected candidates are visible and only contactable accepted candidates create linked `job` opportunities.

---

## Phase 5: User Story 3 - Make Lifecycle Metrics and Provider Failures Visible (Priority: P3)

**Goal**: Run counters, cap status, aggregate provider status, provider errors, stale recovery, and failure outcomes are visible and internally consistent.

**Independent Test**: Execute runs against empty, blocked, inaccessible, malformed, duplicate, stale, and valid supplied sources; verify status, counters, provider status/error, candidates, and opportunities remain coherent.

### Tests for User Story 3

- [X] T041 [P] [US3] Add worker unit tests for final run status selection `completed`, `completed_no_results`, and `failed` in `apps/worker/tests/unit/test_linkedin_worker_lifecycle.py`
- [X] T042 [P] [US3] Add worker unit tests for aggregate provider status `collected`, `partial`, `blocked`, `inaccessible`, `empty`, and `failed` in `apps/worker/tests/unit/test_linkedin_worker_lifecycle.py`
- [X] T043 [P] [US3] Add worker unit tests for stale `running` run recovery to failed/stale without reprocessing in `apps/worker/tests/unit/test_linkedin_worker_stale_runs.py`
- [X] T044 [P] [US3] Add integration test for blocked/inaccessible/empty provider outcomes creating zero opportunities in `apps/worker/tests/integration/test_linkedin_runs_e2e_failures.py`
- [X] T045 [P] [US3] Add API integration test for counter reconciliation across accepted, rejected, duplicate, and provider-failed candidates in `apps/api/tests/integration/test_linkedin_runs_e2e_metrics.py`
- [X] T046 [P] [US3] Add contract test for stale failure fields `provider_error_code=stale_running` and terminal timestamps in `apps/api/tests/contract/test_linkedin_runs_e2e_contract.py`

### Implementation for User Story 3

- [X] T047 [US3] Implement aggregate provider status calculation from candidate outcomes in `apps/api/app/services/job_search_run_service.py`
- [X] T048 [US3] Implement run counter reconciliation and cap handling after worker candidate recording in `apps/api/app/services/job_search_run_service.py`
- [X] T049 [US3] Implement stale `running` run recovery helper with `provider_error_code=stale_running` in `apps/api/app/services/job_search_run_service.py`
- [X] T050 [US3] Call stale run recovery on worker startup before processing pending runs in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T051 [US3] Ensure provider failure candidates never call opportunity creation in `apps/api/app/services/job_search_run_service.py`
- [X] T052 [US3] Ensure failed/blocked/empty/inaccessible provider messages are exposed through schemas in `apps/api/app/schemas/job_search_run.py`
- [X] T053 [US3] Ensure list/detail route filters expose provider status for runs and candidate outcomes in `apps/api/app/api/routes/job_search_runs.py`

**Checkpoint**: User Story 3 is complete when visible lifecycle metrics and provider failures are coherent and no failure path fabricates opportunities.

---

## Phase 6: User Story 4 - Validate the Local End-to-End Quickstart (Priority: P4)

**Goal**: Documentation, contracts, schemas, and Docker Compose validation match the real local behavior for API, worker, and PostgreSQL together.

**Independent Test**: Follow `specs/004-linkedin-runs-e2e/quickstart.md` from a clean local stack and verify run creation, worker processing, candidate visibility, opportunity visibility, duplicate behavior, provider failure visibility, and stale recovery.

### Tests for User Story 4

- [X] T054 [P] [US4] Add API contract/schema parity test against `specs/004-linkedin-runs-e2e/contracts/openapi.yaml` in `apps/api/tests/contract/test_linkedin_runs_e2e_contract.py`
- [X] T055 [P] [US4] Add Docker-oriented smoke test notes or script for quickstart curl examples in `specs/004-linkedin-runs-e2e/quickstart.md`
- [X] T056 [P] [US4] Add integration test for supplied-content quickstart flow in `apps/api/tests/integration/test_linkedin_runs_e2e_quickstart.py`

### Implementation for User Story 4

- [X] T057 [US4] Update Docker Compose to include API and worker services sharing PostgreSQL in `docker-compose.yml`
- [X] T058 [US4] Update API environment defaults for Docker Compose database connectivity in `apps/api/app/core/config.py`
- [X] T059 [US4] Update worker environment defaults for Docker Compose database connectivity and loop configuration in `apps/worker/app/core/config.py`
- [X] T060 [US4] Update final curl examples and expected responses in `specs/004-linkedin-runs-e2e/quickstart.md`
- [X] T061 [US4] Review implemented schemas against generated contract and update `specs/004-linkedin-runs-e2e/contracts/openapi.yaml`
- [ ] T062 [US4] Run Docker Compose end-to-end validation and record result/troubleshooting notes in `specs/004-linkedin-runs-e2e/quickstart.md`

**Checkpoint**: User Story 4 is complete when another operator can reproduce the documented local end-to-end flow.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Regression checks, cleanup, documentation sync, and handoff after all desired user stories.

- [X] T063 [P] Run worker unit and integration tests in `apps/worker/tests/`
- [X] T064 [P] Run API unit, contract, and integration tests in `apps/api/tests/`
- [X] T065 Run full local pytest suites for API and worker in `apps/api/tests/` and `apps/worker/tests/`
- [X] T066 [P] Update product documentation for operational worker behavior and broad contact-invitation detection in `docs/bot-1-job-search.md`
- [X] T067 [P] Update action-plan status for completed end-to-end LinkedIn run flow in `docs/action-plan.md`
- [X] T068 Update `docs/handoff.md` with implementation completion status, tests run, Docker validation status, unresolved gaps, and latest prompt
- [X] T069 Review `specs/004-linkedin-runs-e2e/spec.md`, `plan.md`, `data-model.md`, `contracts/openapi.yaml`, and `quickstart.md` for implementation drift
- [X] T070 Remove stale generated caches or accidental runtime artifacts before handoff in `apps/api/` and `apps/worker/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP worker-processing path.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from US1 processing, but parser/normalizer/API persistence tests can be written in parallel with US1.
- **User Story 3 (Phase 5)**: Depends on Foundational and lifecycle primitives; can begin once US1 run processing exists.
- **User Story 4 (Phase 6)**: Depends on desired US1-US3 behavior being implemented enough to document and validate.
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Required MVP; no dependency on other stories after foundation.
- **US2 (P2)**: Uses the processing path from US1 for full end-to-end validation, but contact parser/normalizer work remains independently testable.
- **US3 (P3)**: Uses run processing and candidate persistence from US1/US2 to validate aggregate metrics and failures.
- **US4 (P4)**: Validates and documents the combined behavior after implementation.

### Within Each User Story

- Tests first, then models/schemas, then services, then routes/entrypoints, then integration.
- Keep long-running LinkedIn collection outside HTTP request handlers.
- Preserve accepted opportunity creation through the existing opportunity service.
- Do not add email sending, automated applications, resume parsing, UI, AI scoring, or freelance prospecting.

### Parallel Opportunities

- Setup tasks T002-T005 can run in parallel.
- Foundational tests T011-T013 can run in parallel after the intended persisted input shape is clear.
- US1 tests T015-T019 can run in parallel before implementation.
- US2 tests T026-T032 can run in parallel before implementation.
- US3 tests T041-T046 can run in parallel before implementation.
- US4 tests T054-T056 can run in parallel before Docker/quickstart implementation.
- Polish documentation tasks T066-T067 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Add worker unit tests for selecting pending runs and ignoring non-pending runs in apps/worker/tests/unit/test_linkedin_worker_loop.py"
Task: "Add worker unit tests for claiming a pending run as running with started_at in apps/worker/tests/unit/test_linkedin_worker_loop.py"
Task: "Add worker integration test for processing an API-created pending run with supplied public content in apps/worker/tests/integration/test_linkedin_runs_e2e_worker_loop.py"
Task: "Add API integration test showing run remains pending immediately after creation and is inspectable before worker processing in apps/api/tests/integration/test_linkedin_runs_e2e_lifecycle.py"
Task: "Add contract test for POST /job-search-runs and GET /job-search-runs/{run_id} lifecycle fields in apps/api/tests/contract/test_linkedin_runs_e2e_contract.py"
```

## Parallel Example: User Story 2

```bash
Task: "Add worker parser tests for broad English and Portuguese LinkedIn contact invitation phrases in apps/worker/tests/unit/test_linkedin_candidate_parser.py"
Task: "Add worker integration test for persisted accepted email and LinkedIn contact candidates from supplied content in apps/worker/tests/integration/test_linkedin_runs_e2e_persistence.py"
Task: "Add API integration test for /job-search-runs/{run_id}/candidates candidate outcome visibility in apps/api/tests/integration/test_linkedin_runs_e2e_candidates.py"
Task: "Add API integration test for /job-search-runs/{run_id}/opportunities and /opportunities?opportunity_type=job visibility in apps/api/tests/integration/test_linkedin_runs_e2e_opportunities.py"
Task: "Add contract tests for candidate and opportunity response fields from specs/004-linkedin-runs-e2e/contracts/openapi.yaml in apps/api/tests/contract/test_linkedin_runs_e2e_contract.py"
```

## Parallel Example: User Story 3

```bash
Task: "Add worker unit tests for final run status selection completed, completed_no_results, and failed in apps/worker/tests/unit/test_linkedin_worker_lifecycle.py"
Task: "Add worker unit tests for aggregate provider status collected, partial, blocked, inaccessible, empty, and failed in apps/worker/tests/unit/test_linkedin_worker_lifecycle.py"
Task: "Add worker unit tests for stale running run recovery to failed/stale without reprocessing in apps/worker/tests/unit/test_linkedin_worker_stale_runs.py"
Task: "Add integration test for blocked/inaccessible/empty provider outcomes creating zero opportunities in apps/worker/tests/integration/test_linkedin_runs_e2e_failures.py"
Task: "Add API integration test for counter reconciliation across accepted, rejected, duplicate, and provider-failed candidates in apps/api/tests/integration/test_linkedin_runs_e2e_metrics.py"
```

## Parallel Example: User Story 4

```bash
Task: "Add API contract/schema parity test against specs/004-linkedin-runs-e2e/contracts/openapi.yaml in apps/api/tests/contract/test_linkedin_runs_e2e_contract.py"
Task: "Add Docker-oriented smoke test notes or script for quickstart curl examples in specs/004-linkedin-runs-e2e/quickstart.md"
Task: "Add integration test for supplied-content quickstart flow in apps/api/tests/integration/test_linkedin_runs_e2e_quickstart.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational persistence for collection inputs and worker DB access.
3. Complete Phase 3 User Story 1.
4. Validate that an API-created pending run is processed by the worker without manual internal invocation.
5. Stop and confirm the worker boundary before expanding acceptance, failure, and Docker validation.

### Incremental Delivery

1. US1: worker loop, pending-run claim, one-run processing, terminal lifecycle.
2. US2: candidate persistence, contact acceptance, broad contact invitation detection, dedupe, and opportunity visibility.
3. US3: lifecycle metrics, provider failure visibility, cap status, stale running recovery, and no fabricated opportunities.
4. US4: Docker Compose local stack, contract/schema review, quickstart validation, and reproducible handoff.
5. Polish: full regression suites, docs sync, handoff update, and cleanup.

### Parallel Team Strategy

With multiple workers:

1. Complete Setup and Foundational tasks together.
2. After Phase 2, split tests by story while US1 implementation begins.
3. Implement parser/normalizer contact detection tasks in US2 in parallel with worker loop tasks when file ownership does not overlap.
4. Delay Docker quickstart validation until US1-US3 behavior is available.

## Notes

- `[P]` tasks use different files or can be developed without depending on incomplete task outputs.
- Every user story remains independently testable at its checkpoint.
- Keep platform-boundary failures visible instead of fabricating opportunities.
- Keep email sending, resume attachments, UI, AI scoring, and freelance prospecting out of this feature.
