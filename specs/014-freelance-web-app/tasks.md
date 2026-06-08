# Tasks: Freelance Web App

**Input**: Design documents from `/specs/014-freelance-web-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/

**Tests**: Include contract, integration, unit, and UI smoke tasks because `docs/next-spec-prompt.md` explicitly requests validation for data model, provider payloads, worker lifecycle, no job-language leakage, and human-gated generation.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after shared foundation.

## Continuity Context

**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Generate implementation tasks for `specs/014-freelance-web-app/plan.md`. Preserve a new `apps/web` Next.js/Prisma Freelance app with a separate web worker, seeded niche catalog, realistic local discovery provider abstraction, lightweight website analysis, BR/international campaigns, no CSV export, latest-generated prompt/message persistence only, and no automatic outreach.

> Include a task to refresh `docs/handoff.md` whenever implementation status changes materially or
> work is being handed off to another human or model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task belongs to
- All implementation tasks include exact target paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the standalone `apps/web` workspace and tooling without modifying Full-time flows.

- [X] T001 Create `apps/web/package.json` with scripts for `dev`, `build`, `start`, `typecheck`, `test`, `test:unit`, `test:integration`, `test:contract`, `worker`, `prisma:migrate`, and `prisma:seed`
- [X] T002 Create `apps/web/tsconfig.json` and `apps/web/next.config.ts` for a strict Next.js TypeScript app
- [X] T003 Create `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, and `apps/web/app/globals.css` with a minimal app shell entry that redirects or links to `/dashboard`
- [X] T004 [P] Create `apps/web/.env.example` documenting `DATABASE_URL`, `FREELANCE_MAPS_PROVIDER`, `APIFY_TOKEN`, `SERPAPI_API_KEY`, `OPENAI_API_KEY`, and `AI_FREELANCE_MODEL`
- [X] T005 [P] Create `apps/web/vitest.config.ts` and `apps/web/tests/setup.ts` for unit, integration, and contract test execution
- [X] T006 [P] Create `apps/web/components.json` and `apps/web/lib/utils.ts` for shadcn/ui-compatible component setup
- [X] T007 [P] Create base UI primitives in `apps/web/components/ui/button.tsx`, `apps/web/components/ui/input.tsx`, `apps/web/components/ui/select.tsx`, `apps/web/components/ui/dialog.tsx`, `apps/web/components/ui/tabs.tsx`, `apps/web/components/ui/badge.tsx`, `apps/web/components/ui/card.tsx`, and `apps/web/components/ui/table.tsx`
- [X] T008 Add `web` and `web-worker` service stubs to `docker-compose.yml` using `apps/web` as working directory and the existing PostgreSQL service
- [X] T009 Add `apps/web` notes to `.env.example` for local web and web-worker configuration
- [X] T010 Verify `apps/api`, `apps/worker`, and `apps/extension` are not imported by `apps/web` in `apps/web/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish schema, validation, provider contracts, layout, and shared services that all user stories depend on.

**CRITICAL**: No user story work should begin until this phase is complete.

### Tests

- [X] T011 [P] Create contract tests for OpenAPI route schemas in `apps/web/tests/contract/freelance-openapi-contract.test.ts`
- [X] T012 [P] Create contract tests for provider payload normalization in `apps/web/tests/contract/provider-payloads-contract.test.ts`
- [X] T013 [P] Create unit tests for Freelance validation schemas in `apps/web/tests/unit/freelance-validation.test.ts`
- [X] T014 [P] Create unit tests for no job-language navigation labels in `apps/web/tests/unit/freelance-copy-guard.test.ts`

### Data and Configuration

- [X] T015 Create Prisma schema with core enums and models in `apps/web/prisma/schema.prisma`
- [X] T016 Create Prisma client singleton in `apps/web/lib/prisma.ts`
- [X] T017 Create initial Prisma migration for `FreelanceNiche`, `FreelanceCampaign`, `ProspectingJob`, `FreelanceLead`, `WebsiteAnalysis`, `CommercialTemplate`, `SellerSettings`, and `LatestGeneratedText` in `apps/web/prisma/migrations/`
- [X] T018 Create niche seed data copied from `references/opportunity-desk-pro/src/lib/mockData.ts` in `apps/web/prisma/seed-data/niches.ts`
- [X] T019 Create default commercial templates seed data in `apps/web/prisma/seed-data/templates.ts`
- [X] T020 Create Prisma seed runner in `apps/web/prisma/seed.ts` that inserts niches and system templates idempotently
- [X] T021 Create app configuration parser in `apps/web/lib/config.ts` with server-only provider and AI key access
- [X] T022 Create shared enum constants and labels in `apps/web/lib/freelance/constants.ts`

### Validation and Services

- [X] T023 Create Zod schemas for campaign, lead filters, lead update, template, settings, generation, provider payload, and website analysis in `apps/web/lib/validation/freelance.ts`
- [X] T024 Create repository helpers for owner-scoped Prisma queries in `apps/web/lib/freelance/repositories.ts`
- [X] T025 Create campaign service shell in `apps/web/lib/freelance/campaign-service.ts`
- [X] T026 Create prospecting job service shell in `apps/web/lib/freelance/job-service.ts`
- [X] T027 Create lead service shell in `apps/web/lib/freelance/lead-service.ts`
- [X] T028 Create template service shell in `apps/web/lib/freelance/template-service.ts`
- [X] T029 Create seller settings service shell in `apps/web/lib/freelance/settings-service.ts`
- [X] T030 Create latest generated text service shell in `apps/web/lib/freelance/generation-service.ts`
- [X] T031 Create dashboard metrics service shell in `apps/web/lib/freelance/metrics-service.ts`

### Provider and Worker Foundation

- [X] T032 Create `freelance_maps_provider` interface in `apps/web/lib/providers/freelance-maps-provider.ts`
- [X] T033 Create mock Maps provider in `apps/web/lib/providers/mock-maps-provider.ts`
- [X] T034 Create Apify provider adapter skeleton in `apps/web/lib/providers/apify-google-maps-provider.ts`
- [X] T035 Create SerpApi provider adapter skeleton in `apps/web/lib/providers/serpapi-google-maps-provider.ts`
- [X] T036 Create provider factory in `apps/web/lib/providers/provider-factory.ts`
- [X] T037 Create website analysis interface in `apps/web/worker/website-analysis/types.ts`
- [X] T038 Create lightweight website fetch/analyzer shell in `apps/web/worker/website-analysis/analyzer.ts`
- [X] T039 Create web worker entrypoint in `apps/web/worker/index.ts`
- [X] T040 Create prospecting job processor shell in `apps/web/worker/jobs/process-prospecting-job.ts`

### Layout and State

- [X] T041 Create dark operational shell layout in `apps/web/components/layout/freelance-shell.tsx`
- [X] T042 Create sidebar navigation in `apps/web/components/layout/sidebar.tsx`
- [X] T043 Create top status bar in `apps/web/components/layout/top-status-bar.tsx`
- [X] T044 Create Zustand UI store for filters, selected leads, active campaign, job progress, and panel preferences in `apps/web/lib/freelance/ui-store.ts`
- [X] T045 Create shared empty/loading/error state components in `apps/web/components/layout/states.tsx`

**Checkpoint**: Foundation ready. Prisma schema, validation, provider interfaces, worker shell, layout shell, and base tests exist.

---

## Phase 3: User Story 1 - Create a Prospecting Campaign (Priority: P1)

**Goal**: Operator can create BR and international Freelance campaigns from the seeded niche catalog.

**Independent Test**: Create one BR campaign and one international campaign from enabled seeded niches, see both in Campaigns, and confirm no job/curriculum language appears.

### Tests for User Story 1

- [X] T046 [P] [US1] Create contract tests for `GET /api/freelance/niches`, `GET /api/freelance/campaigns`, and `POST /api/freelance/campaigns` in `apps/web/tests/contract/campaigns-contract.test.ts`
- [X] T047 [P] [US1] Create integration tests for BR and international campaign creation in `apps/web/tests/integration/campaign-create-flow.test.ts`
- [X] T048 [P] [US1] Create unit tests for disabled niche and required location validation in `apps/web/tests/unit/campaign-validation.test.ts`
- [X] T049 [P] [US1] Create UI copy guard test for Campaigns screen in `apps/web/tests/unit/campaign-copy-guard.test.ts`

### Implementation for User Story 1

- [X] T050 [US1] Implement niche listing in `apps/web/lib/freelance/campaign-service.ts`
- [X] T051 [US1] Implement campaign create/update/list logic in `apps/web/lib/freelance/campaign-service.ts`
- [X] T052 [US1] Implement `GET /api/freelance/niches` route in `apps/web/app/api/freelance/niches/route.ts`
- [X] T053 [US1] Implement `GET` and `POST /api/freelance/campaigns` route in `apps/web/app/api/freelance/campaigns/route.ts`
- [X] T054 [US1] Implement `PATCH /api/freelance/campaigns/[campaignId]` route in `apps/web/app/api/freelance/campaigns/[campaignId]/route.ts`
- [X] T055 [P] [US1] Create Campaigns page in `apps/web/app/(freelance)/campaigns/page.tsx`
- [X] T056 [P] [US1] Create campaign form dialog in `apps/web/components/campaigns/campaign-form-dialog.tsx`
- [X] T057 [P] [US1] Create campaign card component in `apps/web/components/campaigns/campaign-card.tsx`
- [X] T058 [US1] Wire market-specific BR/international fields into `apps/web/components/campaigns/campaign-form-dialog.tsx`
- [X] T059 [US1] Display conversion hints as estimates in `apps/web/components/campaigns/campaign-form-dialog.tsx`
- [X] T060 [US1] Add empty Campaigns state in `apps/web/app/(freelance)/campaigns/page.tsx`
- [X] T061 [US1] Add dashboard link to create campaign in `apps/web/app/(freelance)/dashboard/page.tsx`
- [X] T062 [US1] Run and document US1 quickstart validation in `specs/014-freelance-web-app/quickstart.md`

**Checkpoint**: US1 is independently functional: campaigns can be created and listed from seeded niches.

---

## Phase 4: User Story 2 - Discover and Classify Local Businesses (Priority: P1)

**Goal**: Operator can start one prospecting job path that discovers businesses, dedupes, analyzes lightweight website signals, and saves reviewable leads.

**Independent Test**: Start prospecting from a ready campaign using mock provider; verify progress, saved leads, source evidence, website classification, dedupe outcomes, and terminal job state.

### Tests for User Story 2

- [ ] T063 [P] [US2] Create contract tests for `POST /api/freelance/campaigns/{campaignId}/prospecting-jobs` and `GET /api/freelance/prospecting-jobs/{jobId}` in `apps/web/tests/contract/prospecting-jobs-contract.test.ts`
- [ ] T064 [P] [US2] Create provider normalization tests in `apps/web/tests/unit/maps-provider-normalization.test.ts`
- [ ] T065 [P] [US2] Create dedupe rule tests in `apps/web/tests/unit/freelance-dedupe.test.ts`
- [ ] T066 [P] [US2] Create website status mapping tests in `apps/web/tests/unit/website-status.test.ts`
- [ ] T067 [P] [US2] Create lightweight website analyzer tests in `apps/web/tests/unit/website-analyzer.test.ts`
- [ ] T068 [P] [US2] Create worker lifecycle integration test in `apps/web/tests/integration/prospecting-worker-flow.test.ts`
- [ ] T069 [P] [US2] Create no-results/provider-failure integration tests in `apps/web/tests/integration/prospecting-failure-states.test.ts`

### Implementation for User Story 2

- [ ] T070 [US2] Implement prospecting job create/list/read logic in `apps/web/lib/freelance/job-service.ts`
- [ ] T071 [US2] Implement `POST /api/freelance/campaigns/[campaignId]/prospecting-jobs` route in `apps/web/app/api/freelance/campaigns/[campaignId]/prospecting-jobs/route.ts`
- [ ] T072 [US2] Implement `GET /api/freelance/prospecting-jobs/[jobId]` route in `apps/web/app/api/freelance/prospecting-jobs/[jobId]/route.ts`
- [ ] T073 [US2] Implement provider result normalization in `apps/web/lib/providers/freelance-maps-provider.ts`
- [ ] T074 [US2] Implement deterministic mock provider payloads in `apps/web/lib/providers/mock-maps-provider.ts`
- [ ] T075 [US2] Implement Apify adapter request/response mapping in `apps/web/lib/providers/apify-google-maps-provider.ts`
- [ ] T076 [US2] Implement SerpApi adapter request/response mapping in `apps/web/lib/providers/serpapi-google-maps-provider.ts`
- [ ] T077 [US2] Implement dedupe rules in `apps/web/worker/jobs/dedupe.ts`
- [ ] T078 [US2] Implement candidate acceptance/rejection rules in `apps/web/worker/jobs/candidate-normalizer.ts`
- [ ] T079 [US2] Implement lightweight homepage fetch in `apps/web/worker/website-analysis/analyzer.ts`
- [ ] T080 [US2] Implement title/meta/headings/CTA/contact extraction in `apps/web/worker/website-analysis/analyzer.ts`
- [ ] T081 [US2] Implement social-only, Linktree, aggregator, broken, weak-site, usable-site, and uncertain classification in `apps/web/worker/website-analysis/classifier.ts`
- [ ] T082 [US2] Implement content/design/performance/SEO scoring in `apps/web/worker/website-analysis/scoring.ts`
- [ ] T083 [US2] Implement prospecting job processor steps and counters in `apps/web/worker/jobs/process-prospecting-job.ts`
- [ ] T084 [US2] Implement worker polling loop and active-job guard in `apps/web/worker/index.ts`
- [ ] T085 [US2] Persist saved leads and website analysis snapshots in `apps/web/lib/freelance/lead-service.ts`
- [ ] T086 [US2] Update campaign counters after job completion in `apps/web/lib/freelance/campaign-service.ts`
- [ ] T087 [US2] Add Prospect button and progress polling to `apps/web/components/campaigns/campaign-card.tsx`
- [ ] T088 [US2] Add running/progress UI to Campaigns page in `apps/web/app/(freelance)/campaigns/page.tsx`
- [ ] T089 [US2] Add provider failure and no-results states to `apps/web/components/campaigns/campaign-card.tsx`
- [ ] T090 [US2] Add structured worker logs without secrets in `apps/web/worker/jobs/process-prospecting-job.ts`
- [ ] T091 [US2] Run and document US2 quickstart validation in `specs/014-freelance-web-app/quickstart.md`

**Checkpoint**: US2 is independently functional: a campaign can create a background job and save classified leads with evidence.

---

## Phase 5: User Story 3 - Review Freelance Leads in a Dense Operations UI (Priority: P2)

**Goal**: Operator can filter, inspect, and update Freelance leads with source and website evidence.

**Independent Test**: Open Leads, filter by campaign/niche/status/website status/score, open detail, update status/temperature/notes/demo URL, and confirm no job-language leakage.

### Tests for User Story 3

- [ ] T092 [P] [US3] Create contract tests for `GET /api/freelance/leads`, `GET /api/freelance/leads/{leadId}`, and `PATCH /api/freelance/leads/{leadId}` in `apps/web/tests/contract/leads-contract.test.ts`
- [ ] T093 [P] [US3] Create integration tests for lead filtering in `apps/web/tests/integration/lead-filters.test.ts`
- [ ] T094 [P] [US3] Create integration tests for lead detail updates in `apps/web/tests/integration/lead-detail-update.test.ts`
- [ ] T095 [P] [US3] Create UI copy guard tests for Leads and Lead Detail in `apps/web/tests/unit/lead-copy-guard.test.ts`
- [ ] T096 [P] [US3] Create unit tests for dashboard metrics calculation in `apps/web/tests/unit/freelance-metrics.test.ts`

### Implementation for User Story 3

- [ ] T097 [US3] Implement lead list filters in `apps/web/lib/freelance/lead-service.ts`
- [ ] T098 [US3] Implement lead detail read/update logic in `apps/web/lib/freelance/lead-service.ts`
- [ ] T099 [US3] Implement dashboard metrics in `apps/web/lib/freelance/metrics-service.ts`
- [ ] T100 [US3] Implement `GET /api/freelance/leads` route in `apps/web/app/api/freelance/leads/route.ts`
- [ ] T101 [US3] Implement `GET` and `PATCH /api/freelance/leads/[leadId]` route in `apps/web/app/api/freelance/leads/[leadId]/route.ts`
- [ ] T102 [US3] Create Leads page in `apps/web/app/(freelance)/leads/page.tsx`
- [ ] T103 [P] [US3] Create lead filters component in `apps/web/components/leads/lead-filters.tsx`
- [ ] T104 [P] [US3] Create dense lead table component in `apps/web/components/leads/lead-table.tsx`
- [ ] T105 [P] [US3] Create score and status badge components in `apps/web/components/leads/lead-badges.tsx`
- [ ] T106 [US3] Wire Zustand filter and row selection state in `apps/web/lib/freelance/ui-store.ts`
- [ ] T107 [US3] Create Lead Detail page in `apps/web/app/(freelance)/leads/[leadId]/page.tsx`
- [ ] T108 [P] [US3] Create business info and source evidence panels in `apps/web/components/leads/lead-detail-panels.tsx`
- [ ] T109 [P] [US3] Create website analysis score/evidence panel in `apps/web/components/leads/website-analysis-panel.tsx`
- [ ] T110 [P] [US3] Create commercial status, temperature, notes, and demo URL editor in `apps/web/components/leads/lead-review-panel.tsx`
- [ ] T111 [US3] Create Dashboard page in `apps/web/app/(freelance)/dashboard/page.tsx`
- [ ] T112 [US3] Add dashboard metric cards and recent leads section in `apps/web/components/dashboard/freelance-dashboard.tsx`
- [ ] T113 [US3] Ensure CSV export is absent from `apps/web/app/(freelance)/leads/page.tsx`
- [ ] T114 [US3] Run and document US3 quickstart validation in `specs/014-freelance-web-app/quickstart.md`

**Checkpoint**: US3 is independently functional: saved leads can be reviewed and updated from a dense Freelance UI.

---

## Phase 6: User Story 4 - Generate Lovable Prompts and Commercial Messages (Priority: P2)

**Goal**: Operator can generate, review, edit, copy, and retain only latest prompt/message text per lead.

**Independent Test**: From one lead detail, save demo URL, generate prompt variants, copy prompt, generate first-contact/follow-up messages, edit/copy, refresh, and confirm latest text remains without automatic send.

### Tests for User Story 4

- [ ] T115 [P] [US4] Create contract tests for generation routes in `apps/web/tests/contract/generation-contract.test.ts`
- [ ] T116 [P] [US4] Create unit tests for Lovable prompt builder in `apps/web/tests/unit/lovable-prompt-builder.test.ts`
- [ ] T117 [P] [US4] Create unit tests for commercial message builder in `apps/web/tests/unit/commercial-message-builder.test.ts`
- [ ] T118 [P] [US4] Create integration tests for latest-generated replacement in `apps/web/tests/integration/latest-generated-text.test.ts`
- [ ] T119 [P] [US4] Create human-gated outreach tests in `apps/web/tests/unit/human-gated-generation.test.ts`

### Implementation for User Story 4

- [ ] T120 [US4] Implement latest generated text persistence in `apps/web/lib/freelance/generation-service.ts`
- [ ] T121 [US4] Implement Lovable prompt builder in `apps/web/lib/generation/lovable-prompt-builder.ts`
- [ ] T122 [US4] Implement commercial message builder in `apps/web/lib/generation/commercial-message-builder.ts`
- [ ] T123 [US4] Implement `POST /api/freelance/generation/lovable-prompt` route in `apps/web/app/api/freelance/generation/lovable-prompt/route.ts`
- [ ] T124 [US4] Implement `POST /api/freelance/generation/message` route in `apps/web/app/api/freelance/generation/message/route.ts`
- [ ] T125 [P] [US4] Create Lovable prompt modal in `apps/web/components/leads/lovable-prompt-modal.tsx`
- [ ] T126 [P] [US4] Create message generator panel in `apps/web/components/leads/message-generator-panel.tsx`
- [ ] T127 [US4] Add complete/generic/compact prompt variant selection in `apps/web/components/leads/lovable-prompt-modal.tsx`
- [ ] T128 [US4] Add first-contact/follow-up message stage selection in `apps/web/components/leads/message-generator-panel.tsx`
- [ ] T129 [US4] Add editable generated text and copy feedback in `apps/web/components/leads/generated-text-editor.tsx`
- [ ] T130 [US4] Wire prompt and message components into `apps/web/app/(freelance)/leads/[leadId]/page.tsx`
- [ ] T131 [US4] Ensure email/WhatsApp actions are copy/open only in `apps/web/components/leads/message-generator-panel.tsx`
- [ ] T132 [US4] Run and document US4 quickstart validation in `specs/014-freelance-web-app/quickstart.md`

**Checkpoint**: US4 is independently functional: lead detail generates reviewable latest prompt/message text with no automatic outreach.

---

## Phase 7: User Story 5 - Manage Freelance Templates and Settings (Priority: P3)

**Goal**: Operator can manage commercial templates and seller settings used by campaign defaults and message generation.

**Independent Test**: Edit seller data and templates, generate a message, and confirm output reflects saved values while remaining commercial-only.

### Tests for User Story 5

- [ ] T133 [P] [US5] Create contract tests for templates routes in `apps/web/tests/contract/templates-contract.test.ts`
- [ ] T134 [P] [US5] Create contract tests for settings routes in `apps/web/tests/contract/settings-contract.test.ts`
- [ ] T135 [P] [US5] Create integration tests for template CRUD in `apps/web/tests/integration/template-management.test.ts`
- [ ] T136 [P] [US5] Create integration tests for seller settings and message generation context in `apps/web/tests/integration/seller-settings-generation.test.ts`
- [ ] T137 [P] [US5] Create unit tests for template variable validation in `apps/web/tests/unit/template-variable-validation.test.ts`

### Implementation for User Story 5

- [ ] T138 [US5] Implement commercial template CRUD in `apps/web/lib/freelance/template-service.ts`
- [ ] T139 [US5] Implement seller settings read/upsert in `apps/web/lib/freelance/settings-service.ts`
- [ ] T140 [US5] Implement `GET` and `POST /api/freelance/templates` route in `apps/web/app/api/freelance/templates/route.ts`
- [ ] T141 [US5] Implement `PATCH` and `DELETE /api/freelance/templates/[templateId]` route in `apps/web/app/api/freelance/templates/[templateId]/route.ts`
- [ ] T142 [US5] Implement `GET` and `PUT /api/freelance/settings` route in `apps/web/app/api/freelance/settings/route.ts`
- [ ] T143 [US5] Create Templates page in `apps/web/app/(freelance)/templates/page.tsx`
- [ ] T144 [P] [US5] Create template list/cards component in `apps/web/components/templates/template-list.tsx`
- [ ] T145 [P] [US5] Create template editor dialog in `apps/web/components/templates/template-editor-dialog.tsx`
- [ ] T146 [P] [US5] Create template preview component in `apps/web/components/templates/template-preview.tsx`
- [ ] T147 [US5] Create Settings page in `apps/web/app/(freelance)/settings/page.tsx`
- [ ] T148 [P] [US5] Create seller settings form in `apps/web/components/settings/seller-settings-form.tsx`
- [ ] T149 [P] [US5] Create preferred niches selector in `apps/web/components/settings/preferred-niches-selector.tsx`
- [ ] T150 [US5] Add missing-data alert for generation prerequisites in `apps/web/components/settings/settings-alert.tsx`
- [ ] T151 [US5] Wire saved settings into message generation in `apps/web/lib/generation/commercial-message-builder.ts`
- [ ] T152 [US5] Run and document US5 quickstart validation in `specs/014-freelance-web-app/quickstart.md`

**Checkpoint**: US5 is independently functional: templates/settings are manageable and generation uses saved commercial context.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full story, harden UX, update docs, and prepare the next Spec Kit step.

- [ ] T153 [P] Add accessibility labels and keyboard support to modal/table/form controls in `apps/web/components/`
- [ ] T154 [P] Add loading skeletons and terminal error states across `apps/web/app/(freelance)/`
- [ ] T155 [P] Audit CSS for one-note palettes, text overflow, nested cards, and mobile/desktop overlap in `apps/web/app/globals.css`
- [ ] T156 [P] Add route-level not-found/error boundaries in `apps/web/app/(freelance)/leads/[leadId]/not-found.tsx` and `apps/web/app/(freelance)/error.tsx`
- [ ] T157 [P] Add server-only guard tests for provider/AI secrets in `apps/web/tests/unit/server-secret-guard.test.ts`
- [ ] T158 Run `npm run typecheck` in `apps/web`
- [ ] T159 Run `npm run test` in `apps/web`
- [ ] T160 Run `npm run build` in `apps/web`
- [ ] T161 Run Prisma migration and seed validation from `apps/web`
- [ ] T162 Run quickstart smoke from `specs/014-freelance-web-app/quickstart.md`
- [ ] T163 Verify `apps/extension npm run typecheck` still passes after Docker/package changes
- [ ] T164 Verify no `Full-time`, resume, interview, or job application labels appear in `apps/web/app/(freelance)/`
- [ ] T165 Update `docs/architecture.md` with implemented `apps/web` and web-worker details
- [ ] T166 Update `docs/domain-model.md` with final Prisma entity names and any naming deviations from `data-model.md`
- [ ] T167 Update `docs/reference-ui.md` if implementation intentionally differs from the reference UI contract
- [ ] T168 Update `docs/handoff.md` with implementation status, validations, remaining risks, and latest prompt
- [ ] T169 Update `docs/roadmap.md` with current Fase 4 implementation progress
- [ ] T170 Prepare the next Spec Kit prompt in `docs/next-spec-prompt.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US1 Campaign Creation (Phase 3)**: Depends on Foundation; unlocks realistic manual campaign setup.
- **US2 Discovery and Classification (Phase 4)**: Depends on Foundation and US1 campaign records.
- **US3 Lead Review (Phase 5)**: Depends on Foundation; works best after US2 creates saved leads but can use seeded/mock leads.
- **US4 Prompt and Message Generation (Phase 6)**: Depends on Foundation and lead detail data; templates/settings may use defaults until US5.
- **US5 Templates and Settings (Phase 7)**: Depends on Foundation; improves US4 but can be implemented after a default template/settings path.
- **Polish (Phase 8)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: No user-story dependency after Foundation.
- **US2**: Requires at least one campaign from US1.
- **US3**: Requires saved or seeded leads; can be developed with mock/seed data before US2 is complete.
- **US4**: Requires a lead detail and default templates/settings; full template/settings management can arrive in US5.
- **US5**: No dependency on discovery; depends on foundational template/settings schema.

