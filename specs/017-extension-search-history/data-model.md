# Data Model: Extension Search History

## Search History Entry

Backed by `job_search_runs` rows where `search_kind = "linkedin"` and `user_id` matches the authenticated user.

### Fields

- `id`: existing run id.
- `user_id`: existing owner scope; never exposed across users.
- `search_kind`: must be `linkedin` for this feature.
- `status`: existing lifecycle status.
- `requested_keywords`: existing keyword/token snapshot captured at run creation.
- `search_query`: existing full query text.
- `search_sort_order`: existing sort option, currently `recent` or `relevant`.
- `raw_linkedin_result_count`: new nullable integer. Count of LinkedIn posts/results the extension discovered/captured before dedupe, rejection, AI filtering, or opportunity creation.
- `raw_linkedin_result_count_source`: optional string if implementation needs provenance, default `extension_capture`.
- `inspected_count`: existing worker/candidate inspection count.
- `accepted_count`: existing accepted opportunities count.
- `rejected_count`: existing rejected/failed outcome count.
- `duplicate_count`: existing duplicate outcome count.
- AI counters: existing `ai_filter_*` and analysis counters.
- `provider_status`, `provider_error_code`, `provider_error_message`, `error_message`, `stop_reason`: safe diagnostics.
- `started_at`, `completed_at`, `created_at`, `updated_at`: existing timestamps.

### Validation Rules

- `raw_linkedin_result_count` is nullable and must be `>= 0` when present.
- Existing runs without the new value remain `null`.
- API must not derive this value from `accepted_count`, `rejected_count`, `duplicate_count`, AI counters, or saved opportunity counts.
- Worker counter reconciliation must not reset a non-null raw count to zero.
- History queries must filter by `user_id` and `search_kind = linkedin`.

## Search Aggregate

Derived read model returned by the API; no new table required for the first release.

### Fields

- `kind`: `query` or `keyword`.
- `value`: exact normalized full query for query aggregates, normalized token for keyword aggregates.
- `run_count`: number of matching LinkedIn runs in the aggregate scope.
- `raw_known_run_count`: runs with non-null raw count.
- `raw_unknown_run_count`: runs with null raw count.
- `total_raw_linkedin_results`: sum of known raw counts; null only when `raw_known_run_count = 0`.
- `average_raw_linkedin_results`: average across known raw-count runs only; null when no known values exist.
- `accepted_count`: sum of accepted outcomes.
- `duplicate_count`: sum of duplicate outcomes.
- `rejected_count`: sum of rejected outcomes.
- `ai_filter_passed_count`: sum of AI passed outcomes.
- `ai_filter_rejected_count`: sum of AI rejected outcomes.
- `latest_run_at`: latest `created_at` or `started_at` among matching runs, used as duplicate-diagnostic context rather than the default ranking scope.

### Query Aggregate Rules

- Group by exact normalized `search_query` when present; fall back to joined `requested_keywords` only when `search_query` is empty.
- Query aggregates are LinkedIn-only and owner-scoped.
- Query aggregates are date-independent by default, matching the keyword ranking behavior unless a future spec adds explicit date filters.
- Do not mix career-page/ATS runs into this aggregate.

### Keyword Aggregate Rules

- Keyword aggregates are the primary ranking shown below the 20 recent-run list.
- Keyword aggregates are date-independent by default across the authenticated user's LinkedIn Search history.
- Tokens come from the run's `requested_keywords` snapshot plus normalized terms from `search_query` only if needed to preserve the actual searched text.
- Deduplicate normalized tokens within a single run before adding that run to token aggregates.
- Count the run's raw result count once per token in that run.
- Sort the default keyword ranking by total known raw LinkedIn results descending, with duplicate and latest-run values shown as diagnostic context.

## Extension UI State

No durable local storage is required beyond existing popup state. The History tab can cache the last loaded respons