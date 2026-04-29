# Tasks: Local Opportunity Foundation

**Input**: Design documents from `specs/001-local-opportunity-foundation/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Formal TDD tasks are not included because the feature spec did not explicitly request test-first implementation. Validation tasks are included in the final phase using `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-tasks` for `001-local-opportunity-foundation`, generating implementation-ready tasks for Docker/PostgreSQL, FastAPI, Alembic, shared opportunity persistence, keyword fallback, lane-specific details, and handoff continuity.

> Update `docs/handoff.md` whenever implementation status changes materially or work is handed off.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete work.
- **[Story]**: Which user story this task belongs to.
- Every task includes exact file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the local project skeleton, dependency declaration, and local database configuration.

- [ ] T001 Create API and worker directory skeleton in `apps/api/app/`, `apps/api/tests/`, `apps/api/alembic/versions/`, and `apps/worker/`
- [ ] T002 Create API package marker files in `apps/api/app/__init__.py`, `apps/api/app/api/__init__.py`, `apps/api/app/api/routes/__init__.py`, `apps/api/app/core/__init__.py`, `apps/api/app/db/__init__.py`, `apps/api/app/models/__init__.py`, `apps/api/app/schemas/__init__.py`, and `apps/api/app/services/__init__.py`
- [ ] T003 Create Python project metadata and dependencies in `apps/api/pyproject.toml`
- [ ] T004 Create local PostgreSQL service definition in `docker-compose.yml`
- [ ] T005 Create local environment template in `.env.example`
- [ ] T006 Create worker boundary note in `apps/worker/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish configuration, database connectivity, migrations, and shared models that all user stories require.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Implement application settings in `apps/api/app/core/config.py`
- [ ] T008 Implement database engine and session factory in `apps/api/app/db/session.py`
- [ ] T009 Implement declarative base and metadata naming conventions in `apps/api/app/db/base.py`
- [ ] T010 Implement FastAPI application factory and health route registration in `apps/api/app/main.py`
- [ ] T011 Implement health endpoint in `apps/api/app/api/routes/health.py`
- [ ] T012 Configure Alembic in `apps/api/alembic.ini`
- [ ] T013 Configure Alembic environment to load app metadata in `apps/api/alembic/env.py`
- [ ] T014 Create enum definitions for opportunity, campaign, keyword, freelance, job, website, and temperature states in `apps/api/app/models/enums.py`
- [ ] T015 Create `Campaign` SQLAlchemy model in `apps/api/app/models/campaign.py`
- [ ] T016 Create `KeywordSet` SQLAlchemy model in `apps/api/app/models/keyword_set.py`
- [ ] T017 Create `Opportunity` SQLAlchemy model in `apps/api/app/models/opportunity.py`
- [ ] T018 Create `FreelanceOpportunityDetail` SQLAlchemy model in `apps/api/app/models/freelance_detail.py`
- [ ] T019 Create `JobOpportunityDetail` SQLAlchemy model in `apps/api/app/models/job_detail.py`
- [ ] T020 Create `OpportunityKeywordMatch` SQLAlchemy model in `apps/api/app/models/opportunity_keyword_match.py`
- [ ] T021 Create `Interaction` SQLAlchemy model in `apps/api/app/models/interaction.py`
- [ ] T022 Export all SQLAlchemy models through `apps/api/app/models/__init__.py`
- [ ] T023 Create initial Alembic migration for campaigns, keyword sets, opportunities, details, keyword matches, and interactions in `apps/api/alembic/versions/001_local_opportunity_foundation.py`
- [ ] T024 Create seed helper for default mock job keywords in `apps/api/app/services/keyword_seed_service.py`
- [ ] T025 Create shared API router aggregation in `apps/api/app/api/router.py`

**Checkpoint**: Local database connection, metadata, migration structure, and shared model foundation are ready.

---

## Phase 3: User Story 1 - Start a Local Opportunity Workspace (Priority: P1) MVP

**Goal**: A developer can start the local workspace, run migrations, and persist data across restarts.

**Independent Test**: Start PostgreSQL, run migrations, start the API, call `GET /health`, create representative records later, restart services, and confirm data persists.

