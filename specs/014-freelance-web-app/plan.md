# Implementation Plan: Freelance Web App

**Branch**: `014-freelance-web-app` | **Date**: 2026-06-06 | **Spec**: `specs/014-freelance-web-app/spec.md`
**Input**: Feature specification from `/specs/014-freelance-web-app/spec.md`

**Note**: The official `.specify/scripts/bash/setup-plan.sh --json` could not run in this Windows environment because `bash` invokes WSL and no WSL distribution is installed. The plan setup was resolved manually from `.specify/feature.json`, matching prior local Spec Kit runs documented in `docs/handoff.md`.

## Continuity Context

**Roadmap Phase**: Fase 4. Prospeccao Freelance  
**Action Plan Step**: 7. App web freelance  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Plan `specs/014-freelance-web-app/spec.md` after clarification. Preserve the clarified MVP: a full thin vertical slice with campaign creation, one prospecting job path, lightweight website analysis, lead list/detail, Lovable prompt generation, commercial message generation, minimal settings/templates, BR and international campaign modes, no CSV export, and only latest generated prompt/message persistence per lead.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Create a new internal `Freelance` web app in `apps/web` for prospecting local businesses. The app owns the Freelance operator experience: Dashboard, Campaigns, Leads, Lead Detail, Templates, and Settings. It uses a Prisma-backed PostgreSQL schema for Freelance campaigns, niche catalog, prospecting jobs, leads, source evidence, website analysis, templates, seller settings, and latest generated prompt/message text.

The first release is a full thin vertical slice. The operator creates a campaign from the seeded niche catalog, starts one realistic local search job, reviews saved leads with source and website evidence, saves notes/status/demo URL, generates a Lovable prompt on demand, generates commercial messages from templates and lead context, and copies/opens messages for human action. Long-running discovery and website analysis run in a separate `apps/web` worker process, not in Next.js request handlers. Existing `apps/api`, `apps/worker`, and `apps/extension` remain dedicated to the current Full-time flow.

## Technical Context

**Language/Version**: TypeScript with React 19-compatible patterns; Node.js runtime for Next.js and the Freelance worker; SQL migrations through Prisma  
**Primary Dependencies**: Next.js App Router, React, shadcn/ui, Zod, Zustand, Prisma, PostgreSQL, provider adapter for Apify Google Maps Scraper or SerpApi Google Maps, lightweight HTML fetch/parsing utilities, existing project Docker Compose  
**Storage**: PostgreSQL shared local service, with Prisma-managed tables for the Freelance web app; no CSV import/export storage  
**Testing**: TypeScript typecheck, Next.js build, Vitest or project-selected TS test runner for unit tests, Prisma migration/seed validation, Playwright or browser verification for critical UI flows if available during implementation  
**Target Platform**: Local Docker Compose for development; future VPS deployment for `apps/web` and its worker; existing Render API/worker deployment remains separate for Full-time  
**Project Type**: Multi-app product: existing FastAPI backend and Plasmo extension for Full-time, plus new Next.js internal web app and separate Freelance worker process  
**Performance Goals**: Campaign create/update interactions complete in under 2 seconds locally; lead table remains usable with 500 leads; starting a prospecting job returns immediately after job creation; worker progress is visible within 5 seconds of polling; lead detail opens in under 2 seconds for stored analysis data  
**Constraints**: No scraping, provider calls, website analysis, or AI generation inside long-running request paths; provider/API keys remain server/worker-only; no Playwright primary Maps dependency; no automatic WhatsApp/email sending; no CSV export by default; no job/curriculum language in Freelance screens; schema must preserve source evidence and owner scope  
**Scale/Scope**: Single internal operator MVP with owner-scoped data model; both BR and international campaign modes; one local-search provider path in MVP with provider abstraction for future alternatives; latest generated prompt/message only, no artifact version history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The plan creates a separate Freelance web app and keeps Full-time extension/API flows untouched.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Discovery is campaign-based by niche/market/location, with source query, provider/source URL or identifier, source evidence, provider diagnostics, and classification reasons.
- **III. Structured Opportunity Records**: PASS. Campaigns, leads, source evidence, website analysis, templates, seller settings, and latest generated text are modeled as structured data.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. The MVP generates/copies/opens messages only; no automatic WhatsApp/email sending or provider-backed send workflow is added.
- **V. Compatible Architecture and Operator Workflow**: PASS. Long-running discovery and website analysis run outside request handlers in a dedicated Freelance worker process; the UI remains a CRM-like operator workflow.

