# Tasks: LinkedIn Search Provider

**Input**: Design documents from `specs/003-linkedin-search-provider/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included because the implementation plan and quickstart require pytest coverage for provider/fetcher, parser, normalizer, contracts, persistence, deduplication, and provider failure states.

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

**Purpose**: Prepare dependencies, configuration, and contract baselines for the incremental provider implementation.

- [x] T001 Review existing API and worker dependencies for provider needs in `apps/api/pyproject.toml` and `apps/worker/pyproject.toml`
- [x] T002 Add worker HTTP/HTML retrieval dependencies for public-source fetching in `apps/worker/pyproject.toml`
- [x] T003 [P] Add provider configuration defaults for hiring-intent terms, request timeout, and user agent in `apps/worker/app/core/config.py`
- [x] T004 [P] Add API schema defaults for hiring-intent terms and collection source inputs in `apps/api/app/schemas/job_search_run.py`
- [x] T005 [P] Add shared provider constants for source types, provider statuses, and contact priority in `apps/worker/app/services/linkedin_search_provider.py`
- [x] T006 [P] Update OpenAPI contract copy with implementation-aligned request examples in `specs/003-linkedin-search-provider/contracts/openapi.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add additive storage and shared data contract changes required before any story can persist real provider output.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Add provider/source metadata columns and candidate outcome enum values in `apps/api/app/models/job_search_run.py`
- [x] T008 Add job detail fields for poster profile URL, contact priority, hiring-intent term, and collection source type in `apps/api/app/models/opportunity.py`
- [x] T009 Create additive Alembic migration for provider metadata in `apps/api/alembic/versions/003_linkedin_search_provider.py`
- [x] T010 Update job search run schemas with provider status, hiring-intent terms, collection source types, and collection inputs in `apps/api/app/schemas/job_search_run.py`
- [x] T011 Update opportunity schemas with poster profile URL, contact priority, hiring-intent term, and collection source type in `apps/api/app/schemas/opportunity.py`
- [x] T012 Update job search run service to persist new run request fields and provider defaults in `apps/api/app/services/job_search_run_service.py`
- [x] T013 Update opportunity persistence to store new job detail metadata fields in `apps/api/app/services/opportunity_service.py`
- [x] T014 Update API job search run routes to expose provider status and collection source filters in `apps/api/app/api/routes/job_search_runs.py`
- [x] T015 [P] Add migration tests for provider metadata columns in `apps/api/tests/integration/test_linkedin_provider_migration.py`
- [x] T016 [P] Add API schema tests for collection input validation in `apps/api/tests/unit/test_job_search_run_collection_schema.py`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Collect Real Job Candidates (Priority: P1) MVP

**Goal**: Start a run that searches public LinkedIn publications using hiring-intent terms plus configured/fallback keywords, while also supporting user-provided URLs or pasted public content for local validation.

**Independent Test**: Start a run with known keywords and verify provider-generated or user-provided candidates include source query, hiring-intent term/source type, matched keywords, and no more than 50 inspected candidates.

### Tests for User Story 1

- [x] T017 [P] [US1] Add provider unit tests for query generation from hiring-intent terms plus keywords in `apps/worker/tests/unit/test_linkedin_search_provider_queries.py`
- [x] T018 [P] [US1] Add provider unit tests for user-provided URL and pasted-content inputs in `apps/worker/tests/unit/test_linkedin_search_provider_inputs.py`
- [x] T019 [P] [US1] Add worker integration test for provider candidates flowing through inspect cap in `apps/worker/tests/integration/test_linkedin_provider_collection.py`
- [x] T020 [P] [US1] Add API contract tests for new run creation fields in `apps/api/tests/contract/test_linkedin_search_provider_contract.py`

### Implementation for User Story 1

- [x] T021 [P] [US1] Implement query builder for `hiring`, `contratando`, `contratamos` plus keywords in `apps/worker/app/services/linkedin_search_provider.py`
- [x] T022 [P] [US1] Implement collection input normalization for provided URLs and pasted public content in `apps/worker/app/services/linkedin_search_provider.py`
- [x] T023 [US1] Implement public LinkedIn publication fetch boundary with timeout and blocked/empty status mapping in `apps/worker/app/services/linkedin_search_provider.py`
- [x] T024 [US1] Extend worker orchestration to call the provider before parsing candidates in `apps/worker/app/jobs/linkedin_job_search.py`
- [x] T025 [US1] Update parser to preserve collection source type, hiring-intent term, raw excerpt, and provider metadata in `apps/worker/app/services/linkedin_candidate_parser.py`
- [ ] T026 [US1] Update worker entrypoint to process pending runs with provider-collected candidates in `apps/worker/app/main.py`
- [x] T027 [US1] Update run service to record inspected counts, cap status, and provider status from worker output in `apps/api/app/services/job_search_run_service.py`

**Checkpoint**: User Story 1 is complete when automatic or supplied LinkedIn content produces inspected candidates with source traceability and the run remains capped at 50 candidates.

