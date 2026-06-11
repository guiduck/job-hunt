# Tasks: Freelance Niche Catalog Governance

**Input**: Design documents from `/specs/015-freelance-niche-catalog/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the feature prompt explicitly requests coverage for audit alignment, duplicate prevention, encoding normalization, candidate decisions, campaign exclusion, and historical snapshots.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Reconcile tasks for `specs/015-freelance-niche-catalog`: preserve completed T001-T055, update US3 so reference/image-derived candidates are niche catalog suggestions only, keep `Igrejas` as an operator-approved documented niche, and ensure real leads/opportunities still come only from scraper/API/provider flows.

> Refresh `docs/handoff.md` whenever implementation status changes materially or work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks in the same phase because it touches different files and has no dependency on incomplete tasks.
- **[Story]**: User story label for story phases only.
- Every task includes an exact file path or validation target.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing `apps/web` project state and prepare contract fixtures for catalog governance.

- [X] T001 Inspect current niche, campaign, route, and test structure in `apps/web/prisma/schema.prisma`, `apps/web/prisma/seed-data/niches.ts`, `apps/web/lib/freelance/repositories.ts`, and `apps/web/app/api/freelance/niches/route.ts`
- [X] T002 [P] Add shared catalog governance test fixtures in `apps/web/tests/fixtures/niche-catalog.ts`
- [X] T003 [P] Add visual-reference candidate fixture data in `apps/web/tests/fixtures/niche-candidates.ts`
- [X] T004 [P] Add baseline reference assertion helpers in `apps/web/tests/helpers/niche-audit-assertions.ts`
- [X] T005 Update `apps/web/tests/setup.ts` to expose niche catalog fixture cleanup helpers for integration tests
- [X] T006 Verify no CSV import/export controls are introduced by adding a guard helper in `apps/web/tests/helpers/no-csv-assertions.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add schema, seed, normalization, validation, and repository support required by every user story.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Add `NicheLifecycleStatus`, `NicheCandidateStatus`, `NicheAuditSeverity`, and `NicheAuditStatus` enums in `apps/web/prisma/schema.prisma`
- [X] T008 Extend `FreelanceNiche` with governance fields, source evidence fields, aliases/query terms JSON, lifecycle fields, and audit timestamp in `apps/web/prisma/schema.prisma`
- [X] T009 Add `NicheCandidate`, `NicheAuditRun`, and `NicheAuditFinding` models with indexes and relations in `apps/web/prisma/schema.prisma`
- [X] T010 Create additive Prisma migration for catalog governance in `apps/web/prisma/migrations/`
- [X] T011 Update seed niche type and normalized display/source metadata in `apps/web/prisma/seed-data/niches.ts`
- [X] T012 Update Prisma seed upsert logic to preserve existing niche IDs while backfilling governance metadata in `apps/web/prisma/seed.ts`
- [X] T013 [P] Create catalog normalization utilities for slug, display name, source name, aliases, and encoding detection in `apps/web/lib/freelance/niche-normalization.ts`
- [X] T014 [P] Create canonical baseline and screenshot-candidate constants in `apps/web/lib/freelance/niche-reference-data.ts`
- [X] T015 [P] Add Zod schemas for niche create/update, candidate decision, and audit query inputs in `apps/web/lib/validation/niche-catalog.ts`
- [X] T016 Add niche repository methods for approved niches, candidates, audit runs, audit findings, and campaign selection in `apps/web/lib/freelance/repositories.ts`
- [X] T017 Update existing campaign creation niche lookup to select only enabled approved niches in `apps/web/lib/freelance/campaign-service.ts`
- [X] T018 Update existing niche list route to support admin/audit fields while preserving default campaign-safe behavior in `apps/web/app/api/freelance/niches/route.ts`
- [X] T019 [P] Add unit tests for normalization, slugging, mojibake detection, and readable display names in `apps/web/tests/unit/niche-normalization.test.ts`
- [X] T020 [P] Add unit tests for niche validation schemas and source evidence requirements in `apps/web/tests/unit/niche-validation.test.ts`
- [X] T021 Add integration test for seed backfill preserving existing campaign snapshots in `apps/web/tests/integration/niche-seed-backfill.test.ts`

