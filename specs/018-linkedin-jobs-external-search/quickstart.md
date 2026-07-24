# Quickstart: Full-time LinkedIn Jobs External Search

## Prerequisites

- API, PostgreSQL, and worker available through the existing local setup.
- Extension built/loaded in Chrome with a valid authenticated API session.
- Operator logged into LinkedIn in the same Chrome profile.
- At least one curated external source selected in the Search page.

## Focused Automated Validation

### API

```powershell
cd apps/api
python -m pytest tests/contract/test_job_search_runs_contract.py tests/contract/test_career_page_search_contract.py tests/integration/test_external_application_jobs.py tests/integration/test_job_search_runs_api.py
```

Add or update focused tests for:

- LinkedIn Jobs external run creation.
- `max_pages` default 15 and maximum 30.
- selected source validation.
- candidate submit outcomes.
- canonical URL dedupe.
- terminal diagnostics and owner isolation.

### Worker / Shared Utilities

```powershell
cd apps/worker
python -m pytest tests/unit/test_external_job_normalizer.py tests/unit/test_career_page_search_provider.py
```

Add or update focused tests only if shared curated source matching or URL canonicalization utilities move through worker code.

### Extension

```powershell
cd apps/extension
npm.cmd run typecheck
npm.cmd run test -- SearchView SearchHistoryView popupStore linkedin
```

Add or update focused tests for:

- `External jobs` / `LinkedIn posts` tab separation.
- LinkedIn Jobs controls and assisted-mode disabling.
- max pages validation.
- source checkbox reuse.
- redirect decoding and source matching utilities.
- terminal diagnostics rendering.

## Manual Smoke With LinkedIn Real Behavior

1. Start local API and database.
2. Load the extension in Chrome.
3. Log into the extension.
4. Log into LinkedIn in the same Chrome profile.
5. Open Search.
6. Confirm Search has `External jobs` and `LinkedIn posts`.
7. In `External jobs`, select a small set of curated sources such as Ashby, Lever, and Greenhouse.
8. Start LinkedIn Jobs external search with no keywords and max pages set to 1.
9. Confirm the UI explains default/relevant browsing.
10. Confirm run diagnostics show pages visited, jobs inspected, Easy Apply skips, unsupported sources, duplicates, accepted, failures, navigation method, and terminal reason.
11. Repeat with keywords such as `typescript remote backend`, date posted `last week`, sort `most recent`, max pages 1.
12. Verify whether direct LinkedIn Jobs URL navigation and any required geography behavior produce expected results.
13. If direct navigation is unreliable, verify fallback navigation by clicking through LinkedIn Jobs.
14. Confirm accepted opportunities appear in Jobs -> `External applications`.
15. Open one accepted application URL and mark it applied using the existing flow.
16. Repeat the same run and confirm duplicates are counted, not recreated.
17. Switch to `LinkedIn posts` and confirm existing post capture and AI filters still work.
18. Confirm Search History still renders previous LinkedIn post runs.

## Guard Checks

- `apps/web` files and Prisma migrations should not change for this feature.
- No Gmail draft, send request, Email provider, WhatsApp provider, or outreach event is created by LinkedIn Jobs accepted external applications.
- No LinkedIn cookies, OAuth tokens, or raw credentials are stored in diagnostics.

## Expected Outcome

- LinkedIn Jobs external search can save curated external application URLs into the existing lane.
- Operators can understand low/no acceptance runs without DevTools.
- Existing Full-time and Freelance workflows remain intact.

## Implementation Status - 2026-07-23

Completed foundation slice:

- API has owner-scoped LinkedIn Jobs external run create/progress/candidate/finalize/latest endpoints.
- API records accepted candidates as `external_application` opportunities using canonical application URL dedupe and safe source evidence.
- Worker/API source registries share active source keys and inactive Teamtailor awareness.
- Worker URL utilities decode LinkedIn safety redirects, strip tracking parameters, preserve job identity query parameters, and match selected curated sources.
- Extension API types/client and pure capture utilities are available for URL building, redirect decoding, canonicalization, and curated source matching.

Pending before manual LinkedIn smoke:

- Extension background/content-script run orchestration for real LinkedIn Jobs card inspection and pagination.
- Search UI `External jobs` / `LinkedIn posts` tab split and terminal diagnostics rendering.
- Manual direct URL, geoId, and click-path validation.


## Final Implementation Notes - 2026-07-23

Implemented automated slice:

- API lifecycle, owner isolation, no-outreach guard, Search History separation, external application compatibility.
- Worker/source registry and URL canonicalization tests.
- Extension background/content-script runtime for direct LinkedIn Jobs URL capture, deterministic card inspection, candidate submission and terminal finalize.
- Search UI tabs for `External jobs` and `LinkedIn posts`, LinkedIn Jobs settings, assisted-mode note, and diagnostics panel.
- Extension typecheck and Plasmo build pass.

Manual LinkedIn smoke is still required because account-specific LinkedIn DOM/navigation, geo behavior and assisted entry cannot be proven by local unit tests.