### Parallel Opportunities

- Setup tasks T004-T007 can run in parallel after T001-T003 begin.
- Foundation tests T011-T014 can run in parallel.
- Provider adapters T034-T036 can run in parallel after the provider interface exists.
- UI components within each story marked [P] can run in parallel with service work once contracts are stable.
- US3 and US5 can be developed against seeded data while US2 worker details are still being completed.

---

## Parallel Execution Examples

### US1 Campaign Creation

```bash
Task: "Create contract tests for campaigns in apps/web/tests/contract/campaigns-contract.test.ts"
Task: "Create Campaigns page in apps/web/app/(freelance)/campaigns/page.tsx"
Task: "Create campaign card component in apps/web/components/campaigns/campaign-card.tsx"
```

### US2 Discovery Worker

```bash
Task: "Create provider normalization tests in apps/web/tests/unit/maps-provider-normalization.test.ts"
Task: "Implement deterministic mock provider payloads in apps/web/lib/providers/mock-maps-provider.ts"
Task: "Implement lightweight homepage fetch in apps/web/worker/website-analysis/analyzer.ts"
```

### US3 Lead Review

```bash
Task: "Create lead filters component in apps/web/components/leads/lead-filters.tsx"
Task: "Create website analysis score/evidence panel in apps/web/components/leads/website-analysis-panel.tsx"
Task: "Create unit tests for dashboard metrics calculation in apps/web/tests/unit/freelance-metrics.test.ts"
```

