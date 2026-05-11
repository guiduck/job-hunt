# Tasks: Full-time Workflow Fixes

**Input**: Design documents from `specs/009-full-time-fixes/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Included because the spec defines independent tests for each story and `quickstart.md` names focused API/extension validation suites.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently after the shared foundation.

## Continuity Context

**Related Handoff**: `docs/handoff.md`
**Latest Working Prompt**: `/speckit-tasks` for `specs/009-full-time-fixes`, generating implementation tasks for email sanitization, Google primary auth, Search region behavior, opportunities pagination, sender LinkedIn URL, and item-level AI generation progress.

> Refresh `docs/handoff.md` whenever implementation status changes materially or work is handed off.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or depends only on completed foundation.
- **[Story]**: Maps to the user story in `spec.md`.
- Every task names the primary file path to edit or create.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the current feature context, contract deltas, and validation commands before implementation.

- [X] T001 Confirm the active feature directory from `.specify/feature.json` and verify `specs/009-full-time-fixes/plan.md` is the active plan reference in `AGENTS.md`
- [X] T002 [P] Review existing protected auth/session routes in `apps/api/app/api/routes/auth.py` against `specs/009-full-time-fixes/contracts/openapi.yaml`
- [X] T003 [P] Review existing opportunities list filters and keyword search in `apps/api/app/services/opportunity_service.py`
- [X] T004 [P] Review existing Plasmo popup auth, Jobs, Search, Settings, and bulk email state in `apps/extension/src/store/popupStore.ts`
- [X] T005 [P] Review existing AI email generation and bulk preview behavior in `apps/api/app/services/bulk_email_service.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared schema/config scaffolding that multiple stories depend on.

**Critical**: Complete this phase before implementing user stories that require migrations, contracts, or shared types.

- [X] T006 Create additive Alembic migration `apps/api/alembic/versions/014_full_time_workflow_fixes.py` for Google identity links, `user_settings.operator_linkedin_url`, and AI generation batch/item persistence
- [X] T007 Add Google primary auth configuration fields separate from Gmail OAuth fields in `apps/api/app/core/config.py`
- [X] T008 [P] Add migration coverage for Google identity links, sender LinkedIn URL, and AI generation tables in `apps/api/tests/integration/test_full_time_fixes_migration.py`
- [X] T009 [P] Update OpenAPI contract coverage expectations for new auth, settings, pagination, and AI generation endpoints in `apps/api/tests/contract/test_full_time_fixes_contract.py`
- [X] T010 [P] Update extension API response/request types for paginated opportunities, Google primary auth, sender LinkedIn URL, and AI generation progress in `apps/extension/src/api/types.ts`
- [X] T011 [P] Add client helpers for new Google auth, paginated opportunity, user settings, and AI generation progress contracts in `apps/extension/src/api/client.ts`
- [X] T012 Run the focused migration/contract baseline commands from `specs/009-full-time-fixes/quickstart.md` and record blockers in `docs/handoff.md`

**Checkpoint**: Database and contract scaffolding are ready; user stories can proceed.

---

## Phase 3: User Story 1 - Keep Captured Contacts Usable (Priority: P1) MVP

**Goal**: Sanitize captured and manually entered job recipient emails without corrupting valid addresses.

**Independent Test**: Save captured and manually edited emails with valid forms, attached `hashtag` suffixes, and invalid values; confirm recovered emails are valid, normal valid emails are preserved, and invalid leftovers are blocked or flagged.

### Tests for User Story 1

- [X] T013 [P] [US1] Add unit tests for preserving plus tags, subdomains, hyphenated domains, and multi-label domains in `apps/api/tests/unit/test_email_sanitization.py`
- [X] T014 [P] [US1] Add unit tests for trimming attached invalid suffixes such as `hashtag`, punctuation, and social text in `apps/api/tests/unit/test_email_sanitization.py`
- [X] T015 [P] [US1] Add integration tests for captured job contact email cleanup during opportunity creation in `apps/api/tests/integration/test_job_email_sanitization.py`
- [X] T016 [P] [US1] Add integration tests for manual draft or bulk recipient edits using sanitized validation in `apps/api/tests/integration/test_email_recipient_validation.py`
- [X] T017 [P] [US1] Add worker parser tests for LinkedIn email artifacts in `apps/worker/tests/unit/test_linkedin_candidate_parser.py`

