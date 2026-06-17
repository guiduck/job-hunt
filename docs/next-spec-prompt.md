## Command
speckit.analyze

## Objective
Review `specs/015-freelance-niche-catalog` for final cross-artifact consistency after implementation.

## Context
- `015-freelance-niche-catalog` is implemented through T087.
- The feature now includes catalog audit, approved-niche governance, candidate review, deterministic
  candidate bootstrap, audit candidate counts, campaign-safe selection, source evidence checks, and
  docs closeout.
- `Igrejas` is an operator-approved BR baseline niche with source evidence.
- Campaign creation now has locality autocomplete: BR uses IBGE state/city endpoints plus ViaCEP CEP
  lookup; international currently targets US states/cities through a Census attempt with local city
  fallback.
- Real-provider prospecting now respects campaign `maxResults`, shows/polls latest job status in the
  campaign card, and requires the `apps/web` worker process for SerpApi/Apify jobs.
- Campaign prospecting now starts through flat `POST /api/freelance/prospecting-jobs` with
  `campaignId` in the JSON body, avoiding dev-server nested route 404/HTML failures. The campaign grid
  and card controls have been widened so `View leads` stays on one line and job diagnostics fill the
  card width.
- Prospecting feedback no longer tells the operator to start the worker while a job is merely queued;
  SerpApi Google Maps pagination attempts to honor `maxResults` beyond the first provider page, and
  repeated prospecting runs dedupe against already saved campaign leads.
- Lead filters tolerate empty select query params, so `websiteStatus=no_site` works even when
  `commercialStatus`, `temperature`, or `minScore` are present as empty strings.
- The Freelance web app now shares Google primary auth with the extension through the FastAPI auth
  API. Local Docker needs `postgres` + `api` for OAuth/session plus `freelance-postgres` + `web` for the
  app; the web stores the API token in an HTTP-only cookie and falls back to `local-operator` when
  unauthenticated. In VPS/prod config, the Freelance web final redirect is allowed through
  `FREELANCE_GOOGLE_AUTH_SUCCESS_REDIRECT_URL` so `GOOGLE_AUTH_SUCCESS_REDIRECT_URL` can remain scoped
  to the existing API/extension fallback.
- Lead detail now separates owned websites from social/profile URLs, no longer generates or displays
  mock website audit scores, and always exposes a Google Maps verification link for manual source
  checking.
- Reference/image-derived `niche_candidates` are catalog suggestions only. Real business leads,
  opportunities, contacts, email actions, WhatsApp actions, and outreach targets still come only from
  scraper/API/provider flows such as Google Maps/SerpApi/Apify after a niche is approved.
- Validation completed: focused US3 tests, full `apps/web` test suite, typecheck, build, local
  bootstrap, smoke HTTP for `/settings/niches`, `/api/freelance/niche-audit`, and
  `/api/freelance/niche-candidates`, plus guard searches for CSV, Full-time wording, and candidate
  paths touching lead/job/outreach.
- Full-time LinkedIn capture hotfix on 2026-06-11: the extension now attempts two upward recovery
  scrolls plus one downward scroll when LinkedIn stalls at the end of the visible result list before
  counting a no-progress timeout. The recovery scrolls do not consume `maxScrolls`; they are exposed as
  `diagnostics.scrolls[].recoveryScrolls`. A real long LinkedIn smoke with about 250 target posts is
  still recommended.
- Full-time Jobs UI hotfix on 2026-06-11: the extension now keeps a short-lived local hot state for
  Jobs pages by lane/filters/page, so reopening the popup after an external link or switching between
  `With email` and `External applications` does not immediately blank/reload the list. External
  applications now keep `send_status`, and the API treats external `sent` as applied/responded/interview
  `job_stage` rather than Gmail send history.
- Full-time LinkedIn Search UI hotfix on 2026-06-17: the extension now has a `Past month` checkbox
  that opens LinkedIn content search with `datePosted="past-month"` plus the existing recent sort,
  without changing the backend run contract.

## Analysis Goals
- Check `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, contracts, and docs for contradictions.
- Confirm tasks T001-T087 align with implemented behavior and documented validation.
- Confirm candidate-vs-real-lead language is consistent everywhere.
- Confirm the next implementation scope should be a separate provider-real discovery spec, not more
  catalog governance.

## Expected Output
- Non-destructive findings ordered by severity.
- Any documentation/task inconsistencies that should be patched before starting the next feature.