### Implementation for User Story 1

- [ ] T026 [US1] Implement startup seed call for mock keyword fallback in `apps/api/app/main.py`
- [ ] T027 [US1] Implement database readiness utility in `apps/api/app/db/health.py`
- [ ] T028 [US1] Extend health endpoint to include database readiness in `apps/api/app/api/routes/health.py`
- [ ] T029 [US1] Add local setup commands and migration instructions to `apps/api/README.md`
- [ ] T030 [US1] Validate quickstart steps for environment, Docker, migration, and API health in `specs/001-local-opportunity-foundation/quickstart.md`

**Checkpoint**: User Story 1 is independently usable as a local development workspace.

---

## Phase 4: User Story 2 - Store Freelance and Job Opportunities Separately but Consistently (Priority: P1)

**Goal**: Freelance and job opportunities share a consistent base record while preserving lane-specific details.

**Independent Test**: Create one `freelance` opportunity and one `job` opportunity, filter by lane, and retrieve each with its detail fields.

### Implementation for User Story 2

- [ ] T031 [P] [US2] Create campaign Pydantic schemas in `apps/api/app/schemas/campaign.py`
- [ ] T032 [P] [US2] Create keyword set Pydantic schemas in `apps/api/app/schemas/keyword_set.py`
- [ ] T033 [P] [US2] Create opportunity Pydantic schemas in `apps/api/app/schemas/opportunity.py`
- [ ] T034 [US2] Implement campaign service functions in `apps/api/app/services/campaign_service.py`
- [ ] T035 [US2] Implement keyword set service functions in `apps/api/app/services/keyword_set_service.py`
- [ ] T036 [US2] Implement opportunity create/list/get service functions in `apps/api/app/services/opportunity_service.py`
- [ ] T037 [US2] Implement campaign routes for `GET /campaigns` and `POST /campaigns` in `apps/api/app/api/routes/campaigns.py`
- [ ] T038 [US2] Implement keyword set routes for `GET /keyword-sets` and `POST /keyword-sets` in `apps/api/app/api/routes/keyword_sets.py`
- [ ] T039 [US2] Implement opportunity routes for `GET /opportunities`, `POST /opportunities`, and `GET /opportunities/{opportunity_id}` in `apps/api/app/api/routes/opportunities.py`
- [ ] T040 [US2] Register campaign, keyword set, and opportunity routers in `apps/api/app/api/router.py`
- [ ] T041 [US2] Align API request/response names with `specs/001-local-opportunity-foundation/contracts/openapi.yaml`

**Checkpoint**: User Story 2 can save and retrieve both lanes through the API.

---

## Phase 5: User Story 3 - Track Manual Review State for Both Lanes (Priority: P2)

**Goal**: The operator can update freelance and job review states without mixing lane semantics.

**Independent Test**: Update a freelance opportunity to `contacted`, update a job opportunity to `applied`, and verify each lane-specific state persists.

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create interaction Pydantic schemas in `apps/api/app/schemas/interaction.py`
- [ ] T043 [US3] Add lane-specific update handling to `apps/api/app/services/opportunity_service.py`
- [ ] T044 [US3] Implement `PATCH /opportunities/{opportunity_id}` in `apps/api/app/api/routes/opportunities.py`
- [ ] T045 [US3] Implement interaction creation service in `apps/api/app/services/interaction_service.py`
- [ ] T046 [US3] Implement `POST /opportunities/{opportunity_id}/interactions` in `apps/api/app/api/routes/interactions.py`
- [ ] T047 [US3] Register interaction routes in `apps/api/app/api/router.py`

**Checkpoint**: User Story 3 can track manual review state and history for both lanes.

---

## Phase 6: User Story 4 - Preserve Search Evidence and Keyword Context (Priority: P2)

**Goal**: Each opportunity can retain source query, source evidence, matched keywords, and keyword set context for future search quality review.

**Independent Test**: Use the default mock keyword set, create a job opportunity with matched keywords and source evidence, and confirm the match context is retrievable.

### Implementation for User Story 4