**Checkpoint**: Foundation ready. Prisma model, seed metadata, normalization, validation, and repository operations exist for all stories.

---

## Phase 3: User Story 1 - Verify Catalog Completeness (Priority: P1) MVP

**Goal**: Give the operator a catalog audit that compares the current app catalog against the approved baseline, docs/reference evidence, and known visual-reference mismatches.

**Independent Test**: Open or call the catalog audit and confirm all approved baseline entries are present or reported, source evidence is shown, encoding problems are visible, and `Imobiliaria` keeps both conversion-hint values until the operator chooses an approved value.

### Tests for User Story 1

- [X] T022 [P] [US1] Add contract tests for `GET /api/freelance/niche-audit` response shape and severity groups in `apps/web/tests/contract/niche-audit-contract.test.ts`
- [X] T023 [P] [US1] Add unit tests for baseline comparison, missing/extra entries, source-missing findings, and duplicate finding generation in `apps/web/tests/unit/niche-audit-service.test.ts`
- [X] T024 [P] [US1] Add unit tests for conversion-hint mismatch handling and operator-choice blocking for `Imobiliaria` in `apps/web/tests/unit/niche-conversion-conflicts.test.ts`
- [X] T025 [P] [US1] Add integration test for audit run persistence and finding counts in `apps/web/tests/integration/niche-audit-run.test.ts`
- [X] T026 [P] [US1] Add UI component test for catalog audit summary and finding groups in `apps/web/tests/integration/niche-audit-ui.test.ts`

### Implementation for User Story 1

- [X] T027 [P] [US1] Implement audit comparison types and finding builders in `apps/web/lib/freelance/niche-audit-types.ts`
- [X] T028 [US1] Implement catalog audit service comparing DB rows, seed baseline, docs baseline, and visual candidates in `apps/web/lib/freelance/niche-audit-service.ts`
- [X] T029 [US1] Implement conversion-hint conflict resolution state and blocking audit status logic in `apps/web/lib/freelance/niche-audit-service.ts`
- [X] T030 [US1] Implement `GET /api/freelance/niche-audit` and optional fresh-run behavior in `apps/web/app/api/freelance/niche-audit/route.ts`
- [X] T031 [P] [US1] Create audit summary component in `apps/web/components/niches/niche-audit-summary.tsx`
- [X] T032 [P] [US1] Create audit finding table component with severity/type grouping in `apps/web/components/niches/niche-audit-findings.tsx`
- [X] T033 [P] [US1] Create conversion-hint conflict panel that keeps both values visible in `apps/web/components/niches/conversion-conflict-panel.tsx`
- [X] T034 [US1] Create catalog audit page under Settings in `apps/web/app/(freelance)/settings/niches/page.tsx`
- [X] T035 [US1] Add navigation entry from Settings to the niche audit page in `apps/web/app/(freelance)/settings/page.tsx`
- [X] T036 [US1] Add loading and error states for catalog audit route in `apps/web/app/(freelance)/settings/niches/loading.tsx` and `apps/web/app/(freelance)/settings/niches/error.tsx`
- [X] T037 [US1] Ensure audit UI has no CSV export/import actions using `apps/web/tests/helpers/no-csv-assertions.ts`

**Checkpoint**: US1 is independently functional. Operator can verify catalog completeness and see blocking conflicts.

---

## Phase 4: User Story 2 - Manage Planned Niches (Priority: P2)

**Goal**: Allow an internal operator to create, edit, disable, merge, classify, and source niche catalog entries without code changes while preserving old campaign snapshots.

**Independent Test**: Add a niche with source evidence, disable a used niche, verify it disappears from new campaign creation, and confirm existing campaigns still show their historical niche snapshot.

### Tests for User Story 2

- [X] T038 [P] [US2] Add contract tests for `GET/POST/PATCH /api/freelance/niches` admin behavior in `apps/web/tests/contract/niche-management-contract.test.ts`
- [X] T039 [P] [US2] Add unit tests for duplicate slug and alias conflict prevention in `apps/web/tests/unit/niche-duplicate-guard.test.ts`
- [X] T040 [P] [US2] Add unit tests for enable, disable, merge, and self-merge validation in `apps/web/tests/unit/niche-lifecycle.test.ts`
- [X] T041 [P] [US2] Add integration test for campaign selection excluding disabled/unapproved niches in `apps/web/tests/integration/niche-campaign-selection.test.ts`
- [X] T042 [P] [US2] Add integration test for historical campaign snapshot stability after niche edit/disable/merge in `apps/web/tests/integration/niche-campaign-snapshot.test.ts`
- [X] T043 [P] [US2] Add UI component test for niche form validation and slug preview in `apps/web/tests/integration/niche-management-ui.test.tsx`

