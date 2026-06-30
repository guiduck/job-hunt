# Tasks: Freelance Bulk Outreach and Channel Settings

**Input**: Design documents from `/specs/016-freelance-bulk-outreach/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Tests**: Required by FR-028 and included before each implementation slice.
**Organization**: Tasks are grouped by user story so each slice can be implemented and tested independently after the shared foundation.

## Continuity Context

**Related Handoff**: `docs/handoff.md`
**Latest Working Prompt**: Generate `tasks.md` for `specs/016-freelance-bulk-outreach` after clarified `/speckit-plan`. Preserve: `apps/web` owns Freelance Email/WhatsApp delivery, Email and WhatsApp are separate bulk actions, review/edit happens before approval, contacts are visible and editable, WhatsApp is provider-backed when configured, and diagnostics must show missing env/config/rate-limit/provider details without exposing secrets.

> Refresh `docs/handoff.md` whenever implementation status changes materially or work is handed off.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks in the same phase because it touches different files and does not depend on incomplete work.
- **[Story]**: User-story label from `spec.md`; omitted for setup, foundation, and polish tasks.
- Every task includes an exact target file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared configuration, environment examples, and Prisma/bootstrap hooks used by all stories.

- [X] T001 Add Freelance outreach env examples for AI, Email, WhatsApp, and large per-channel limits in `apps/web/.env.example`
- [X] T002 [P] Add outreach status/channel constants and diagnostic code lists in `apps/web/lib/freelance/constants.ts`
- [X] T003 [P] Add provider-safe configuration readers for outreach env vars in `apps/web/lib/config.ts`
- [X] T004 [P] Add shared outreach test fixtures for leads, templates, settings, batches, and provider diagnostics in `apps/web/tests/fixtures/bulk-outreach.ts`
- [X] T005 Update the bootstrap script to create any non-Prisma compatibility SQL needed for outreach tables in `apps/web/scripts/bootstrap-db.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add durable schema, validation, repository, and provider boundaries required before any user story can work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Add `OutreachChannel`, `BulkOutreachBatchStatus`, `BulkOutreachItemStatus`, `OutreachEventType`, and `ChannelReadinessStatus` enums in `apps/web/prisma/schema.prisma`
- [X] T007 Add `BulkOutreachBatch`, `BulkOutreachItem`, `OutreachChannelSetting`, and `OutreachEvent` models and relations in `apps/web/prisma/schema.prisma`
- [X] T008 Add owner/campaign/channel indexes and duplicate-prevention indexes for outreach records in `apps/web/prisma/schema.prisma`
- [X] T009 Update generated Prisma bootstrap behavior for the new outreach schema in `apps/web/scripts/bootstrap-db.ts`
- [X] T010 [P] Add Zod schemas for create batch, generate batch, update item, approve batch, and channel settings payloads in `apps/web/lib/validation/freelance.ts`
- [X] T011 [P] Add unit tests for outreach validation schemas and channel-specific contact validation in `apps/web/tests/unit/bulk-outreach-validation.test.ts`
- [X] T012 [P] Add user-safe diagnostic normalization helpers and secret-scrubbing tests in `apps/web/lib/providers/outreach-diagnostics.ts`
- [X] T013 [P] Add provider diagnostics unit tests covering missing env names without secret values in `apps/web/tests/unit/channel-readiness.test.ts`
- [X] T014 Add repository functions for batches, items, events, settings, counters, and owner-scope queries in `apps/web/lib/freelance/repositories.ts`
- [X] T015 Add duplicate first-contact detection service for lead/campaign/channel/stage in `apps/web/lib/freelance/duplicate-outreach-service.ts`
- [X] T016 Add normalized Email and WhatsApp provider interfaces in `apps/web/lib/providers/outreach-provider.ts`
- [X] T017 Add null/mock provider implementations for blocked/unconfigured Email and WhatsApp states in `apps/web/lib/providers/outreach-provider.ts`
- [X] T018 Add owner-scope and no-niche-candidate guard tests for repository/service boundaries in `apps/web/tests/unit/bulk-outreach-eligibility.test.ts`

**Checkpoint**: Schema, validation, diagnostics, repositories, and provider interfaces are ready for user-story work.

---

## Phase 3: User Story 1 - Select Leads for Bulk Outreach (Priority: P1) MVP

**Goal**: Let the operator intentionally select visible Freelance leads and start a channel-specific bulk outreach batch without losing filters or row context.