### Implementation for User Story 1

- [X] T018 [US1] Implement shared email sanitization helpers beside validation in `apps/api/app/services/email_constants.py`
- [X] T019 [US1] Apply email cleanup before job opportunity schema validation in `apps/api/app/schemas/opportunity.py`
- [X] T020 [US1] Apply email cleanup in opportunity persistence and update paths in `apps/api/app/services/opportunity_service.py`
- [X] T021 [US1] Apply email cleanup before draft recipient validation in `apps/api/app/services/email_draft_service.py`
- [X] T022 [US1] Apply email cleanup before individual send approval validation in `apps/api/app/services/email_send_service.py`
- [X] T023 [US1] Apply email cleanup before bulk preview and AI generation validation in `apps/api/app/services/bulk_email_service.py`
- [X] T024 [US1] Reuse the same cleanup behavior in LinkedIn candidate parsing or normalization in `apps/worker/app/services/linkedin_candidate_parser.py`
- [X] T025 [US1] Ensure worker opportunity insertion stores sanitized `contact_email` values in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T026 [US1] Surface invalid recipient feedback consistently in the popup detail and bulk UI in `apps/extension/src/utils/opportunity.ts`

**Checkpoint**: US1 works independently through API, worker, and extension validation surfaces.

---

## Phase 4: User Story 2 - Sign In With Google Without Granting Send Access (Priority: P1)

**Goal**: Add Google as a primary app authentication option while keeping Gmail send OAuth visually and technically separate.

**Independent Test**: Complete Google sign-up/login, verify an app session starts, verify existing local account linking by verified email, and confirm Gmail send remains disconnected until the Settings Gmail flow is completed.

### Tests for User Story 2

- [X] T027 [P] [US2] Add model and uniqueness tests for Google identity links in `apps/api/tests/unit/test_auth_models.py`
- [X] T028 [P] [US2] Add contract tests for `/auth/google/start` and `/auth/google/callback` in `apps/api/tests/contract/test_auth_google_contract.py`
- [X] T029 [P] [US2] Add integration tests for Google sign-up, login, and verified-email linking in `apps/api/tests/integration/test_google_primary_auth.py`
- [X] T030 [P] [US2] Add integration tests proving Google primary auth does not create or authorize Gmail sending connections in `apps/api/tests/integration/test_google_auth_gmail_oauth_separation.py`

### Implementation for User Story 2

- [X] T031 [US2] Add `GoogleIdentityLink` SQLAlchemy model and relationships in `apps/api/app/models/user.py`
- [X] T032 [US2] Add Google primary auth schemas for start/callback/session responses in `apps/api/app/schemas/auth.py`
- [X] T033 [US2] Implement Google primary OAuth URL creation, callback verification, account linking, and session creation in `apps/api/app/services/google_primary_auth_service.py`
- [X] T034 [US2] Add `/auth/google/start` and `/auth/google/callback` routes in `apps/api/app/api/routes/auth.py`
- [X] T035 [US2] Keep Gmail send OAuth routes and provider account writes limited to `apps/api/app/api/routes/email_sending.py`
- [X] T036 [US2] Add Google primary auth client helpers in `apps/extension/src/api/client.ts`
- [X] T037 [US2] Add Google login/register store actions and session persistence in `apps/extension/src/store/popupStore.ts`
- [X] T038 [US2] Add `Login with Google`, `Sign up with Google`, and `Cadastrar com Google` actions in `apps/extension/src/components/popup/AuthView.tsx`
- [X] T039 [US2] Update Settings copy so Gmail sender connection remains clearly separate from primary Google sign-in in `apps/extension/src/components/popup/SettingsView.tsx`
- [X] T040 [US2] Add safe popup styling for Google auth buttons in `apps/extension/src/styles/popup.css`

**Checkpoint**: US2 works independently and does not affect Gmail send authorization.

---

## Phase 5: User Story 3 - Search Broadly and Apply Region Only in AI Filters (Priority: P1)

**Goal**: Remove region from the base LinkedIn capture path and send/evaluate region only when AI filters are enabled.

**Independent Test**: Start searches with AI filters off and on; confirm the LinkedIn search URL and API run payload are text/sort-only when filters are off and include region only as AI filter settings when filters are on.

### Tests for User Story 3