### Implementation for User Story 2

- [X] T044 [P] [US2] Implement niche management service for create, update, disable, re-enable, and merge operations in `apps/web/lib/freelance/niche-service.ts`
- [X] T045 [US2] Implement duplicate slug and alias conflict checks in `apps/web/lib/freelance/niche-service.ts`
- [X] T046 [US2] Implement source evidence and conversion-hint-source enforcement in `apps/web/lib/freelance/niche-service.ts`
- [X] T047 [US2] Implement `POST /api/freelance/niches` admin create behavior in `apps/web/app/api/freelance/niches/route.ts`
- [X] T048 [US2] Implement `PATCH /api/freelance/niches/[nicheId]` admin update behavior in `apps/web/app/api/freelance/niches/[nicheId]/route.ts`
- [X] T049 [P] [US2] Create niche management form component with display name, market, aliases, query terms, source evidence, conversion hint, enabled state, and sort order fields in `apps/web/components/niches/niche-form.tsx`
- [X] T050 [P] [US2] Create approved niche table component with edit, disable, re-enable, and merge actions in `apps/web/components/niches/approved-niche-table.tsx`
- [X] T051 [P] [US2] Create duplicate/conflict warning component in `apps/web/components/niches/niche-conflict-warning.tsx`
- [X] T052 [US2] Integrate approved niche management tab into `apps/web/app/(freelance)/settings/niches/page.tsx`
- [X] T053 [US2] Update campaign creation services to use readable display names while preserving `nicheNameSnapshot` and `conversionHintSnapshot` in `apps/web/lib/freelance/campaign-service.ts`
- [X] T054 [US2] Update campaign create modal/select to hide disabled and candidate niches in `apps/web/components/campaigns/campaign-form-dialog.tsx`
- [X] T055 [US2] Update campaign card/detail niche rendering to prefer historical snapshots when catalog row changes in `apps/web/components/campaigns/campaign-card.tsx`

**Checkpoint**: US2 is independently functional. Operator can manage approved niches without breaking historical campaigns.

---

## Phase 5: User Story 3 - Reference-Driven Expansion (Priority: P3)

**Goal**: Let approved reference files and visual references propose niche catalog candidates that operators can approve, reject, defer, or mark as already covered without automatic catalog pollution or lead creation.

**Independent Test**: Run/open candidate review, see reference/image-derived niche candidates grouped with evidence, mark one already covered, defer/reject one with reason, approve one into the catalog, and confirm only approved enabled entries appear in campaign creation while no real lead/opportunity is created from the candidate record.

### Tests for User Story 3

- [X] T056 [P] [US3] Add contract tests for niche-only `GET/PATCH /api/freelance/niche-candidates` behavior in `apps/web/tests/contract/niche-candidates-contract.test.ts`
- [X] T057 [P] [US3] Add unit tests for niche candidate proposal generation from reference/images and approved baseline coverage matching in `apps/web/tests/unit/niche-candidate-service.test.ts`
- [X] T058 [P] [US3] Add unit tests for niche candidate decisions requiring matched niche or decision reason as appropriate in `apps/web/tests/unit/niche-candidate-decisions.test.ts`
- [X] T059 [P] [US3] Add integration test for approving a niche candidate into approved catalog with duplicate/source checks in `apps/web/tests/integration/niche-candidate-approval.test.ts`
- [X] T060 [P] [US3] Add integration test proving rejected/deferred/already-covered niche candidates stay out of campaign selection and do not create leads/opportunities in `apps/web/tests/integration/niche-candidate-selection-guard.test.ts`
- [X] T061 [P] [US3] Add UI component test for niche candidate review statuses, source evidence, and decision actions in `apps/web/tests/integration/niche-candidate-ui.test.ts`

### Implementation for User Story 3

