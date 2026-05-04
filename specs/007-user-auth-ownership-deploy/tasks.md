# Tasks: User Auth Ownership Deploy

**Input**: Design documents from `specs/007-user-auth-ownership-deploy/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Included because the specification requires focused API, worker, extension, isolation, and deployed validation checks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Generate `/speckit-tasks` for `specs/007-user-auth-ownership-deploy` after planning produced auth, ownership, deployment, contract, data model, and quickstart artifacts.

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add auth/security dependencies and shared configuration surfaces before schema and route work.

- [X] T001 Add password hashing/session token dependencies to `apps/api/pyproject.toml`
- [X] T002 [P] Add auth and deployment environment variables to `.env.example`
- [X] T003 [P] Add local auth and deployment environment defaults to `docker-compose.yml`
- [X] T004 [P] Add auth configuration fields to `apps/api/app/core/config.py`
- [X] T005 [P] Add extension auth-related API types placeholders to `apps/extension/src/api/types.ts`
- [X] T006 [P] Add protected-route error constants to `apps/api/app/api/errors.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth, ownership, and migration primitives that MUST be complete before user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Create `User`, `AuthSession`, and `PasswordResetRequest` SQLAlchemy models in `apps/api/app/models/user.py`
- [X] T008 Export auth models from `apps/api/app/models/__init__.py`
- [X] T009 Create auth schemas for register, login, current user, session response, password reset, and logout in `apps/api/app/schemas/auth.py`
- [X] T010 Create password hashing helpers in `apps/api/app/services/password_service.py`
- [X] T011 Create opaque token hashing/generation helpers in `apps/api/app/services/session_token_service.py`
- [X] T012 Create auth session service in `apps/api/app/services/auth_session_service.py`
- [X] T013 Create password reset service with non-enumerating request behavior in `apps/api/app/services/password_reset_service.py`
- [X] T014 Create current-user dependency and bearer token parsing in `apps/api/app/api/dependencies/auth.py`
- [X] T015 Create ownership query helper functions in `apps/api/app/services/ownership.py`
- [X] T016 Add Alembic migration for `users`, `auth_sessions`, and `password_reset_requests` in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T017 Add nullable `user_id` ownership columns and indexes to operational tables in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T018 Add default local user backfill logic to `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T019 Enforce post-backfill ownership constraints and owner foreign keys in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T020 Add seed helper for default local user reuse in `apps/api/app/db/seed.py`
- [X] T021 [P] Add auth model unit tests in `apps/api/tests/unit/test_auth_models.py`
- [X] T022 [P] Add password hashing unit tests in `apps/api/tests/unit/test_password_service.py`
- [X] T023 [P] Add session token unit tests in `apps/api/tests/unit/test_session_token_service.py`
- [X] T024 [P] Add ownership helper unit tests in `apps/api/tests/unit/test_ownership_helpers.py`
- [X] T025 [P] Add auth migration integration test in `apps/api/tests/integration/test_user_auth_ownership_migration.py`
- [X] T026 [P] Add ownership backfill integration test in `apps/api/tests/integration/test_user_auth_ownership_backfill.py`

**Checkpoint**: Foundation ready - models, schemas, helpers, migrations, and default ownership primitives exist.

---

## Phase 3: User Story 1 - Sign Up And Access Own Data (Priority: P1) MVP

**Goal**: Users can register, log in, reset passwords, maintain browser-session auth, log out, and access only their own protected Full-time data.

**Independent Test**: Register two users, log in as each, create or access operational data, verify user isolation, verify password reset, verify logout and browser-restart session behavior.

### Tests for User Story 1

- [X] T027 [P] [US1] Add auth endpoint contract tests for register/login/logout/me/password reset in `apps/api/tests/contract/test_auth_contract.py`
- [X] T028 [P] [US1] Add protected route unauthenticated contract tests in `apps/api/tests/contract/test_protected_routes_auth_contract.py`
- [X] T029 [P] [US1] Add two-user resource isolation integration tests in `apps/api/tests/integration/test_user_ownership_isolation.py`
- [X] T030 [P] [US1] Add password reset integration tests in `apps/api/tests/integration/test_password_reset_flow.py`
- [X] T031 [P] [US1] Add session logout and expiry integration tests in `apps/api/tests/integration/test_auth_sessions.py`
- [X] T032 [P] [US1] Add provider token redaction integration tests in `apps/api/tests/integration/test_provider_account_auth_visibility.py`

### Implementation for User Story 1

- [X] T033 [US1] Implement `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/password-reset/request`, and `/auth/password-reset/confirm` in `apps/api/app/api/routes/auth.py`
- [X] T034 [US1] Register auth router in `apps/api/app/api/router.py`
- [X] T035 [US1] Apply `current_user` dependency to opportunities routes in `apps/api/app/api/routes/opportunities.py`
- [X] T036 [US1] Scope opportunity list/detail/update queries by current user in `apps/api/app/services/opportunity_service.py`
- [X] T037 [US1] Apply `current_user` dependency to job search run routes in `apps/api/app/api/routes/job_search_runs.py`
- [X] T038 [US1] Scope job search run create/list/detail/candidate/opportunity queries by current user in `apps/api/app/services/job_search_run_service.py`
- [X] T039 [US1] Apply `current_user` dependency to LinkedIn browser collector routes in `apps/api/app/api/routes/linkedin_browser_collector.py`
- [X] T040 [US1] Propagate current user ownership into authenticated browser collection inputs in `apps/api/app/api/routes/linkedin_browser_collector.py`
- [X] T041 [US1] Apply `current_user` dependency to user settings and resume routes in `apps/api/app/api/routes/user_settings.py`
- [X] T042 [US1] Scope settings and resume reads/writes/downloads by current user in `apps/api/app/services/user_settings_service.py` and `apps/api/app/services/resume_service.py`
- [X] T043 [US1] Apply `current_user` dependency to email template routes in `apps/api/app/api/routes/email_templates.py`
- [X] T044 [US1] Scope email template list/create/update/preview by current user in `apps/api/app/services/email_template_service.py` and `apps/api/app/services/email_preview_service.py`
- [X] T045 [US1] Apply `current_user` dependency to email sending routes in `apps/api/app/api/routes/email_sending.py`
- [X] T046 [US1] Enforce owner match for draft creation, draft update, send approval, bulk preview, and bulk approval in `apps/api/app/services/email_draft_service.py`, `apps/api/app/services/email_send_service.py`, and `apps/api/app/services/bulk_email_service.py`
- [X] T047 [US1] Enforce current-user provider account lookup and token redaction in `apps/api/app/services/email_provider_service.py`
- [X] T048 [US1] Enforce current-user provider status and OAuth start ownership in `apps/api/app/services/email_provider_service.py` and `apps/api/app/services/google_oauth_service.py`
- [X] T049 [US1] Add owner-scoped duplicate-send checks in `apps/api/app/services/bulk_email_service.py`
- [X] T050 [US1] Ensure all new opportunities, runs, candidates, drafts, send requests, batches, and outreach events write `user_id` in `apps/api/app/services/job_search_run_service.py`
- [X] T051 [US1] Ensure all new email workflow records write `user_id` in `apps/api/app/services/email_draft_service.py`, `apps/api/app/services/email_send_service.py`, `apps/api/app/services/bulk_email_service.py`, and `apps/api/app/services/outreach_history_service.py`
- [X] T052 [US1] Update API schemas to include safe user/account/session outputs in `apps/api/app/schemas/auth.py`
- [X] T053 [US1] Update API schema exports in `apps/api/app/schemas/__init__.py`
- [X] T054 [US1] Update API test fixtures for authenticated clients and two users in `apps/api/tests/conftest.py`
- [X] T055 [US1] Update existing API contract tests to authenticate protected requests in `apps/api/tests/contract/test_job_search_runs_contract.py`
- [X] T056 [US1] Update existing API contract tests to authenticate protected requests in `apps/api/tests/contract/test_job_review_opportunities_contract.py`
- [X] T057 [US1] Update existing email contract tests to authenticate protected requests in `apps/api/tests/contract/test_job_review_analysis_contract.py`
- [X] T058 [US1] Update existing integration tests to use user-owned fixtures in `apps/api/tests/integration/test_job_search_runs_api.py`
- [X] T059 [US1] Update existing opportunity integration tests to use user-owned fixtures in `apps/api/tests/integration/test_job_opportunity_storage.py`
- [X] T060 [US1] Update existing email integration tests to use user-owned fixtures in `apps/api/tests/integration/test_job_review_updates.py`

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Preserve Existing Local Data Under A Default Owner (Priority: P2)

**Goal**: Existing global local data migrates to one explicit default local owner without data loss.

**Independent Test**: Prepare a database with pre-existing global rows, run migration/backfill, log in as default local user, and confirm prior data remains visible and usable.

### Tests for User Story 2

- [X] T061 [P] [US2] Add pre-ownership database fixture data for all operational tables in `apps/api/tests/integration/test_user_auth_ownership_backfill.py`
- [X] T062 [P] [US2] Add default local owner visibility integration test in `apps/api/tests/integration/test_default_local_owner_visibility.py`
- [X] T063 [P] [US2] Add no-data-loss migration count assertions in `apps/api/tests/integration/test_user_auth_ownership_migration.py`

### Implementation for User Story 2

- [X] T064 [US2] Add default local user constants and helper lookup in `apps/api/app/services/auth_service.py`
- [X] T065 [US2] Add backfill coverage for `user_settings`, `resume_attachments`, `email_templates`, and `sending_provider_accounts` in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T066 [US2] Add backfill coverage for `job_search_runs`, `job_search_candidates`, and `linkedin_collection_inputs` in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T067 [US2] Add backfill coverage for `opportunities`, `job_opportunity_details`, and `opportunity_keyword_matches` in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T068 [US2] Add backfill coverage for `email_drafts`, `send_requests`, `bulk_send_batches`, and `outreach_events` in `apps/api/alembic/versions/009_user_auth_ownership.py`
- [X] T069 [US2] Update existing API seed data to create user-owned settings/templates/resumes in `apps/api/app/db/seed.py`
- [X] T070 [US2] Update quickstart seed assumptions for local backfilled owner in `specs/007-user-auth-ownership-deploy/quickstart.md`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Configure Published Environments Safely (Priority: P3)

**Goal**: A deployer can configure local, staging, and production with the same env var names, environment-specific values, documented storage boundaries, health checks, migrations, OAuth setup, and worker validation.

**Independent Test**: Follow the deployment checklist in a clean environment and complete health, migration, login, OAuth, provider status, resume, draft, approved send, and worker delivery validation.

### Tests for User Story 3

- [X] T071 [P] [US3] Add configuration loading unit tests for auth and OAuth environment values in `apps/api/tests/unit/test_config_auth_deploy.py`
- [X] T072 [P] [US3] Add provider setup failure contract tests in `apps/api/tests/contract/test_provider_config_contract.py`
- [X] T073 [P] [US3] Add worker-down send visibility integration test in `apps/api/tests/integration/test_send_worker_down_visibility.py`
- [X] T074 [P] [US3] Add worker owner-scoped delivery integration test in `apps/worker/tests/integration/test_user_owned_email_delivery.py`

### Implementation for User Story 3

- [X] T075 [US3] Add documented auth/session/password reset environment settings to `apps/api/app/core/config.py`
- [X] T076 [US3] Add provider setup-required and invalid redirect failure handling to `apps/api/app/services/email_provider_service.py`
- [X] T077 [US3] Ensure provider status never returns secrets or tokens in `apps/api/app/schemas/email.py`
- [X] T078 [US3] Preserve `user_id` when the worker claims pending send requests in `apps/worker/app/jobs/email_sending.py`
- [X] T079 [US3] Select Gmail provider account by send request owner in `apps/worker/app/services/email_delivery.py`
- [X] T080 [US3] Add owner attribution to worker-created outreach events in `apps/worker/app/services/email_delivery.py`
- [X] T081 [US3] Update worker SQL statements for user-owned email fields in `apps/worker/app/services/email_delivery.py`
- [X] T082 [US3] Update `.env.example` with local/staging/production env variable guidance
- [X] T083 [US3] Update `docs/deployment-config-and-storage.md` with auth, reset, environment, OAuth, and storage validation steps
- [X] T084 [US3] Update `docs/auth-and-ownership.md` with open signup, no email verification, browser-session auth, and password reset decisions
- [X] T085 [US3] Update `README.md` deploy notes with auth/ownership prerequisite and validation commands
- [X] T086 [US3] Update `specs/007-user-auth-ownership-deploy/quickstart.md` with final deployed smoke-test commands after implementation details settle

**Checkpoint**: User Stories 1, 2, and 3 work independently.

---

## Phase 6: User Story 4 - Maintain Extension Login State (Priority: P4)

**Goal**: Extension users can sign up, log in, send authenticated requests, log out, reset password, and lose login state after browser restart without storing provider tokens, client secrets, or resume bytes.

**Independent Test**: Run the extension against local and published API URLs, verify protected screens require login, authenticated actions use the session token, logout clears access, browser restart requires login again, and password reset works.

### Tests for User Story 4

- [X] T087 [P] [US4] Add auth client typecheck coverage in `apps/extension/src/api/types.ts`
- [X] T088 [P] [US4] Add popup auth state unit-like store coverage in `apps/extension/src/store/popupStore.ts`
- [X] T089 [P] [US4] Add extension manual validation checklist to `docs/plasmo-extension-usage.md`

### Implementation for User Story 4

- [X] T090 [US4] Add auth API client methods and bearer-token request injection in `apps/extension/src/api/client.ts`
- [X] T091 [US4] Add auth request/response types in `apps/extension/src/api/types.ts`
- [X] T092 [US4] Add browser-session token storage helpers in `apps/extension/src/store/authSession.ts`
- [X] T093 [US4] Add auth state, login, register, logout, password reset request, and password reset confirm actions in `apps/extension/src/store/popupStore.ts`
- [X] T094 [US4] Add login/register/reset UI component in `apps/extension/src/components/popup/AuthView.tsx`
- [X] T095 [US4] Gate protected popup tabs behind auth state in `apps/extension/src/components/popup/PopupContent.tsx`
- [X] T096 [US4] Add logout and current-user display controls to `apps/extension/src/components/popup/AppHeader.tsx`
- [X] T097 [US4] Update dashboard empty/loading/error states for unauthenticated users in `apps/extension/src/components/popup/DashboardView.tsx`
- [X] T098 [US4] Update jobs, search, templates, and settings flows to handle 401 responses in `apps/extension/src/store/popupStore.ts`
- [X] T099 [US4] Ensure resume download URLs include authenticated access strategy in `apps/extension/src/api/client.ts`
- [X] T100 [US4] Add published API host permission guidance in `apps/extension/package.json`
- [X] T101 [US4] Update extension usage docs for signup/login/logout/browser-restart behavior in `docs/plasmo-extension-usage.md`

**Checkpoint**: All user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, docs alignment, and handoff.

- [ ] T102 [P] Run focused API contract tests with `pytest tests/contract` from `apps/api`
- [ ] T103 [P] Run focused API integration tests with `pytest tests/integration` from `apps/api`
- [X] T104 [P] Run API unit tests with `pytest tests/unit` from `apps/api`
- [ ] T105 [P] Run focused worker tests with `pytest tests/integration tests/unit` from `apps/worker`
- [X] T106 [P] Run extension typecheck with `npm run typecheck` from `apps/extension`
- [ ] T107 Run local quickstart validation from `specs/007-user-auth-ownership-deploy/quickstart.md`
- [ ] T108 Run two-user isolation smoke test against local API using `specs/007-user-auth-ownership-deploy/quickstart.md`
- [ ] T109 Run controlled Gmail OAuth and approved-send smoke test using `specs/007-user-auth-ownership-deploy/quickstart.md`
- [ ] T110 [P] Review OpenAPI contract alignment in `specs/007-user-auth-ownership-deploy/contracts/openapi.yaml`
- [X] T111 [P] Update current-state review with auth/ownership implementation status in `docs/current-state-review.md`
- [X] T112 Update `docs/handoff.md` with implementation status, validation results, next step, and latest prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational - MVP.
- **US2 (Phase 4)**: Depends on Foundational; can be developed alongside US1 after migration primitives exist, but final validation depends on auth login from US1.
- **US3 (Phase 5)**: Depends on Foundational; worker/provider parts depend on owner-scoped send records from US1.
- **US4 (Phase 6)**: Depends on auth contracts from US1; can build UI shell in parallel after contract shapes are stable.
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Required MVP; provides registration, login, sessions, password reset, and protected owner-scoped API behavior.
- **US2 (P2)**: Requires migration primitives; validates existing local data preservation.
- **US3 (P3)**: Requires owner-scoped API and worker behavior; validates deploy readiness.
- **US4 (P4)**: Requires auth API contracts and extension client changes; validates browser-session UX.

### Within Each User Story

- Tests first, verify they fail before implementation.
- Models and migrations before services.
- Services and dependencies before endpoints.
- Endpoints before extension integration.
- Worker owner propagation after send/run records carry `user_id`.

### Parallel Opportunities

- Setup tasks T002-T006 can run in parallel.
- Foundational tests T021-T026 can run in parallel after foundational interfaces are sketched.
- US1 contract/integration tests T027-T032 can run in parallel.
- US2 tests T061-T063 can run in parallel.
- US3 tests T071-T074 can run in parallel.
- US4 docs/type/store prep T087-T089 can run in parallel.
- Final validation tasks T102-T106 and T110-T111 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T027 [P] [US1] Add auth endpoint contract tests in apps/api/tests/contract/test_auth_contract.py"
Task: "T028 [P] [US1] Add protected route unauthenticated contract tests in apps/api/tests/contract/test_protected_routes_auth_contract.py"
Task: "T029 [P] [US1] Add two-user resource isolation integration tests in apps/api/tests/integration/test_user_ownership_isolation.py"
Task: "T030 [P] [US1] Add password reset integration tests in apps/api/tests/integration/test_password_reset_flow.py"
```