No constitution violations are introduced. The main architectural tradeoff is adding Prisma/Next.js alongside the existing FastAPI stack because the project has already decided the Freelance product should be a separate internal web app using that stack.

## Project Structure

### Documentation (this feature)

```text
specs/014-freelance-web-app/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- openapi.yaml
|   |-- web-ui.md
|   `-- provider-payloads.md
`-- tasks.md                  # Generated later by /speckit-tasks
```

### Source Code (repository root)

```text
apps/
|-- api/                       # Existing Full-time/auth/API service, unchanged unless shared auth is explicitly planned later
|-- worker/                    # Existing Full-time worker, unchanged for this feature
|-- extension/                 # Existing Plasmo Full-time UI, unchanged for this feature
`-- web/                       # New internal Freelance app
    |-- app/
    |   |-- (freelance)/
    |   |   |-- dashboard/
    |   |   |-- campaigns/
    |   |   |-- leads/
    |   |   |-- leads/[leadId]/
    |   |   |-- templates/
    |   |   `-- settings/
    |   `-- api/freelance/
    |       |-- campaigns/
    |       |-- jobs/
    |       |-- leads/
    |       |-- templates/
    |       |-- settings/
    |       `-- generation/
    |-- components/
    |   |-- layout/
    |   |-- campaigns/
    |   |-- leads/
    |   |-- templates/
    |   `-- settings/
    |-- lib/
    |   |-- prisma.ts
    |   |-- validation/
    |   |-- freelance/
    |   |-- providers/
    |   `-- generation/
    |-- worker/
    |   |-- index.ts
    |   |-- jobs/
    |   `-- website-analysis/
    |-- prisma/
    |   |-- schema.prisma
    |   |-- migrations/
    |   `-- seed.ts
    |-- tests/
    |   |-- unit/
    |   |-- integration/
    |   `-- contract/
    |-- package.json
    |-- tsconfig.json
    `-- next.config.ts

docker-compose.yml             # Add web and web-worker services when implementing
```

**Structure Decision**: Add `apps/web` as a separate Next.js/Prisma app. Keep existing Full-time services in place. The web app can use internal route handlers/server actions for UI operations and a separate worker command for provider discovery and website analysis. This avoids mixing long-running work into request handlers and avoids forcing the existing FastAPI worker to own a new Prisma-managed product.

## Phase 0: Research

See `research.md`.

Key decisions:

- Use `apps/web` with Next.js App Router, shadcn/ui, Zod, Zustand, Prisma, and PostgreSQL.
- Use a dedicated `apps/web` worker process for prospecting jobs and lightweight website analysis.
- Implement `freelance_maps_provider` as an adapter with Apify or SerpApi as the first real provider, plus a mock/manual provider for local tests.
- Seed `freelance_niches` from `NICHE_OPTIONS` and preserve conversion hints as editable estimates.
- Run lightweight website analysis in MVP; defer deep browser/responsive/design audits.
- Persist only the latest generated Lovable prompt and commercial message per lead.
- Exclude CSV export from the MVP.

## Phase 1: Design & Contracts

See:

- `data-model.md`
- `contracts/openapi.yaml`
- `contracts/web-ui.md`
- `contracts/provider-payloads.md`
- `quickstart.md`

Design highlights:

- Campaign creation uses saved `FreelanceNiche` rows and supports BR and international market fields.
- Prospecting jobs are durable records polled by the web worker; API/route handlers only create jobs, update operator decisions, and return state.
- Leads are stored as Freelance-only business prospects with source evidence, website status, score breakdown, status, temperature, notes, demo URL, and latest generated text.
- Website analysis snapshots store lightweight fetch/content/contact/SEO evidence for review without requiring a live re-fetch on every detail page load.
- Prompt/message generation uses persisted lead data, templates, and seller settings, saves only the latest generated text, and never sends outreach automatically.

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Contracts and UI explicitly scope all new screens to Freelance; `Full-time` remains outside this feature.
- **Evidence-Backed Discovery**: PASS. Provider contracts require source query, source URL/identifier, evidence, diagnostics, and website classification reasons.
- **Structured Records**: PASS. Data model supports CRM review, prompt generation, analytics, and future outreach without storing only raw contacts.
- **Human-Reviewed Outreach**: PASS. Contracts expose generate/copy/open behavior only; automatic sends are not planned.
- **Compatible Architecture**: PASS. Discovery and analysis are worker-owned; the Next.js app handles UI and short-lived commands.

## Complexity Tracking

No constitution violations are planned.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