- [X] T062 [P] [US3] Implement niche candidate proposal and matching utilities in `apps/web/lib/freelance/niche-candidate-service.ts`
- [X] T063 [US3] Implement niche candidate review service for approve, reject, defer, and already-covered decisions in `apps/web/lib/freelance/niche-candidate-service.ts`
- [X] T064 [US3] Implement niche candidate approval path that reuses duplicate/source validation from `apps/web/lib/freelance/niche-service.ts` without creating leads or outreach targets
- [X] T065 [US3] Implement niche-only `GET /api/freelance/niche-candidates` in `apps/web/app/api/freelance/niche-candidates/route.ts`
- [X] T066 [US3] Implement `PATCH /api/freelance/niche-candidates/[candidateId]` decisions in `apps/web/app/api/freelance/niche-candidates/[candidateId]/route.ts`
- [X] T067 [P] [US3] Create niche candidate review list component with status, source evidence, and suggested match display in `apps/web/components/niches/niche-candidate-list.tsx`
- [X] T068 [P] [US3] Create niche candidate decision dialog component requiring reason or matched niche where needed in `apps/web/components/niches/niche-candidate-decision-dialog.tsx`
- [X] T069 [US3] Integrate niche candidate review tab into `apps/web/app/(freelance)/settings/niches/page.tsx`
- [X] T070 [US3] Update catalog audit service to include niche candidate counts and deferred/unreviewed candidate findings in `apps/web/lib/freelance/niche-audit-service.ts`
- [X] T071 [US3] Add deterministic reference/image niche candidate bootstrap while preserving operator-approved `Igrejas` baseline in `apps/web/prisma/seed.ts`

**Checkpoint**: US3 is independently functional. References propose candidates without automatic approval.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish validation, docs, operational notes, and active Spec Kit handoff.

- [X] T072 [P] Update `specs/015-freelance-niche-catalog/quickstart.md` with final routes, validation commands, candidate-vs-lead guard, and manual review notes
- [X] T073 [P] Update `docs/reference-ui.md` with catalog governance, audit, niche candidate review, `Igrejas`, and conversion-conflict behavior
- [X] T074 [P] Update `docs/bot-1-scraper.md` with governed niche source, aliases/query terms, candidate approval rules, and scraper/API-only real lead discovery
- [X] T075 [P] Update `docs/domain-model.md` with niche governance entities, niche candidate vs lead separation, and campaign snapshot preservation
- [X] T076 [P] Update `docs/architecture.md` with `apps/web` catalog governance boundaries, no provider-real scope change, and no real lead creation from reference/images
- [X] T077 Update `docs/roadmap.md` with `015` implementation status and next recommended scope
- [X] T078 Update `docs/handoff.md` with current phase, completed task range, validation results, and latest working prompt
- [X] T079 Update `docs/next-spec-prompt.md` with the next Spec Kit command after implementation
- [X] T080 Run `npm run typecheck` in `apps/web/package.json`
- [X] T081 Run `npm run test` in `apps/web/package.json`
- [X] T082 Run `npm run build` in `apps/web/package.json`
- [X] T083 Run manual quickstart validation from `specs/015-freelance-niche-catalog/quickstart.md`
- [X] T084 Verify no Full-time/job/resume/candidature labels were introduced in `apps/web/app/(freelance)` and `apps/web/components/niches`
- [X] T085 Verify no CSV import/export behavior was introduced in `apps/web/app/(freelance)` and `apps/web/app/api/freelance`
- [X] T086 Verify no niche candidate code path creates `FreelanceLead`, `ProspectingJob`, outreach, email, or WhatsApp records in `apps/web/lib/freelance/niche-candidate-service.ts` and `apps/web/app/api/freelance/niche-candidates`
- [X] T087 Verify `AGENTS.md` and `.cursor/rules/specify-rules.mdc` point to `specs/015-freelance-niche-catalog/tasks.md` while implementation is active

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **US1 Audit MVP (Phase 3)**: Depends on Foundational; recommended MVP.
- **US2 Management (Phase 4)**: Depends on Foundational; can run after or alongside US1 once shared schema/services exist, but integrates with US1 audit UI.
- **US3 Candidate Expansion (Phase 5)**: Depends on Foundational and benefits from US1 audit display; approval path reuses US2 validation.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2; no dependency on US2 or US3.
- **US2 (P2)**: Can start after Phase 2; must preserve US1 audit behavior.
- **US3 (P3)**: Can start after Phase 2; approval implementation should reuse US2 duplicate/source validation.