- [X] T041 [P] [US3] Add extension unit tests for LinkedIn URL construction without region in `apps/extension/src/capture/linkedin.test.ts`
- [X] T042 [P] [US3] Add API contract tests proving disabled AI filters ignore accepted/excluded regions in `apps/api/tests/contract/test_linkedin_ai_filter_contract.py`
- [X] T043 [P] [US3] Add worker integration tests proving region filters are evaluated only when enabled in `apps/worker/tests/integration/test_linkedin_ai_filter_pipeline.py`

### Implementation for User Story 3

- [X] T044 [US3] Remove base-search region concatenation from `buildLinkedInContentSearchUrl` in `apps/extension/src/capture/linkedin.ts`
- [X] T045 [US3] Stop adding `payload.region` to `search_query` when creating authenticated browser runs in `apps/extension/background.ts`
- [X] T046 [US3] Move or relabel region controls so accepted/excluded region inputs live only in AI filters in `apps/extension/src/components/popup/SearchView.tsx`
- [X] T047 [US3] Clear or ignore legacy persisted base-region state when AI filters are disabled in `apps/extension/src/store/popupStore.ts`
- [X] T048 [US3] Ensure API run create schemas accept region only through `ai_filter_settings` in `apps/api/app/schemas/job_search_run.py`
- [X] T049 [US3] Ensure worker filter evaluation reads accepted/excluded regions only from enabled AI filter settings in `apps/worker/app/services/job_ai_filter.py`

### Search Feedback and Dedupe Safeguards for User Story 3

- [X] T105 [P] [US3] Add API integration tests for candidate detail serialization with composite AI work-mode signals in `apps/api/tests/integration/test_linkedin_ai_filter_candidates.py`
- [X] T106 [P] [US3] Add worker unit tests for normalizing composite or broader AI work-mode signals in `apps/worker/tests/unit/test_job_ai_filter.py`
- [X] T107 [P] [US3] Add API unit tests for source URL fallback dedupe when company and title are missing in `apps/api/tests/unit/test_job_opportunity_dedupe.py`
- [X] T108 [US3] Keep Search run feedback counters visible when candidate or opportunity detail requests fail in `apps/extension/background.ts`
- [X] T109 [US3] Normalize candidate AI filter signal values before API serialization in `apps/api/app/schemas/job_search_run.py`
- [X] T110 [US3] Normalize worker AI filter signal values before persisting run details in `apps/worker/app/services/job_ai_filter.py`
- [X] T111 [US3] Add source URL fallback discriminator to job opportunity dedupe keys when company and title are empty in `apps/api/app/services/job_dedupe.py`
- [X] T112 [US3] Pass source URL into dedupe checks from opportunity persistence and run candidate processing in `apps/api/app/services/opportunity_service.py` and `apps/api/app/services/job_search_run_service.py`
- [X] T113 [US3] Pass captured source URL into worker dedupe checks before creating accepted opportunities in `apps/worker/app/jobs/linkedin_job_search.py`
- [X] T114 [US3] Validate Search feedback, composite AI signals, and fallback dedupe with focused API, worker, and extension checks from `specs/009-full-time-fixes/quickstart.md`

**Checkpoint**: US3 works independently; LinkedIn capture stays broad while AI filters remain optional.

---

## Phase 6: User Story 4 - Review Hundreds of Jobs Without a Heavy Popup (Priority: P1)

**Goal**: Paginate owner-scoped opportunities with 50 items per page and page-scoped selection semantics.

**Independent Test**: With more than 100 matching jobs, navigate next/previous pages, change search/filter/sort, and confirm criteria persist, page resets are valid, and `All listed` affects only the visible page.

### Tests for User Story 4

- [X] T050 [P] [US4] Add API contract tests for `OpportunityPage` metadata and page size limits in `apps/api/tests/contract/test_job_review_opportunities_contract.py`
- [X] T051 [P] [US4] Add integration tests for paginated filters, search, sort, and valid page correction in `apps/api/tests/integration/test_job_opportunity_filters.py`
- [X] T052 [P] [US4] Add extension store tests for page navigation and filter reset behavior in `apps/extension/src/store/popupStore.test.ts`

### Implementation for User Story 4

