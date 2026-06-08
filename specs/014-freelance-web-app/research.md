# Research: Freelance Web App

## Decision: Create `apps/web` as the new Freelance product surface

**Rationale**: Project docs explicitly retire the one-extension-for-everything idea and choose a separate internal web app for Freelance. A new `apps/web` keeps the dense operational UI, Prisma schema, and future VPS deployment independent from the Plasmo Full-time extension.

**Alternatives considered**:

- Extend `apps/extension`: rejected because Freelance is now a separate web experience and should not inherit popup/content-script constraints.
- Add Freelance screens to `apps/api`: rejected because FastAPI is not the UI surface and long-running work must stay outside HTTP.
- Build a public SaaS shell immediately: rejected because the app is personal/internal use for this feature.

## Decision: Use Next.js App Router with server-side data loading and small client islands

**Rationale**: Dashboard, Campaigns, Leads, Templates, and Settings benefit from server-rendered initial data and focused interactive components for filters, table selection, modals, job polling, and panel preferences. This follows the React/Next performance guidance: avoid client-wide data waterfalls, keep heavy data fetching server-side, and limit client state to UI state.

**Alternatives considered**:

- All-client SPA: rejected because it would push more data fetching and state management into the browser than needed.
- Separate API-only backend for web: rejected for MVP because Prisma/server actions/route handlers can support the internal app without adding a second API service.

## Decision: Keep long-running prospecting and website analysis in a separate `apps/web` worker

**Rationale**: The constitution requires scraping, enrichment, and outreach work outside HTTP request handlers. Campaign creation and job start should be fast; the worker owns provider calls, normalization, dedupe, website analysis, scoring, and terminal job states.

**Alternatives considered**:

- Run provider calls in route handlers: rejected because Maps scraping and website analysis are slow, retry-prone, and may fail independently.
- Reuse the existing Python worker immediately: rejected for the first plan because the Freelance app is Prisma/Next-owned and should avoid coupling the new product slice to the existing Full-time worker internals.

## Decision: Model Freelance data with Prisma tables scoped to the web app

**Rationale**: The project has explicitly chosen Prisma for the Freelance app. Prisma migrations and seeds can own `FreelanceNiche`, `FreelanceCampaign`, `ProspectingJob`, `FreelanceLead`, `WebsiteAnalysis`, `CommercialTemplate`, `SellerSettings`, and `LatestGeneratedText` while sharing the local PostgreSQL service.

**Alternatives considered**:

- Reuse existing SQLAlchemy `leads` table directly: rejected because the new stack decision requires Prisma and the web app needs a focused model for campaigns, jobs, website snapshots, and latest generated text.
- Store everything in JSON blobs: rejected because filtering by campaign, niche, status, website status, and score must stay queryable.

## Decision: Seed the niche catalog from `NICHE_OPTIONS`

**Rationale**: The spec and docs forbid inventing a new niche list. `NICHE_OPTIONS` in `references/opportunity-desk-pro/src/lib/mockData.ts` is the source of truth for initial names and conversion hints. Seeds should preserve hints as editable estimates, not promises.

**Alternatives considered**:

- Hard-code the list in UI components: rejected because niches must be editable/enabled/disabled without code changes.
- Let the operator free-type the first niche: rejected because campaign creation must select from the seeded catalog first.

## Decision: Use `freelance_maps_provider` with Apify/SerpApi style payloads

**Rationale**: The feature needs realistic Google/Google Maps local search results, including business name, address, phone, website, rating/reviews, place/source identifiers, and source URL. A provider abstraction lets the first implementation choose Apify Google Maps Scraper or SerpApi Google Maps while keeping provider-specific response shapes behind validated adapters.

**Alternatives considered**:

- Google Places as MVP provider: rejected for this product slice because docs note copying/saving Maps data may be more restrictive and may not mirror organic Maps/SERP behavior.
- Playwright as MVP scraper: rejected because DOM/session/captcha/proxy/scroll maintenance is too fragile for the first product dependency.
- Manual import: rejected because the MVP must include one prospecting job path.

## Decision: Lightweight website analysis is required in MVP

**Rationale**: Lead review and prompt/message generation depend on evidence, not just raw business data. The MVP analysis should fetch the homepage, record status/final URL, detect HTTPS, extract title/meta/headings/CTAs/contact signals, classify social/Linktree/broken pages, and produce basic SEO/content/performance evidence.

**Alternatives considered**:

- Deep browser/responsive audit in MVP: rejected because it would expand scope and fragility; it remains a future/manual enhancement.
- Classification-only analysis: rejected because the operator needs evidence and score reasons.
- Pending analysis by default: rejected because the clarified MVP requires website analysis in the vertical slice.

## Decision: Persist only latest generated prompt/message text per lead

**Rationale**: The user clarified that prompts and messages are generated on demand from persisted lead data and templates. Saving the latest generated text preserves continuity between sessions without building version history in the MVP.

**Alternatives considered**:

- Full artifact version history: rejected as unnecessary for MVP.
- No persistence of generated text: rejected because latest generated output is useful when returning to a lead.
- Persist prompts only: rejected because messages also benefit from last-generated continuity.

## Decision: No CSV export in MVP

**Rationale**: The user clarified CSV export is not needed now and likely not later. Removing it keeps lead review focused on the app and avoids import/export contract work.

**Alternatives considered**:

- Filtered export: rejected by user clarification.
- Full export/import: rejected as unnecessary scope.

## Decision: BR and international markets share one campaign flow

**Rationale**: Both markets are in scope for MVP. The app should expose market-specific labels/defaults and allow at least one BR and one international campaign without code changes. Initial smoke can focus on one representative market.

**Alternatives considered**:

- BR-only first: rejected because international niches are already part of the seeded catalog and product direction.
- International-only first: rejected because BR references and examples are first-class.
- Generic single text field: rejected because market scope affects settings, query terms, currency/message defaults, and validation.