### Within Each User Story

- Tests first and expected to fail before implementation.
- Models and validation before services.
- Services before route handlers.
- Route handlers before UI integration.
- UI integration before manual quickstart validation.

---

## Parallel Opportunities

- Setup fixture tasks T002-T004 can run in parallel.
- Foundational utility/schema test tasks T013-T015 and T019-T020 can run in parallel after schema design is understood.
- US1 test tasks T022-T026 can run in parallel.
- US1 components T031-T033 can run in parallel after service response shape is defined.
- US2 test tasks T038-T043 can run in parallel.
- US2 components T049-T051 can run in parallel after validation schema is defined.
- US3 test tasks T056-T061 can run in parallel.
- US3 components T067-T068 can run in parallel after candidate response shape is defined.
- Documentation tasks T072-T076 can run in parallel after implementation behavior stabilizes.

---

## Parallel Example: User Story 1

```bash
Task: "Add contract tests for GET /api/freelance/niche-audit response shape and severity groups in apps/web/tests/contract/niche-audit-contract.test.ts"
Task: "Add unit tests for baseline comparison, missing/extra entries, source-missing findings, and duplicate finding generation in apps/web/tests/unit/niche-audit-service.test.ts"
Task: "Add unit tests for conversion-hint mismatch handling and operator-choice blocking for Imobiliaria in apps/web/tests/unit/niche-conversion-conflicts.test.ts"
Task: "Add integration test for audit run persistence and finding counts in apps/web/tests/integration/niche-audit-run.test.ts"
Task: "Add UI component test for catalog audit summary and finding groups in apps/web/tests/integration/niche-audit-ui.test.ts"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add contract tests for GET/POST/PATCH /api/freelance/niches admin behavior in apps/web/tests/contract/niche-management-contract.test.ts"
Task: "Add unit tests for duplicate slug and alias conflict prevention in apps/web/tests/unit/niche-duplicate-guard.test.ts"
Task: "Create niche management form component with display name, market, aliases, query terms, source evidence, conversion hint, enabled state, and sort order fields in apps/web/components/niches/niche-form.tsx"
Task: "Create approved niche table component with edit, disable, re-enable, and merge actions in apps/web/components/niches/approved-niche-table.tsx"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add contract tests for GET/PATCH /api/freelance/niche-candidates in apps/web/tests/contract/niche-candidates-contract.test.ts"
Task: "Add unit tests for candidate proposal generation from visual references and baseline coverage matching in apps/web/tests/unit/niche-candidate-service.test.ts"
Task: "Create candidate review list component with status, source evidence, and suggested match display in apps/web/components/niches/niche-candidate-list.tsx"
Task: "Create candidate decision dialog component requiring reason or matched niche where needed in apps/web/components/niches/niche-candidate-decision-dialog.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational schema, seed, validation, and repositories.
3. Complete Phase 3 audit MVP.
4. Stop and validate US1 independently with audit tests and manual audit review.

### Incremental Delivery

1. Setup + Foundational -> schema and governance primitives ready.
2. US1 -> audit visibility and baseline confidence.
3. US2 -> operator-managed approved catalog without code changes.
4. US3 -> reference-driven candidate expansion.
5. Polish -> docs, handoff, full validation, and next prompt.

### Parallel Team Strategy

With multiple implementers:

1. One person owns schema/seed/repositories in Phase 2.
2. One person writes US1 audit tests and service expectations.
3. One person starts US2/US3 UI components once response shapes are stable.
4. Merge by story checkpoint, not by file bundle, to preserve independent validation.

---

## Notes

- [P] tasks touch different files and can run in parallel when prerequisites are satisfied.
- Keep all changes additive and preserve existing campaign snapshots.
- Do not introduce CSV import/export, provider-real Maps scope, automatic outreach, or Full-time language.
- Prefer existing `apps/web` service, repository, route handler, and component patterns.
- Use React Server Component boundaries deliberately and avoid broad client components where server data rendering is enough.