- [ ] T048 [US4] Implement keyword match persistence in `apps/api/app/services/opportunity_keyword_match_service.py`
- [ ] T049 [US4] Add keyword match creation support to `apps/api/app/services/opportunity_service.py`
- [ ] T050 [US4] Extend opportunity response schemas with matched keyword context in `apps/api/app/schemas/opportunity.py`
- [ ] T051 [US4] Ensure default mock keyword set is returned by `GET /keyword-sets` when no user-provided set exists in `apps/api/app/services/keyword_set_service.py`
- [ ] T052 [US4] Document mock keyword fallback behavior in `apps/api/README.md`

**Checkpoint**: User Story 4 preserves keyword and source evidence required for future discovery quality.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the feature, update continuity docs, and ensure no deferred scope leaked into implementation.

- [ ] T053 Run formatting and lint checks for `apps/api/`
- [ ] T054 Run migration from a clean database using `apps/api/alembic/`
- [ ] T055 Validate `GET /health`, `GET /keyword-sets`, `POST /opportunities`, `GET /opportunities`, and `PATCH /opportunities/{opportunity_id}` against `specs/001-local-opportunity-foundation/quickstart.md`
- [ ] T056 Review implementation to confirm LinkedIn scraping, CV parsing, prompt generation, and outreach sending remain out of scope
- [ ] T057 Update `docs/handoff.md` with implementation status, completed phase, next step, and latest prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational; establishes local workspace validation.
- **US2 (Phase 4)**: Depends on Foundational; can run after or alongside US1 once DB/API base exists.
- **US3 (Phase 5)**: Depends on US2 because update endpoints require opportunities.
- **US4 (Phase 6)**: Depends on US2 because keyword evidence attaches to job opportunities.
- **Polish (Phase 7)**: Depends on selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2; validates local workspace.
- **User Story 2 (P1)**: Can start after Phase 2; provides core CRUD/filtering.
- **User Story 3 (P2)**: Depends on User Story 2.
- **User Story 4 (P2)**: Depends on User Story 2.

### Parallel Opportunities

- T001 and T002 can be split by directory/package files once structure is agreed.
- T014-T021 can be parallelized by model file after T009.
- T031-T033 can be done in parallel.
- T034-T036 can be started in parallel after models and schemas exist, but integration must happen through T039-T041.
- T042 can be done in parallel with T043 once base opportunity schemas exist.

---

## Parallel Example: User Story 2

```bash
# Different schema files can be implemented together:
Task: "T031 Create campaign Pydantic schemas in apps/api/app/schemas/campaign.py"
Task: "T032 Create keyword set Pydantic schemas in apps/api/app/schemas/keyword_set.py"
Task: "T033 Create opportunity Pydantic schemas in apps/api/app/schemas/opportunity.py"
```

## Parallel Example: Foundational Models

```bash
# Different model files can be implemented together after db/base.py exists:
Task: "T015 Create Campaign SQLAlchemy model in apps/api/app/models/campaign.py"
Task: "T016 Create KeywordSet SQLAlchemy model in apps/api/app/models/keyword_set.py"
Task: "T017 Create Opportunity SQLAlchemy model in apps/api/app/models/opportunity.py"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Complete Phase 4: User Story 2.
5. Stop and validate local persistence for one `freelance` and one `job` opportunity.

### Incremental Delivery

1. Local workspace and migrations.
2. Opportunity CRUD/filtering for both lanes.
3. Manual review state and interaction history.
4. Keyword set fallback and matched keyword evidence.
5. Quickstart validation and handoff update.

### Scope Guardrails

- Do not implement LinkedIn scraping in this feature.
- Do not implement CV parsing in this feature.
- Do not implement prompt generation in this feature.
- Do not implement email or WhatsApp sending in this feature.
- Keep worker code as a boundary placeholder only.

---

## Notes

- [P] tasks are safe to parallelize when prerequisites are satisfied.
- User story labels map to the four stories in `spec.md`.
- Each user story should leave the system independently demonstrable.
- `docs/handoff.md` must be updated before handing off or moving to the next Spec Kit command.
