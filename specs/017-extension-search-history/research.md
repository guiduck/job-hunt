# Research: Extension Search History

## Decision: Store Raw LinkedIn Results As Nullable Run Data

Persist a nullable `raw_linkedin_result_count` on `job_search_runs` for `search_kind = linkedin`.

**Rationale**: The existing run table already stores query, requested keywords, sort order, status, timestamps, accepted/rejected/duplicate counts, AI counters, provider diagnostics, owner scope, and kind. Adding a nullable raw count keeps history tied to the canonical run record and avoids introducing a parallel analytics table for the first release.

**Alternatives considered**:

- Compute raw results from `inspected_count`: rejected because `inspected_count` may represent processed candidates after caps and is semantically tied to worker inspection, not what the extension discovered before downstream processing.
- Use `accepted + rejected + duplicate`: rejected because the spec forbids subtractive/derived math and old worker paths can classify candidates differently.
- Store only in extension local state: rejected because history must be owner-scoped, durable, and available across sessions/devices against the API.

## Decision: Treat Historical Missing Counts As Unknown

Old runs should keep `raw_linkedin_result_count = null`; API responses and UI labels must render unknown/unavailable and exclude those rows from raw total/average calculations unless explicitly counted as `unknown_raw_count_runs`.

**Rationale**: Backfilling zero would make historical searches look unproductive and violate the product requirement. Backfilling from duplicate/rejected/accepted counters would encode the exact bias the feature exists to avoid.

**Alternatives considered**:

- Backfill with `inspected_count`: rejected because it can differ from the raw LinkedIn/capture count and may be capped.
- Backfill with zero: rejected because unknown is not zero.

## Decision: Add Dedicated History/Aggregate Read Contract

Expose a focused owner-scoped endpoint for LinkedIn history and aggregates rather than expanding the existing generic `GET /job-search-runs` response with all aggregate concerns.

**Rationale**: The current list endpoint is useful for recent runs and diagnostics, but aggregate rows by exact query and keyword token need distinct response shapes, null-aware average handling, and filters/sort options. A dedicated endpoint avoids overloading existing consumers and keeps career-page runs out of the first release by default.

**Alternatives considered**:

- Extension computes all aggregates client-side from `GET /job-search-runs?limit=100`: acceptable as a fallback, but less reliable for larger history, sorting, and null-aware totals.
- Add many query params to existing list endpoint: rejected because aggregates and run list have different contracts.

## Decision: Token Aggregates Deduplicate Tokens Within A Run

For keyword/token aggregates, count each normalized token once per run, even if the query repeats it.

**Rationale**: The spec says repeated tokens within one query should not multiply the run's raw count. This keeps token aggregates useful for comparing search terms without inflating accidental repeated words.

**Alternatives considered**:

- Count every token occurrence: rejected because repeated words in one query would inflate totals.
- Aggregate only saved keyword badges: rejected because the actual run query is the source of truth and saved badges can change later.

## Decision: Keep Extension UI Compact And Operational

Add a first-class `history` tab to the existing popup nav and render dense tables/rows for recent runs, query aggregates, and keyword aggregates.

**Rationale**: This is an operational extension, not a marketing page. The operator needs scan-friendly comparison inside a small popup with links to existing run/candidates/opportunities diagnostics.

**Alternatives considered**:

- Add history below the Search form: rejected because it would make Search crowded and less task-focused.
- Build a web dashboard: rejected because the feature is explicitly extension-only.

## Decision: Safe Diagnostics Only

History detail should reuse sanitized run fields (`status`, `provider_status`, error codes/messages already exposed by API) and existing run/candidate/opportunity links. It must not expose OAuth tokens, provider credentials, raw secret env values, or full internal stack traces.

**Rationale**: Current architecture keeps secrets backend-side. The extension should only display safe operational diagnostics.

**Alternatives considered**:

- Store provider raw payloads in run metadata for history: rejected for first release because it expands privacy/security surface and is unnecessary for comparing query productivity.


## Decision: Limit Recent Runs To 20 And Keep Keyword Ranking Date-Independent

Show only the 20 most recent LinkedIn Search runs in the primary history list, then show the best-keyword ranking below it across the authenticated user's available LinkedIn Search history without a default date cutoff.

**Rationale**: The operator does not need a long chronological list in the extension popup. The recent list is for operational context and duplicate diagnosis, while the keyword ranking is the real productivity comparison. Dates remain visible to explain possible duplicate-heavy runs, but they should not limit or drive the default keyword ranking.

**Alternatives considered**:

- Last 100 runs: rejected as too heavy for the popup and unnecessary for daily use.
- Date-scoped ranking: rejected because the user wants keyword quality independent of date; date is only diagnostic context.
- All runs in the main list: rejected because it would crowd the extension UI without improving the ranking task.
