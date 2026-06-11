# Implementation Plan: Freelance Niche Catalog Governance

**Branch**: `015-freelance-niche-catalog` | **Date**: 2026-06-09 | **Spec**: `specs/015-freelance-niche-catalog/spec.md`
**Input**: Feature specification from `/specs/015-freelance-niche-catalog/spec.md`

**Note**: The official `.specify/scripts/bash/setup-plan.sh --json` could not run in this Windows environment because `bash` invokes WSL and no WSL distribution is installed. The plan setup was resolved manually from `.specify/feature.json`, matching prior local Spec Kit runs documented in `docs/handoff.md`.

## Continuity Context

**Roadmap Phase**: Fase 4. Prospeccao Freelance  
**Action Plan Step**: 7. App web freelance, post-review catalog governance before provider-real expansion  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Reconcile `specs/015-freelance-niche-catalog/plan.md` after clarification: images/references are source-of-truth inputs for possible niche catalog candidates, operator-provided niches such as `Igrejas` may be added when documentation/source evidence is updated, and real leads/opportunities must still come only from scraper/API flows such as Google Maps or configured providers.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Extend the existing `apps/web` Freelance MVP with governed niche catalog operations. The next slice adds an operator-readable catalog audit, editable approved niche records, disabled/renamed niche safety for historical campaigns, source evidence, aliases/default query terms, candidate niche review, and reference alignment checks.

The implementation remains inside `apps/web` and builds on the Prisma/Next.js architecture delivered by `014-freelance-web-app`. It should treat the current approved baseline as the 29 `NICHE_OPTIONS` rows plus operator-approved documented additions such as `Igrejas`, add the visually confirmed reference/image candidates either as approved or deferred niche records, and make encoding/source mismatches visible instead of silently hard-coding seed data. Campaign creation continues to use only enabled approved niches, while old campaigns keep their existing `nicheNameSnapshot` and `conversionHintSnapshot`. Reference/image candidates are catalog suggestions only; real business leads and opportunities remain produced by scraper/API/provider flows and should carry relevant context for outreach.

## Technical Context

**Language/Version**: TypeScript with Next.js App Router and React 19 patterns; Prisma-managed SQL migrations  
**Primary Dependencies**: Next.js, React, shadcn/ui/Radix primitives already present in `apps/web`, Zod, Zustand, Prisma, PostgreSQL, Vitest  
**Storage**: PostgreSQL through `apps/web/prisma/schema.prisma`; additive Prisma models/fields for catalog governance, candidate records, aliases/source evidence, and audit snapshots  
**Testing**: `npm run typecheck`, `npm run test`, focused `npm run test:unit`, `npm run test:integration`, and `npm run test:contract` from `apps/web`; build validation with `npm run build`  
**Target Platform**: Local internal `apps/web` app under Docker Compose/PostgreSQL, future VPS deploy unchanged  
**Project Type**: Existing internal web app feature slice; no changes to `apps/api`, `apps/worker`, or `apps/extension` unless documentation references need alignment  
**Performance Goals**: Catalog audit opens in under 2 seconds for under 250 catalog/candidate rows; campaign create form still loads selectable niches in under 2 seconds; adding/editing a niche completes in under 2 minutes for an operator  
**Constraints**: Additive schema changes; no CSV import/export; no automatic approval from reference scans; no job/resume/candidature terminology; no provider-real Maps scope expansion; no long-running work in request handlers; no real leads/opportunities created from screenshots  
**Scale/Scope**: Single internal operator MVP; baseline 29 approved seed entries plus documented operator additions; planned niche-candidate set from reference screenshots/images; future reference scans designed as review records rather than automated catalog mutation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature is scoped to the Freelance web app and preserves Full-time separation.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Niches carry market, query terms, aliases, conversion hint provenance, and source evidence; real opportunities still require scraper/API provider evidence.
- **III. Structured Opportunity Records**: PASS. Catalog candidates, source evidence, aliases, audit results, and separately scraped business leads remain structured records usable by campaigns, discovery, prompts, and analytics.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. This feature does not send outreach; it only improves catalog governance used upstream of discovery and prompt/message generation.
- **V. Compatible Architecture and Operator Workflow**: PASS. Work stays inside the existing `apps/web` operator workflow and does not put scraping/provider work into HTTP request paths.