- [X] T053 [US4] Add paginated opportunity response schemas in `apps/api/app/schemas/opportunity.py`
- [X] T054 [US4] Update opportunity list service to apply filters before pagination and return total metadata in `apps/api/app/services/opportunity_service.py`
- [X] T055 [US4] Update `/opportunities` query params and response model in `apps/api/app/api/routes/opportunities.py`
- [X] T056 [US4] Update extension opportunity types with `OpportunityPage` in `apps/extension/src/api/types.ts`
- [X] T057 [US4] Update `listOpportunities` to request page/page_size and return paginated metadata in `apps/extension/src/api/client.ts`
- [X] T058 [US4] Store current page, total pages, total count, and page size in `apps/extension/src/store/popupStore.ts`
- [X] T059 [US4] Reset the current page when filters/search/sort change in `apps/extension/src/store/popupStore.ts`
- [X] T060 [US4] Render next/previous pagination controls and counts in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T061 [US4] Update `All Listed` copy and selection logic to select only visible current-page opportunities in `apps/extension/src/components/popup/JobsView.tsx`
- [X] T062 [US4] Ensure bulk delete and bulk preview use explicit selected visible IDs in `apps/extension/src/store/popupStore.ts`
- [X] T063 [US4] Add compact pagination styling in `apps/extension/src/styles/popup.css`

**Checkpoint**: US4 works independently and the popup no longer loads every matching opportunity at once.

---

## Phase 7: User Story 5 - Include Sender LinkedIn in Generated Messages (Priority: P2)

**Goal**: Store an owner-scoped sender LinkedIn URL and include it in AI email generation context when valid.

**Independent Test**: Save a valid LinkedIn profile URL, generate an AI email, verify the URL is available in generation context, remove it, and verify generation continues without inventing a URL.

### Tests for User Story 5

- [X] T064 [P] [US5] Add user settings contract tests for `operator_linkedin_url` validation in `apps/api/tests/contract/test_user_settings.py`
- [X] T065 [P] [US5] Add owner isolation tests for sender LinkedIn URL in `apps/api/tests/integration/test_user_settings_ownership.py`
- [X] T066 [P] [US5] Add AI email context tests for sender LinkedIn URL presence and absence in `apps/api/tests/unit/test_ai_email_generation_context.py`

### Implementation for User Story 5

- [X] T067 [US5] Add `operator_linkedin_url` to the user settings model in `apps/api/app/models/user_settings.py`
- [X] T068 [US5] Add optional LinkedIn profile URL validation to settings schemas in `apps/api/app/schemas/user_settings.py`
- [X] T069 [US5] Persist and return `operator_linkedin_url` in `apps/api/app/services/user_settings_service.py`
- [X] T070 [US5] Include `operator_linkedin_url` in AI generation operator context in `apps/api/app/services/bulk_email_service.py`
- [X] T071 [US5] Update AI email generation prompt instructions to use sender LinkedIn only when provided in `apps/api/app/services/ai_email_generation_service.py`
- [X] T072 [US5] Add `operator_linkedin_url` to extension settings types in `apps/extension/src/api/types.ts`
- [X] T073 [US5] Add LinkedIn URL input, state sync, and save payload in `apps/extension/src/components/popup/SettingsView.tsx`
- [X] T074 [US5] Style the LinkedIn URL settings field consistently in `apps/extension/src/styles/popup.css`

**Checkpoint**: US5 works independently and remains owner-scoped.

---

## Phase 8: User Story 6 - See Per-Item AI Generation Progress (Priority: P2)

**Goal**: Replace opaque synchronous AI bulk generation with durable batch/item progress where completed items become reviewable immediately.

**Independent Test**: Start a multi-opportunity AI generation batch, observe item statuses through queued/running/completed/failed/skipped, open completed content before the batch fully finishes, and confirm send approval still requires human action.

### Tests for User Story 6

- [X] T075 [P] [US6] Add API contract tests for creating and reading AI generation batches in `apps/api/tests/contract/test_bulk_ai_email.py`
- [X] T076 [P] [US6] Add API integration tests for item status transitions and completed-item reviewability in `apps/api/tests/integration/test_bulk_ai_generation_progress.py`
- [X] T077 [P] [US6] Add owner isolation tests for generation batch reads and item updates in `apps/api/tests/integration/test_bulk_ai_generation_ownership.py`
- [ ] T078 [P] [US6] Add worker/service tests for failed and skipped item reasons in `apps/worker/tests/integration/test_ai_generation_batch_processing.py`

