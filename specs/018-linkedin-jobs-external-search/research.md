# Research: Full-time LinkedIn Jobs External Search

## Decision: Extension owns LinkedIn Jobs browser navigation and inspection

**Rationale**: The operator is already logged into LinkedIn in the browser and the extension is the accepted local-first UI for authenticated LinkedIn workflows. Moving LinkedIn authentication or a reusable logged-in session into the worker would be harder, riskier, and contrary to the clarified product direction. The extension can open tabs, observe renderable results, scroll, click/inspect cards, and report deterministic outcomes to the backend.

**Alternatives considered**:

- Worker-owned LinkedIn capture: rejected because it would require backend/worker authentication to LinkedIn and increase operational/compliance risk.
- Manual operator export: rejected for MVP because it loses most of the value of page-by-page deterministic collection.

## Decision: Validate direct Jobs URL/geoId, but require fallback user-like navigation

**Rationale**: Direct LinkedIn Jobs URLs with query/date/sort parameters may be fast and stable enough for classic search, but geography/profile defaults and assisted jobs behavior are account-dependent. The implementation should first test whether direct URL navigation and any required geography parameters produce expected Brazil/profile-driven results. If not, the extension should navigate through LinkedIn home/feed or the Jobs entry point with normal clicks.

**Alternatives considered**:

- Hardcode `geoId`: rejected because the spec explicitly avoids unverified geography guarantees.
- Always click through Jobs: acceptable fallback, but direct URL should be tested because it may be simpler and more deterministic for classic search.

## Decision: Reuse the curated career-page source allowlist

**Rationale**: The source allowlist is the quality gate for the MVP and already represents accepted external application sources. Sharing the list prevents divergent behavior between career-page search and LinkedIn Jobs external search, keeps source checkboxes understandable, and avoids a separate denylist.

**Alternatives considered**:

- LinkedIn Jobs-specific allowlist: rejected because it would duplicate source governance.
- Denylist for unsupported sources such as micro1: rejected because unknown sources should naturally fail allowlist matching.

## Decision: Persist as a distinct LinkedIn Jobs external search run

**Rationale**: Existing run/candidate/opportunity concepts are useful, but LinkedIn Jobs differs from LinkedIn post capture and worker-owned career-page search. A distinct search kind/source kind lets API and UI expose separate diagnostics, active-run guards, source selections, page counters, navigation method, and terminal reasons without overloading post history semantics.

**Alternatives considered**:

- Treat as normal LinkedIn post run: rejected because post AI filters and raw post counters should not apply.
- Treat as career-page run: rejected because career-page provider work is worker-owned and not browser-session dependent.

## Decision: Decode and canonicalize external apply URLs before acceptance and dedupe

**Rationale**: LinkedIn may wrap external apply URLs in safety redirects. Dedupe and source allowlist checks must operate on the official decoded application URL whenever possible. Canonicalization should remove tracking noise while preserving enough path/query identity to avoid collapsing different ATS jobs.

**Alternatives considered**:

- Persist raw LinkedIn redirect URL: rejected because it weakens source allowlist checks and creates duplicate risk.
- Over-aggressive canonicalization by domain only: rejected because multiple jobs can share the same ATS domain or company board.

## Decision: No AI quality filter and no accepted-opportunity cap

**Rationale**: The feature's quality gate is deterministic: Easy Apply exclusion, selected curated source allowlist, canonical URL dedupe, and manual operator review in `External applications`. Applying AI quality filters before save would make diagnostics less predictable and conflict with the spec. The run should continue until page limit or no next page, even if many jobs are unsupported.

**Alternatives considered**:

- Reuse post AI filters: rejected because LinkedIn Jobs external search is meant to be deterministic.
- Stop after N accepts: rejected because the spec requires no accepted-opportunity cap.

## Decision: Keep backend APIs short and owner-scoped

**Rationale**: Extension capture can be long-running in the browser, but backend requests should remain short: create run, append/submit inspected outcomes, persist accepted opportunity, update progress, finalize. This fits the API/worker boundary and preserves owner isolation.

**Alternatives considered**:

- One long HTTP request for full capture: rejected because it would mix long-running browser work with API request lifecycle.
- Local-only extension storage until final submit: rejected because progress diagnostics and duplicate guards are more useful when backend state is updated throughout the run.

## Implementation note: reusable source keys

The shared curated source registry currently exposes these reusable keys for career-page search and LinkedIn Jobs external matching: `inhire`, `ashby`, `lever`, `greenhouse`, `smartrecruiters`, `trampos`, and `catho`. `teamtailor` is known but inactive by default until explicitly accepted. URL matching is domain/subdomain based and returns no match for inactive or unselected sources.
