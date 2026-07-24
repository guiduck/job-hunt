# Spec Backlog

Este arquivo guarda prompts Spec Kit importantes que foram despriorizados temporariamente, mas nao
devem ser perdidos quando `docs/next-spec-prompt.md` muda para o proximo recorte ativo.

## Full-time Search History Drilldown

Status: backlog preservado em 2026-07-23. Este era o prompt anterior de `docs/next-spec-prompt.md`
antes de `Full-time LinkedIn Jobs External Search` virar a proxima spec priorizada.

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

## Freelance app guardrail
Recent app-web hotfix: lead detail has AI-backed Lovable prompt/commercial message generation and sends from the existing `Commercial message` card through a simple `Send message` modal. Email is disabled when the lead has no email, and WhatsApp phone numbers are normalized before Twilio delivery. Keep the next Full-time Search History Drilldown spec isolated from this Freelance flow and do not alter `apps/web` outreach behavior unless explicitly requested.

## Field Assistant modal textarea hotfix
Recent extension hotfix: Field Assistant detection/fill now handles visible textareas inside external-site modals and React/Vue-controlled inputs more reliably. Preserve this behavior when specifying or implementing the next Full-time Search History Drilldown work.

## Freelance Discovery Backlog Note
Do not mix this into the active Full-time History Drilldown spec. Future separate spec candidate: Instagram/local-presence lead discovery for `apps/web` Freelance. Goal: find public Instagram business profiles by niche/location, extract public contact/link-in-bio/site signals, verify Google/Maps presence by business name + city through a provider, and score leads for website + Google Business Profile/geolocation services. Must include provider/ToS/rate-limit safeguards, no private-account scraping, dedupe by business identity, and human review before outreach.

## Freelance Offer Pricing Note
Recent web hotfix: seller settings now model landing-page pricing as variable scope context. Preserve defaults R$2500 / US$1000 / 15 days / BR 6x without treating them as fixed commitments; generated outreach should say `a partir de` or `starting at` and mention that database, lead capture, admin editing, integrations, and WhatsApp automation increase price/scope.