**Independent Test**: Filter Leads, select individual rows and all visible rows, change filters/pages, and confirm only intended saved Freelance leads enter an Email or WhatsApp batch.

### Tests for User Story 1

- [X] T019 [P] [US1] Add UI integration tests for individual row selection, visible master selection, stale hidden selection summary, and row navigation in `apps/web/tests/integration/bulk-outreach-selection-ui.test.tsx`
- [X] T020 [P] [US1] Add contract tests for `POST /api/freelance/bulk-outreach` create-batch validation and owner scope in `apps/web/tests/contract/bulk-outreach-contract.test.ts`
- [X] T021 [P] [US1] Add unit tests for selection store behavior and visible-only selection semantics in `apps/web/tests/unit/bulk-outreach-selection.test.ts`

### Implementation for User Story 1

- [X] T022 [US1] Add selection state actions for selected lead IDs, visible selected count, and stale selection summaries in `apps/web/lib/freelance/ui-store.ts`
- [X] T023 [US1] Add checkbox column, stable labels, visible master checkbox, and selected row styling in `apps/web/components/leads/lead-table.tsx`
- [X] T024 [P] [US1] Add selected-count and hidden-selection summary component in `apps/web/components/leads/bulk-outreach-counters.tsx`
- [X] T025 [US1] Add separate `Generate Email` and `Generate WhatsApp` bulk action buttons to the Leads UI in `apps/web/components/leads/lead-table.tsx`
- [X] T026 [US1] Implement create-batch service with eligibility, missing/invalid contact counts, duplicate counts, and channel immutability in `apps/web/lib/freelance/bulk-outreach-service.ts`
- [X] T027 [US1] Implement `POST /api/freelance/bulk-outreach` route handler in `apps/web/app/api/freelance/bulk-outreach/route.ts`
- [X] T028 [US1] Wire batch creation from Email/WhatsApp buttons into the review panel opening flow in `apps/web/components/leads/bulk-outreach-panel.tsx`

**Checkpoint**: US1 is independently testable; selected visible Freelance leads create a durable single-channel draft batch with blocked items still visible.

---

## Phase 4: User Story 2 - Generate Individualized Outreach Drafts (Priority: P1)

**Goal**: Generate one channel-specific, reviewable AI draft per eligible selected lead using lead evidence, template reference, and seller context.

**Independent Test**: Create a batch, choose template/channel, generate drafts, and verify every item reaches generated, blocked, skipped, or failed with a clear reason and no delivery request.

### Tests for User Story 2

- [X] T029 [P] [US2] Add unit tests for generation context snapshots using lead evidence, website/social status, template, and seller settings in `apps/web/tests/unit/bulk-generation-context.test.ts`
- [X] T030 [P] [US2] Add unit tests proving AI generation creates no delivery events or provider sends in `apps/web/tests/unit/human-gated-generation.test.ts`
- [X] T031 [P] [US2] Add contract tests for `POST /api/freelance/bulk-outreach/[batchId]/generate` success, retry, partial failure, and owner scope in `apps/web/tests/contract/bulk-outreach-contract.test.ts`

### Implementation for User Story 2

- [X] T032 [US2] Extend commercial message building to accept bulk channel context and produce Email subject/body or WhatsApp message output in `apps/web/lib/generation/commercial-message-builder.ts`
- [X] T033 [US2] Implement bulk generation orchestration, per-item retries, failure diagnostics, and persisted context snapshots in `apps/web/lib/freelance/bulk-generation-service.ts`
- [X] T034 [US2] Implement `POST /api/freelance/bulk-outreach/[batchId]/generate` route handler in `apps/web/app/api/freelance/bulk-outreach/[batchId]/generate/route.ts`
- [X] T035 [US2] Implement `GET /api/freelance/bulk-outreach/[batchId]` batch-state route handler in `apps/web/app/api/freelance/bulk-outreach/[batchId]/route.ts`
- [X] T036 [US2] Add generation progress, partial failure, retry failed, and completed states to the panel in `apps/web/components/leads/bulk-outreach-panel.tsx`
- [X] T037 [US2] Add grounded-context summary and template reference summary to the review surface in `apps/web/components/leads/bulk-outreach-review.tsx`

**Checkpoint**: US2 is independently testable after US1; batch generation is durable, resumable, and side-effect-free.

---

## Phase 5: User Story 3 - Review, Edit, and Skip Batch Items (Priority: P1)