### US4 Generation

```bash
Task: "Create unit tests for Lovable prompt builder in apps/web/tests/unit/lovable-prompt-builder.test.ts"
Task: "Create Lovable prompt modal in apps/web/components/leads/lovable-prompt-modal.tsx"
Task: "Create message generator panel in apps/web/components/leads/message-generator-panel.tsx"
```

### US5 Templates and Settings

```bash
Task: "Create contract tests for settings routes in apps/web/tests/contract/settings-contract.test.ts"
Task: "Create seller settings form in apps/web/components/settings/seller-settings-form.tsx"
Task: "Create template editor dialog in apps/web/components/templates/template-editor-dialog.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1 campaign creation.
3. Complete US2 with mock provider and lightweight website analysis.
4. Complete US3 lead review.
5. Complete US4 generation with default templates/settings.
6. Complete the minimum US5 settings/templates needed for repeated use.
7. Run quickstart validation before provider credentials or real scraping scale.

### Incremental Delivery

- Deliver US1 first to validate catalog and campaign UX.
- Deliver US2 next to prove the full discovery/analyze/save lifecycle.
- Deliver US3 to make saved data operationally useful.
- Deliver US4 to convert analysis into Lovable/demo and outreach material.
- Deliver US5 to make repeat use ergonomic.

### Guardrails

- Do not add automatic WhatsApp or email sending tasks.
- Do not add CSV import/export tasks.
- Do not modify `apps/extension` except validation in T163.
- Do not expose provider or AI secrets to client components.
- Keep all user-facing copy in `apps/web` Freelance-specific.