### Implementation for User Story 6

- [ ] T079 [US6] Add AI generation batch and item models or extend existing bulk batch models in `apps/api/app/models/email.py`
- [X] T080 [US6] Add AI generation batch and item schemas with queued/running/completed/failed/skipped statuses in `apps/api/app/schemas/email.py`
- [ ] T081 [US6] Refactor `generate_ai_bulk_send` to create a durable batch with queued items in `apps/api/app/services/bulk_email_service.py`
- [X] T082 [US6] Add a service method to read current AI generation batch progress in `apps/api/app/services/bulk_email_service.py`
- [X] T083 [US6] Add `/bulk-email/generate-ai/{batch_id}` progress route in `apps/api/app/api/routes/email_sending.py`
- [ ] T084 [US6] Move per-item AI generation execution out of the blocking API request into worker-owned processing in `apps/worker/app/jobs/ai_email_generation.py`
- [ ] T085 [US6] Wire worker startup or loop dispatch for queued AI generation batches in `apps/worker/app/main.py`
- [ ] T086 [US6] Update AI generation code to mark each item running, completed, failed, or skipped with reason in `apps/worker/app/jobs/ai_email_generation.py`
- [X] T087 [US6] Keep approval logic restricted to completed and human-reviewed items in `apps/api/app/services/bulk_email_service.py`
- [X] T088 [US6] Add extension AI generation batch/item types in `apps/extension/src/api/types.ts`
- [X] T089 [US6] Add extension client functions to create and poll AI generation batches in `apps/extension/src/api/client.ts`
- [ ] T090 [US6] Add popup store polling, recovery, and progress state for active AI generation batches in `apps/extension/src/store/popupStore.ts`
- [X] T091 [US6] Render item-level queued/running/completed/failed/skipped states and reasons in `apps/extension/src/components/popup/BulkEmailPanel.tsx`
- [X] T092 [US6] Allow completed generated items to be reviewed while other items are still running in `apps/extension/src/components/popup/BulkEmailPanel.tsx`
- [X] T093 [US6] Style progress badges, partial completion, and failed/skipped reasons in `apps/extension/src/styles/popup.css`

**Checkpoint**: US6 works independently and preserves human-reviewed outreach.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full feature, update docs, and protect compatibility.

- [X] T094 [P] Update `specs/009-full-time-fixes/quickstart.md` with any final command changes discovered during implementation
- [X] T095 [P] Update `docs/search-improvements.md` with final email sanitization, region, pagination, and AI progress behavior
- [X] T096 [P] Update `docs/bot-1-job-search.md` with final Full-time LinkedIn flow behavior
- [X] T097 [P] Update `docs/roadmap.md` with implemented Full-time fixes and remaining gates
- [X] T098 Update `docs/handoff.md` with implementation status, validation results, blockers, latest prompt, and the completed US3 safeguard tasks T105-T114
- [X] T099 Update `docs/next-spec-prompt.md` with the next recommended Spec Kit prompt after this feature
- [X] T100 Run API focused tests from `specs/009-full-time-fixes/quickstart.md`
- [ ] T101 Run worker focused tests for LinkedIn parsing, AI filters, and AI generation batches from `specs/009-full-time-fixes/quickstart.md`
- [X] T102 Run extension `npm run typecheck` and `npm run build` in `apps/extension`
- [ ] T103 Perform manual popup smoke for Google primary auth versus Gmail OAuth, Search region behavior, Jobs pagination, sender LinkedIn URL, and AI generation progress using `specs/009-full-time-fixes/quickstart.md`
- [X] T104 Verify no discarded external job-source provider, UI, config, metrics, or email discovery pipeline was reintroduced by searching `apps/`, `docs/`, and `specs/009-full-time-fixes`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks stories that need schema/types/contracts.
- **US1 (Phase 3)**: Can start after Setup; API sanitizer is independent but should align with shared contract work.
- **US2 (Phase 4)**: Depends on Foundational migration/config tasks T006-T011.
- **US3 (Phase 5)**: Can start after Setup; independent from schema-heavy work.
- **US4 (Phase 6)**: Depends on extension/API type scaffolding T010-T011.
- **US5 (Phase 7)**: Depends on Foundational migration T006 and settings type scaffolding T010.
- **US6 (Phase 8)**: Depends on Foundational migration T006 and bulk email contract scaffolding T009-T011.
- **Polish (Phase 9)**: Depends on the implemented stories selected for delivery.