**Goal**: Let the operator review every generated item, edit channel-specific contact/content, and skip or unskip items before approval.

**Independent Test**: Open a generated batch, edit multiple items, skip one, refresh the page, and confirm saved state and counters remain correct.

### Tests for User Story 3

- [X] T038 [P] [US3] Add integration tests for review/edit/skip/save/refresh behavior in `apps/web/tests/integration/bulk-outreach-review-flow.test.tsx`
- [X] T039 [P] [US3] Add contract tests for `PATCH /api/freelance/bulk-outreach/[batchId]/items/[itemId]` channel validation and counter refresh in `apps/web/tests/contract/bulk-outreach-contract.test.ts`
- [X] T040 [P] [US3] Add unit tests for item counter recomputation after edits, skips, invalid contacts, and duplicate changes in `apps/web/tests/unit/bulk-outreach-counters.test.ts`

### Implementation for User Story 3

- [X] T041 [US3] Implement item review update service with email/phone/message validation, skip/unskip, manual contact source, and event creation in `apps/web/lib/freelance/bulk-outreach-service.ts`
- [X] T042 [US3] Implement `PATCH /api/freelance/bulk-outreach/[batchId]/items/[itemId]` route handler in `apps/web/app/api/freelance/bulk-outreach/[batchId]/items/[itemId]/route.ts`
- [X] T043 [US3] Build channel-specific item editor for Email recipient/subject/body and WhatsApp phone/message in `apps/web/components/leads/bulk-outreach-item-editor.tsx`
- [X] T044 [US3] Build batch review list with per-item identity, evidence summary, status, reasons, and skip controls in `apps/web/components/leads/bulk-outreach-review.tsx`
- [X] T045 [US3] Persist updated counters and item states through refresh in `apps/web/components/leads/bulk-outreach-panel.tsx`
- [X] T046 [US3] Add accessible validation messages and stable focus behavior after save in `apps/web/components/leads/bulk-outreach-item-editor.tsx`

**Checkpoint**: US3 is independently testable after US1-US2; no item can be approved without persisted reviewable contact/content state.

---

## Phase 6: User Story 4 - Approve Real Email Delivery (Priority: P2)

**Goal**: Approve reviewed Email items for real provider-backed delivery owned by `apps/web`, with duplicate blocking and auditable events.

**Independent Test**: Configure Email, approve eligible unskipped Email items, and confirm sent/failed events while skipped, duplicate, invalid, and missing-contact items remain unsent.

### Tests for User Story 4

- [X] T047 [P] [US4] Add unit tests for Email provider readiness, missing env diagnostics, limit capacity, and send result normalization in `apps/web/tests/unit/email-provider.test.ts`
- [X] T048 [P] [US4] Add unit tests for duplicate blocking by lead/campaign/channel/stage in `apps/web/tests/unit/bulk-outreach-duplicates.test.ts`
- [X] T049 [P] [US4] Add integration tests for Email approval, idempotent double-click approval, skipped exclusions, and lead history events in `apps/web/tests/integration/bulk-outreach-delivery-flow.test.ts`
- [X] T050 [P] [US4] Add contract tests for `POST /api/freelance/bulk-outreach/[batchId]/approve` Email success and `409 channel_not_ready` responses in `apps/web/tests/contract/bulk-outreach-contract.test.ts`

### Implementation for User Story 4

- [X] T051 [US4] Implement Email provider adapter with env readiness, daily limit snapshots, and user-safe delivery results in `apps/web/lib/providers/email-provider.ts`
- [X] T052 [US4] Implement selected Email provider integration, such as Resend or SMTP, behind the adapter in `apps/web/lib/providers/resend-email-provider.ts`
- [X] T053 [US4] Implement delivery approval service with readiness checks, duplicate blocking, idempotency, provider sends, and event writes in `apps/web/lib/freelance/outreach-delivery-service.ts`
- [X] T054 [US4] Implement `POST /api/freelance/bulk-outreach/[batchId]/approve` route handler for Email batches in `apps/web/app/api/freelance/bulk-outreach/[batchId]/approve/route.ts`
- [X] T055 [US4] Implement lead outreach history route in `apps/web/app/api/freelance/leads/[leadId]/outreach-events/route.ts`
- [X] T056 [US4] Add Email approval confirmation copy, excluded counts, provider diagnostics, and delivery outcomes to `apps/web/components/leads/bulk-outreach-panel.tsx`

