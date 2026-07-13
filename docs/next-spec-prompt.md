## Command
speckit.specify

## Feature
Full-time Search History Drilldown

## Context
`017-extension-search-history` now ships a compact Full-time extension `history` tab with the 20 most recent LinkedIn Search runs, nullable raw LinkedIn result counts, and date-independent query/keyword rankings. The next useful slice should deepen evidence inspection without expanding into Freelance or career-page search.

## Objective
Specify a follow-up Full-time extension feature that lets the operator drill into one History run from the `history` tab and inspect the useful evidence already available in the system: run status, safe diagnostics, AI-filter counters/reasons, accepted opportunities, duplicate/rejected candidates, and links/actions that help decide whether a query/keyword is worth repeating.

## Requirements
1. Keep scope limited to `apps/extension`, `apps/api`, and existing Full-time job-search data.
2. Do not change `apps/web` Freelance schema, leads, outreach, Email, WhatsApp, provider settings, or Prisma migrations.
3. Do not introduce automated cleanup, deletion, or destructive retention behavior.
4. Reuse existing candidates/opportunities/run endpoints where possible; add only additive API fields if needed.
5. Keep diagnostics safe: no secrets, OAuth tokens, raw provider credentials, or oversized metadata blobs in the extension UI.
6. Preserve the current History behavior: 20 recent LinkedIn runs plus date-independent keyword/query rankings.
7. Missing historical raw counts remain unknown, never zero.

## Acceptance Focus
- From a History row, the operator can open an evidence/detail view for that run.
- The detail view separates accepted, duplicate, rejected, failed-provider, and AI-filter-rejected outcomes.
- The detail view surfaces enough source/query/status context to decide whether to retry, refine, or retire that search query.
- The feature remains compact enough for the Plasmo popup and does not become a marketing/landing page.