## Parallel Example: User Story 3

```bash
Task: "T071 [P] [US3] Add configuration loading unit tests in apps/api/tests/unit/test_config_auth_deploy.py"
Task: "T072 [P] [US3] Add provider setup failure contract tests in apps/api/tests/contract/test_provider_config_contract.py"
Task: "T074 [P] [US3] Add worker owner-scoped delivery integration test in apps/worker/tests/integration/test_user_owned_email_delivery.py"
```

## Parallel Example: User Story 4

```bash
Task: "T090 [US4] Add auth API client methods and bearer-token request injection in apps/extension/src/api/client.ts"
Task: "T094 [US4] Add login/register/reset UI component in apps/extension/src/components/popup/AuthView.tsx"
Task: "T101 [US4] Update extension usage docs for signup/login/logout/browser-restart behavior in docs/plasmo-extension-usage.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational migrations, models, helpers, and auth dependency.
3. Complete Phase 3 US1.
4. Stop and validate: register/login/reset/logout, unauthenticated rejection, two-user isolation, provider token redaction.
5. Use US1 as the safety baseline before broader migration, deploy, and extension rollout.

### Incremental Delivery

1. Foundation ready: auth models, session services, ownership columns, default backfill primitives.
2. US1: protected owner-scoped API MVP.
3. US2: no-data-loss local migration/backfill.
4. US3: deploy configuration, worker owner propagation, OAuth/storage validation.
5. US4: extension login/logout/reset/browser-session UX.
6. Polish: full focused tests, quickstart, docs, and handoff.

### Parallel Team Strategy

With multiple developers:

1. One developer owns API auth/session/password reset.
2. One developer owns migration/backfill and owner-scoped service queries.
3. One developer owns worker/provider owner propagation.
4. One developer owns extension auth state and UI.
5. Integrate at story checkpoints using the focused tests and quickstart smoke tests.

---

## Notes

- Every protected API route must require `current_user`.
- Returning 404 for cross-owner direct identifier access is acceptable when it avoids record existence leaks.
- Session tokens and password reset tokens must be stored hashed, never raw.
- OAuth access/refresh tokens remain server-side and must never be returned to the extension.
- Resume bytes remain in PostgreSQL for MVP and must never be stored in the extension.
- Keep `.local/` limited to local browser profiles, logs, and optional local secret files.
- Refresh `docs/handoff.md` whenever implementation status changes materially or work is handed off.