**Checkpoint**: US4 is independently testable after US1-US3; reviewed Email batches can send through `apps/web` without the Full-time service running.

---

## Phase 7: User Story 5 - Configure Outreach Channels and AI Context (Priority: P2)

**Goal**: Expose seller/AI context and channel readiness for Email and WhatsApp, including real provider-backed WhatsApp when configured and clear blocked diagnostics otherwise.

**Independent Test**: Update Settings, inspect Email/WhatsApp readiness, generate a batch using saved context, and verify missing config, limits, opt-in/template/rate-limit blocks, or successful WhatsApp sends are visible.

### Tests for User Story 5

- [X] T057 [P] [US5] Add contract tests for `GET/PATCH /api/freelance/channel-settings` and secret-safe readiness responses in `apps/web/tests/contract/channel-settings-contract.test.ts`
- [X] T058 [P] [US5] Add unit tests for WhatsApp provider readiness, required env vars, template/opt-in/message-window diagnostics, and send normalization in `apps/web/tests/unit/whatsapp-provider.test.ts`
- [X] T059 [P] [US5] Add integration tests for Settings context saving and batch generation using updated seller/offer context in `apps/web/tests/integration/seller-settings-generation.test.ts`
- [X] T060 [P] [US5] Add integration tests for WhatsApp approval blocked diagnostics and configured-provider success path in `apps/web/tests/integration/bulk-outreach-whatsapp-flow.test.ts`

### Implementation for User Story 5

- [X] T061 [US5] Extend seller settings validation and persistence for company/portfolio website, offer details, delivery terms, and free-text AI context in `apps/web/lib/freelance/settings-service.ts`
- [X] T062 [US5] Implement channel settings/readiness service with Email/WhatsApp enabled state, required env names, limits, remaining capacity, and last check time in `apps/web/lib/freelance/channel-settings-service.ts`
- [X] T063 [US5] Implement `GET` and `PATCH /api/freelance/channel-settings` route handlers in `apps/web/app/api/freelance/channel-settings/route.ts`
- [X] T064 [US5] Implement WhatsApp provider adapter with Twilio/Business provider readiness and normalized delivery results in `apps/web/lib/providers/whatsapp-provider.ts`
- [X] T065 [US5] Implement selected WhatsApp provider integration, such as Twilio WhatsApp, behind the adapter in `apps/web/lib/providers/twilio-whatsapp-provider.ts`
- [X] T066 [US5] Extend approval delivery service for WhatsApp channel sends, template/opt-in/rate-limit blocks, and provider events in `apps/web/lib/freelance/outreach-delivery-service.ts`
- [X] T067 [US5] Add channel readiness cards, missing env var names, limit diagnostics, and last-check timestamps to Settings in `apps/web/components/settings/channel-settings-panel.tsx`
- [X] T068 [US5] Wire channel readiness and AI context updates into the existing Settings page in `apps/web/components/settings/seller-settings-form.tsx`

**Checkpoint**: US5 is independently testable after US1-US3 and complements US4; Settings explains what is missing locally and WhatsApp sends only through a configured provider.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate copy, accessibility, operational docs, and full quickstart coverage across all stories.