---

## Phase 4: User Story 2 - Accept Only Contactable Opportunities (Priority: P2)

**Goal**: Persist only contactable job opportunities, preferring public email and accepting LinkedIn DM only when the text explicitly invites DM and a poster profile link is present.

**Independent Test**: Run mixed candidates with email, explicit LinkedIn DM, generic profile links, weak matches, and duplicates; verify only valid contactable candidates become accepted opportunities.

### Tests for User Story 2

- [x] T028 [P] [US2] Add parser tests for email priority and LinkedIn DM invitation extraction in `apps/worker/tests/unit/test_linkedin_candidate_parser.py`
- [x] T029 [P] [US2] Add normalizer tests for email-first contact priority and DM rejection without poster profile URL in `apps/worker/tests/unit/test_job_candidate_normalizer.py`
- [x] T030 [P] [US2] Add API service tests for accepted opportunity persistence with LinkedIn DM metadata in `apps/api/tests/unit/test_linkedin_contact_acceptance.py`
- [x] T031 [P] [US2] Add integration tests for deduplication using preferred contact channel value in `apps/api/tests/integration/test_linkedin_provider_deduplication.py`

### Implementation for User Story 2

- [x] T032 [US2] Extend candidate parser to extract public email, explicit DM invitation text, and poster profile URL in `apps/worker/app/services/linkedin_candidate_parser.py`
- [x] T033 [US2] Extend candidate normalizer to prefer email, accept explicit LinkedIn DM with profile link, and reject generic profile links in `apps/worker/app/services/job_candidate_normalizer.py`
- [x] T034 [US2] Update API candidate recording to persist contact channel type, contact priority, poster profile URL, hiring-intent term, and collection source type in `apps/api/app/services/job_search_run_service.py`
- [x] T035 [US2] Update opportunity creation to set email or LinkedIn contact fields correctly in `apps/api/app/services/opportunity_service.py`
- [x] T036 [US2] Update dedupe helper usage for preferred contact channel value in `apps/api/app/services/job_dedupe.py`
- [x] T037 [US2] Update opportunity list/detail responses to expose LinkedIn DM contact metadata in `apps/api/app/schemas/opportunity.py`
- [x] T038 [US2] Update accepted opportunity examples in `specs/003-linkedin-search-provider/contracts/openapi.yaml`

**Checkpoint**: User Story 2 is complete when only public-email or explicit-DM candidates become accepted `job` opportunities and duplicates do not create extra opportunities.

---

## Phase 5: User Story 3 - Make Collection Failures Visible (Priority: P3)

**Goal**: Make blocked, rate-limited, empty, inaccessible, malformed, weak, and parse-failed collection attempts visible through run/candidate outcomes without fabricating opportunities.

**Independent Test**: Run the provider against blocked, empty, inaccessible, invalid, and malformed sources and verify the run/candidates expose clear failure status with zero fabricated accepted opportunities.

### Tests for User Story 3

- [x] T039 [P] [US3] Add provider failure tests for blocked, inaccessible, empty, and failed responses in `apps/worker/tests/unit/test_linkedin_search_provider_failures.py`
- [x] T040 [P] [US3] Add worker integration test for partial provider success plus visible failed candidates in `apps/worker/tests/integration/test_linkedin_provider_failures.py`
- [x] T041 [P] [US3] Add API integration tests for provider status and failed candidate visibility in `apps/api/tests/integration/test_linkedin_provider_failure_visibility.py`
- [x] T042 [P] [US3] Add contract tests for provider status filters and failure fields in `apps/api/tests/contract/test_linkedin_provider_failure_contract.py`

### Implementation for User Story 3

- [x] T043 [US3] Implement provider error classes and status mapping in `apps/worker/app/services/linkedin_search_provider.py`
- [x] T044 [US3] Extend worker orchestration to record blocked, inaccessible, empty, and failed provider outcomes in `apps/worker/app/jobs/linkedin_job_search.py`
- [x] T045 [US3] Extend API candidate outcome enum handling for provider failure outcomes in `apps/api/app/models/job_search_run.py`
- [x] T046 [US3] Update run lifecycle logic for completed_no_results versus failed provider states in `apps/api/app/services/job_search_run_service.py`
- [x] T047 [US3] Add provider status filtering to candidate/run listing in `apps/api/app/api/routes/job_search_runs.py`
- [x] T048 [US3] Ensure failed or blocked candidates never create opportunities in `apps/api/app/services/job_search_run_service.py`
- [x] T049 [US3] Update troubleshooting and failure examples in `specs/003-linkedin-search-provider/quickstart.md`

**Checkpoint**: User Story 3 is complete when failure states are visible through the API and no failed/blocked/empty source can create an accepted opportunity.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, cleanup, and full regression checks across all stories.