### User Story Dependencies

- **US1 (P1)**: Independent MVP candidate and should be delivered first because all outreach depends on clean recipient data.
- **US2 (P1)**: Independent from outreach send permission; can proceed in parallel with US3/US4 after foundation.
- **US3 (P1)**: Independent Search behavior change; can proceed in parallel with US1/US2/US4.
- **US4 (P1)**: Independent Jobs list performance change; can proceed after paginated API contract/types are ready.
- **US5 (P2)**: Depends only on settings migration and AI context integration; can proceed before US6.
- **US6 (P2)**: Larger worker/API/extension flow; should start after the core P1 stories are stable unless parallel capacity is available.

### Within Each User Story

- Tests should be written before implementation where listed.
- Models and schemas before services.
- Services before routes.
- API/client types before extension UI.
- Story checkpoint validation before moving to the next priority when working sequentially.

---

## Parallel Opportunities

- Setup review tasks T002-T005 can run in parallel.
- Foundational tests/types T008-T011 can run in parallel after T006 is drafted.
- US1 test tasks T013-T017 can run in parallel, then implementation can proceed through sanitizer to persistence/use boundaries.
- US2 test tasks T027-T030 can run in parallel; extension UI tasks T036-T040 can follow after API auth behavior is available or mocked.
- US3 tests T041-T043 and safeguard tests T105-T107 can run in parallel; extension Search changes T044-T047 and defensive feedback T108 are separate from API/worker schema, filter, and dedupe tasks T048-T049 and T109-T113.
- US4 tests T050-T052 can run in parallel; API pagination T053-T055 can proceed separately from extension UI T056-T063 after contract shape is stable.
- US5 tests T064-T066 can run in parallel; API settings/context tasks T067-T071 can proceed before extension settings UI T072-T074.
- US6 contract/integration tests T075-T078 can run in parallel; worker batch processor T084-T086 can be implemented separately from extension polling UI T088-T093 after batch schemas are stable.
- Docs tasks T094-T097 can run in parallel near the end; T098 should be last among docs because it records final status and the completed US3 safeguard tasks.

---

## Parallel Example: User Story 4

```text
Task: "T050 [P] [US4] Add API contract tests for OpportunityPage metadata and page size limits in apps/api/tests/contract/test_job_review_opportunities_contract.py"
Task: "T051 [P] [US4] Add integration tests for paginated filters, search, sort, and valid page correction in apps/api/tests/integration/test_job_opportunity_filters.py"
Task: "T052 [P] [US4] Add extension store tests for page navigation and filter reset behavior in apps/extension/src/store/popupStore.test.ts"
```

## Parallel Example: User Story 6

```text
Task: "T084 [US6] Move per-item AI generation execution out of the blocking API request into worker-owned processing in apps/worker/app/jobs/ai_email_generation.py"
Task: "T088 [US6] Add extension AI generation batch/item types in apps/extension/src/api/types.ts"
Task: "T091 [US6] Render item-level queued/running/completed/failed/skipped states and reasons in apps/extension/src/components/popup/BulkEmailPanel.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2 enough for shared contracts.
2. Complete US1 email sanitization.
3. Complete US3 Search region behavior.
4. Complete US3 Search feedback and dedupe safeguards if they are not already present in the working tree.
5. Complete US4 Jobs pagination.
6. Stop and validate the popup can capture, list, select, and prepare outreach using clean current-page data.

### Incremental Delivery

1. Deliver P1 stories US1, US2, US3, and US4 as independent hardening increments.
2. Deliver US5 to enrich sender profile context without changing send permissions.
3. Deliver US6 as the heavier async workflow once batch persistence and polling are stable.
4. Run Phase 9 validation and update docs/handoff before considering `/speckit-implement` complete.

### Safety Notes

- Do not grant Gmail send access from Google primary auth.
- Do not expose Google OAuth client secrets, Gmail tokens, or OpenAI keys to the extension.
- Do not add all-pages selection semantics.
- Do not reintroduce the discarded external job-source provider or email discovery pipeline.
- Keep `job` and `freelance` lanes separate in data, UI copy, and docs.