- [X] T069 [P] Add copy guard tests ensuring new Freelance bulk UI avoids job/resume/candidature/recruiter/interview wording in `apps/web/tests/unit/freelance-copy-guard.test.ts`
- [X] T070 [P] Add server secret guard tests ensuring outreach route responses never expose provider secrets or auth headers in `apps/web/tests/unit/server-secret-guard.test.ts`
- [X] T071 [P] Add accessibility-focused UI tests for checkboxes, buttons, dialogs, validation messages, and non-shifting counters in `apps/web/tests/integration/bulk-outreach-accessibility.test.tsx`
- [X] T072 Update quickstart smoke steps and env examples after provider choices are finalized in `specs/016-freelance-bulk-outreach/quickstart.md`
- [X] T073 Update product and architecture docs for Freelance bulk outreach status in `docs/architecture.md`
- [X] T074 Update roadmap and action plan with implementation status and remaining validation notes in `docs/roadmap.md`
- [X] T075 Update handoff with current phase, files changed, validation commands, and next prompt in `docs/handoff.md`
- [X] T076 Prepare the next Spec Kit prompt for implementation or follow-up hardening in `docs/next-spec-prompt.md`
- [X] T077 Run focused unit, contract, integration, typecheck, and build validation from scripts listed in `apps/web/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks all user stories.
- **US1 Selection (Phase 3)**: Depends on Phase 2.
- **US2 Generation (Phase 4)**: Depends on Phase 2 and benefits from US1-created batches.
- **US3 Review/Edit/Skip (Phase 5)**: Depends on US1 and US2.
- **US4 Email Delivery (Phase 6)**: Depends on US1, US2, and US3.
- **US5 Channel Settings/WhatsApp (Phase 7)**: Depends on Phase 2; delivery approval portions depend on US3.
- **Polish**: Depends on the desired stories being implemented.

### User Story Dependencies

- **US1 (P1)**: First MVP slice after foundation; provides selected lead batches.
- **US2 (P1)**: Uses durable batches/items from US1 but remains side-effect-free.
- **US3 (P1)**: Uses generated items from US2 to enforce human review.
- **US4 (P2)**: Uses reviewed Email items from US3 for real delivery.
- **US5 (P2)**: Settings/readiness can begin after foundation; WhatsApp delivery integrates with US3 approval flow.

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel.
- Foundation tests, diagnostics helpers, and validation schemas marked `[P]` can run in parallel.
- Test tasks inside each story can be written in parallel before implementation.
- US5 channel settings UI/service work can proceed in parallel with US4 Email provider work once Phase 2 is complete.
- Polish guard tests can run in parallel with documentation updates after implementation stabilizes.

---

## Parallel Example: User Story 1

```bash
# Selection tests can be developed together:
Task: "T019 Add UI integration tests in apps/web/tests/integration/bulk-outreach-selection-ui.test.tsx"
Task: "T020 Add contract tests in apps/web/tests/contract/bulk-outreach-contract.test.ts"
Task: "T021 Add unit tests in apps/web/tests/unit/bulk-outreach-selection.test.ts"
```

## Parallel Example: User Story 4

```bash
# Email delivery verification can be split across provider, duplicate, integration, and contract tests:
Task: "T047 Add Email provider tests in apps/web/tests/unit/email-provider.test.ts"
Task: "T048 Add duplicate blocking tests in apps/web/tests/unit/bulk-outreach-duplicates.test.ts"
Task: "T049 Add delivery flow tests in apps/web/tests/integration/bulk-outreach-delivery-flow.test.ts"
Task: "T050 Add approve contract tests in apps/web/tests/contract/bulk-outreach-contract.test.ts"
```

---

## Implementation Strategy

### MVP First (P1 Human-Gated Draft Flow)

1. Complete Phase 1 and Phase 2.
2. Complete US1 selection and durable batch creation.
3. Complete US2 generation without delivery side effects.
4. Complete US3 review/edit/skip persistence.
5. Stop and validate: selected leads, generated drafts, item edits, skipped items, refresh/reopen state, and zero delivery before approval.

### Incremental Delivery

1. Add US4 Email approval after the P1 review flow is stable.
2. Add US5 Settings readiness and WhatsApp provider-backed delivery.
3. Add polish guards, docs, quickstart, and full validation.

### Validation Commands

```bash
cd apps/web
npm run test:unit -- tests/unit/bulk-outreach-validation.test.ts tests/unit/bulk-outreach-eligibility.test.ts tests/unit/bulk-generation-context.test.ts tests/unit/bulk-outreach-duplicates.test.ts tests/unit/channel-readiness.test.ts
npm run test:contract -- tests/contract/bulk-outreach-contract.test.ts tests/contract/channel-settings-contract.test.ts
npm run test:integration -- tests/integration/bulk-outreach-selection-ui.test.tsx tests/integration/bulk-outreach-review-flow.test.tsx tests/integration/bulk-outreach-delivery-flow.test.ts tests/integration/bulk-outreach-whatsapp-flow.test.ts
npm run typecheck
npm run build
```

---

## Notes

- `[P]` tasks touch different files or test scopes and can be executed independently.
- Tests are included because FR-028 explicitly requires coverage for selection, eligibility, generation context, review edits, approval blocking, duplicates, contacts, owner scope, settings, and channel gating.
- Provider choices may be finalized during implementation, but the adapter contract must keep secrets server-side and surface only safe diagnostics.
- Do not implement WhatsApp with `wa.me` or prefilled browser links as final delivery.
- Do not allow niche candidates or reference/image-derived records into outreach batches.