- [x] T050 [P] Update product docs with real provider behavior and LinkedIn limits in `docs/bot-1-job-search.md`
- [x] T051 [P] Update implementation notes and next-step status in `docs/handoff.md`
- [ ] T052 [P] Update `specs/003-linkedin-search-provider/quickstart.md` with final curl examples and expected responses
- [x] T053 Run worker unit and integration tests in `apps/worker/tests/`
- [x] T054 Run API unit, contract, and integration tests in `apps/api/tests/`
- [x] T055 Run full local pytest suites for API and worker in `apps/api/tests/` and `apps/worker/tests/`
- [ ] T056 Run quickstart validation end-to-end using `specs/003-linkedin-search-provider/quickstart.md`
- [ ] T057 Review generated OpenAPI contract against implemented schemas in `specs/003-linkedin-search-provider/contracts/openapi.yaml`
- [x] T058 Update `docs/handoff.md` with implementation completion status, test results, unresolved Docker/manual validation gaps, and latest prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP collection provider path.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from US1 provider output, but can be tested with supplied raw candidates.
- **User Story 3 (Phase 5)**: Depends on Foundational and provider status concepts; can be implemented after or alongside US1 provider work.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Required MVP for automatic LinkedIn publication collection.
- **US2 (P2)**: Requires candidate metadata shape from Foundational; can use fixture candidates before live provider is complete.
- **US3 (P3)**: Requires provider status/outcome model from Foundational; integrates best after US1 provider boundary exists.

### Within Each User Story

- Tests first, then models/schemas, then provider/services, then orchestration/routes, then integration.
- Keep worker collection outside HTTP request handlers.
- Preserve accepted opportunity creation through the existing opportunity service.
- Do not add email sending, automated applications, resume parsing, UI, AI scoring, or freelance prospecting.

### Parallel Opportunities

- Setup tasks T003-T006 can run in parallel.
- Foundational tests T015-T016 can run in parallel after schema/migration intent is understood.
- US1 tests T017-T020 can run in parallel before implementation.
- US2 tests T028-T031 can run in parallel before implementation.
- US3 tests T039-T042 can run in parallel before implementation.
- Polish documentation tasks T050-T052 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Add provider unit tests for query generation from hiring-intent terms plus keywords in apps/worker/tests/unit/test_linkedin_search_provider_queries.py"
Task: "Add provider unit tests for user-provided URL and pasted-content inputs in apps/worker/tests/unit/test_linkedin_search_provider_inputs.py"
Task: "Add worker integration test for provider candidates flowing through inspect cap in apps/worker/tests/integration/test_linkedin_provider_collection.py"
Task: "Add API contract tests for new run creation fields in apps/api/tests/contract/test_linkedin_search_provider_contract.py"
```

## Parallel Example: User Story 2

```bash
Task: "Add parser tests for email priority and LinkedIn DM invitation extraction in apps/worker/tests/unit/test_linkedin_candidate_parser.py"
Task: "Add normalizer tests for email-first contact priority and DM rejection without poster profile URL in apps/worker/tests/unit/test_job_candidate_normalizer.py"
Task: "Add API service tests for accepted opportunity persistence with LinkedIn DM metadata in apps/api/tests/unit/test_linkedin_contact_acceptance.py"
Task: "Add integration tests for deduplication using preferred contact channel value in apps/api/tests/integration/test_linkedin_provider_deduplication.py"
```

## Parallel Example: User Story 3

```bash
Task: "Add provider failure tests for blocked, inaccessible, empty, and failed responses in apps/worker/tests/unit/test_linkedin_search_provider_failures.py"
Task: "Add worker integration test for partial provider success plus visible failed candidates in apps/worker/tests/integration/test_linkedin_provider_failures.py"
Task: "Add API integration tests for provider status and failed candidate visibility in apps/api/tests/integration/test_linkedin_provider_failure_visibility.py"
Task: "Add contract tests for provider status filters and failure fields in apps/api/tests/contract/test_linkedin_provider_failure_contract.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational storage and schema changes.
3. Complete Phase 3 User Story 1.
4. Validate a run can collect or consume candidate inputs and expose inspected candidates capped at 50.
5. Stop and confirm provider boundary behavior before expanding acceptance rules.

### Incremental Delivery

1. US1: real provider/fetcher boundary, query generation, candidate collection, source traceability, and cap enforcement.
2. US2: contact acceptance rules, email priority, LinkedIn DM fallback, accepted opportunity persistence, and dedupe.
3. US3: blocked/empty/inaccessible failure visibility and no fabricated opportunities.
4. Polish: docs, contracts, quickstart, and full regression validation.

### Validation Gates

- After US1: run produces inspected candidates from automatic or supplied LinkedIn sources with provider metadata.
- After US2: accepted opportunities require public email or explicit LinkedIn DM with profile link, and duplicates are linked instead of recreated.
- After US3: provider failures are visible and never create accepted opportunities.

## Notes

- `[P]` tasks use different files and can be worked in parallel.
- Every story phase remains independently testable at its checkpoint.
- Keep platform-boundary failures visible instead of fabricating opportunities.
- Keep email sending, resume attachments, UI, AI scoring, and freelance prospecting out of this feature.