No constitution violations are planned. The main compatibility risk is changing seeded catalog values that existing campaigns reference, so implementation must preserve campaign snapshots and use additive migrations/seed upserts.

## Project Structure

### Documentation (this feature)

```text
specs/015-freelance-niche-catalog/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api.md
|   |-- web-ui.md
|   `-- audit-report.md
`-- tasks.md                  # Active implementation task list
```

### Source Code (repository root)

```text
apps/web/
|-- app/
|   |-- (freelance)/
|   |   |-- campaigns/
|   |   |-- settings/
|   |   `-- settings/niches/        # New or equivalent catalog management route
|   `-- api/freelance/
|       |-- niches/
|       |-- niche-candidates/
|       `-- niche-audit/
|-- components/
|   |-- campaigns/
|   `-- niches/                     # Catalog audit, form, candidate review components
|-- lib/
|   |-- freelance/
|   |   |-- niche-service.ts
|   |   |-- niche-audit-service.ts
|   |   `-- niche-candidate-service.ts
|   |-- validation/
|   `-- utils.ts
|-- prisma/
|   |-- schema.prisma
|   |-- migrations/
|   |-- seed.ts
|   `-- seed-data/niches.ts
`-- tests/
    |-- contract/
    |-- integration/
    `-- unit/
```

**Structure Decision**: Keep catalog governance inside `apps/web` because `FreelanceNiche` and campaign creation already live there. Add route handlers/services/tests around the existing app conventions instead of introducing a separate admin app or backend service.

## Phase 0: Research

See `research.md`.

Key decisions:

- Treat the current 29 `NICHE_OPTIONS` plus documented operator-approved additions such as `Igrejas` as approved baseline rows, with source evidence and audit status.
- Store human-readable normalized display names separately from raw/source names so mojibake can be detected without leaking into operator UI.
- Add explicit alias/query term records or JSON fields with validation and normalized-slug duplicate prevention.
- Preserve campaign snapshots as immutable historical display fields even when catalog rows are renamed, disabled, or merged.
- Model reference/image scan output as niche `candidate` records requiring operator approval, not automatic catalog updates and not real lead/opportunity creation.
- Keep the `Imobiliaria` conversion-hint mismatch visible with both values retained, and require an operator-selected approved value before the audit can be marked aligned.

## Phase 1: Design & Contracts

See:

- `data-model.md`
- `contracts/api.md`
- `contracts/web-ui.md`
- `contracts/audit-report.md`
- `quickstart.md`

Design highlights:

- Approved catalog entries have lifecycle state, market applicability, source evidence, aliases/default query terms, and stable slugs.
- Candidate niches can be proposed from references/images or operator input, approved, rejected, deferred, or matched to an existing niche.
- Business leads/opportunities are separate records produced by scraper/API/provider flows and should carry contact context; they are not created from catalog screenshots.
- Audit results compare current DB rows, seed data, docs, and approved references for missing, extra, duplicate, conversion-hint, source, and encoding problems.
- Campaign creation queries only enabled approved niches and reads display-ready normalized names.
- Old campaigns remain safe through existing `nicheNameSnapshot` and `conversionHintSnapshot`; implementation must not backfill them on catalog edits.

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Contracts forbid Full-time/job terminology and keep all APIs under `freelance`.
- **Evidence-Backed Discovery**: PASS. Source evidence and audit status become first-class catalog fields, while real lead evidence remains owned by scraper/provider flows.
- **Structured Records**: PASS. Data model supports approved items, niche candidates, aliases, source evidence, audit results, and separation from scraped business leads.
- **Human-Reviewed Outreach**: PASS. No outreach send path is touched.
- **Compatible Architecture**: PASS. The app remains `apps/web`; schema changes are additive and campaign snapshots are preserved.

## Complexity Tracking

No constitution violations are planned.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
