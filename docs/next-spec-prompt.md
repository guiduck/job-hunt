## Command
speckit.implement

## Objective
Implement User Story 2 from `specs/014-freelance-web-app/tasks.md`: discover and classify local businesses from a campaign using the mock provider path.

## Context
- `/speckit-implement` completed Phase 1, Phase 2, and US1 for feature `014`.
- `.specify/feature.json` points to `specs/014-freelance-web-app`.
- Completed tasks: T001-T062.
- Next tasks: T063-T091.
- The active artifacts are:
  - `specs/014-freelance-web-app/spec.md`
  - `specs/014-freelance-web-app/plan.md`
  - `specs/014-freelance-web-app/research.md`
  - `specs/014-freelance-web-app/data-model.md`
  - `specs/014-freelance-web-app/quickstart.md`
  - `specs/014-freelance-web-app/contracts/openapi.yaml`
  - `specs/014-freelance-web-app/contracts/web-ui.md`
  - `specs/014-freelance-web-app/contracts/provider-payloads.md`
  - `specs/014-freelance-web-app/tasks.md`

## Implementation Direction To Preserve
- Build a new internal `apps/web` Freelance app with `Next.js`, `shadcn/ui`, `Zod`, `Zustand`,
  `Prisma`, `PostgreSQL`, local Docker Compose and future VPS-compatible deploy.
- Keep existing `apps/api`, `apps/worker` and `apps/extension` focused on `Full-time`; do not mix
  job/curriculum/candidature UI into Freelance.
- Keep long-running discovery and lightweight website analysis in a separate `apps/web` worker
  process, not in request handlers.
- Use `freelance_maps_provider` with mock mode for local deterministic tests and a first real provider
  adapter planned for Apify Google Maps Scraper or SerpApi Google Maps.
- Seed the initial niche catalog from `references/opportunity-desk-pro/src/lib/mockData.ts`
  (`NICHE_OPTIONS`), preserving conversion hints as editable estimates.
- MVP is a full thin vertical slice: campaign creation, one prospecting job path, lightweight website
  analysis, lead list/detail, Lovable prompt generation, commercial message generation and minimal
  settings/templates.
- Support BR and international campaign modes in the same flow.
- Do not include CSV export/import by default.
- Persist lead data and templates; generate prompts/messages on demand and save only the latest
  generated text per lead, without version history.
- Outreach remains human-gated: copy/open/review only, no automatic email or WhatsApp sending.

## Implementation Expectations
- Start from the US2 discovery/classification tasks T063-T091 in `tasks.md`.
- Keep task completion markers accurate in `specs/014-freelance-web-app/tasks.md`.
- Build on the existing `apps/web` setup, Prisma schema, seed data, validation, repositories,
  provider interfaces, worker shell, layout shell, and working Campaigns UI/API.
- Implement prospecting job routes/service, provider normalization, deterministic mock payloads,
  dedupe/candidate rules, lightweight website analysis/classification/scoring, worker polling, saved
  leads, campaign counters, campaign progress UI, and failure/no-results states.
- Run focused validation: prospecting contract/unit/integration tests, `npm run typecheck`, `npm run
  build`, and update quickstart notes for US2 if validated.
- Do not implement automatic outreach, ATS scoring/resume generation, CSV import/export, public SaaS
  features, team features, or `Full-time` extension changes.
- Update docs, `docs/handoff.md`, `docs/roadmap.md`, and `docs/next-spec-prompt.md` before handoff.

## Expected Output
- Implemented and checked-off tasks in `specs/014-freelance-web-app/tasks.md`.
- Focused validation output or a clear note for anything that could not be run locally.
- Updated operational docs and the next Spec Kit prompt.
