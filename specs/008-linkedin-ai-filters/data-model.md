# Data Model: LinkedIn AI Filters

## Overview

This feature extends the existing LinkedIn job-search run and candidate records with optional AI filter configuration, candidate-level filter decisions, structured signals, and run counters. It does not introduce a new opportunity type, replace review intelligence, or change existing outreach records.

## Enums

### `ai_filter_status`

New values:

- `passed`: AI filters were enabled and valid structured evaluation allowed the candidate to continue.
- `rejected`: AI filters were enabled and valid structured evaluation rejected the candidate before opportunity creation.
- `fallback`: AI filters were disabled, unavailable, invalid, rate-limited, or below confidence threshold, so deterministic/local rules were used.
- `failed`: AI filters were enabled, evaluation failed, and deterministic/local fallback could not produce a usable decision.
- `skipped`: AI filtering was intentionally skipped for duplicates, provider failures, blocked/inaccessible/empty sources, or candidates already rejected by earlier deterministic rules.

### `detected_work_mode`

New normalized signal values:

- `remote`
- `hybrid`
- `onsite`
- `presential`
- `unknown`
- `mixed`

### Existing enums

Existing values remain for:

- `job_search_run_status`: `pending`, `running`, `completed`, `completed_no_results`, `failed`
- `job_candidate_outcome`: `accepted`, `rejected_no_contact`, `rejected_weak_match`, `rejected_missing_evidence`, `duplicate`, `failed_parse`, `failed_provider`, `blocked_source`, `inaccessible_source`, `empty_source`
- `candidate_analysis_status`: `deterministic_only`, `ai_assisted`, `fallback`, `failed`, `skipped`
- `provider_status`: `not_started`, `collected`, `partial`, `blocked`, `inaccessible`, `empty`, `failed`
- `opportunity_type`: `job`, `freelance`

## Entities

### `job_search_runs`

Represents one operator-created LinkedIn job-search execution request.

Existing fields remain.

New search/filter fields:

- `search_query`: text query used to open LinkedIn search. It may be derived from existing requested keywords/source query during migration.
- `search_sort_order`: `recent` or `relevant`, default `recent`.
- `ai_filters_enabled`: whether post-capture AI filters were explicitly enabled for this run, default `false`.
- `ai_filter_settings`: structured object containing the optional filter settings used for this run:
  - `remote_only`: boolean.
  - `exclude_onsite`: boolean.
  - `accepted_regions`: list of strings.
  - `excluded_regions`: list of strings.
  - `excluded_keywords`: list of strings.

New AI filter summary fields:

- `ai_filter_status`: aggregate run status derived from candidate decisions.
- `ai_filter_error_code`: optional compact run-level error code.
- `ai_filter_error_message`: optional operator-readable summary.
- `ai_filter_inspected_count`: number of candidates considered by the AI filter stage.
- `ai_filter_passed_count`: number of candidates that passed AI filters.
- `ai_filter_rejected_count`: number of candidates rejected by AI filters.
- `ai_filter_fallback_count`: number of candidates that used deterministic/local fallback for filter decision.
- `ai_filter_failed_count`: number of candidates whose filter evaluation failed without usable fallback.
- `ai_filter_skipped_count`: number of candidates skipped by AI filtering because an earlier rule/provider/duplicate outcome already determined their path.

Validation:

- `ai_filters_enabled` defaults to `false` for new runs.
- When `ai_filters_enabled=false`, `ai_filter_settings` should be empty or defaults only, and candidates should use `ai_filter_status=fallback` or `skipped` as appropriate.
- Run counts must reconcile with persisted candidates.
- Existing runs without these fields must serialize using default values.
- User ownership on runs remains mandatory.

Relationships:

- Has many `job_search_candidates`.
- May have many `linkedin_collection_inputs`.
- Accepted candidates may reference `opportunities`.

### `job_search_candidates`

Represents one inspected LinkedIn publication, provided URL, or captured browser-search post.

Existing fields remain, including captured evidence and review-analysis fields.

New AI filter fields:

- `passes_ai_filter`: nullable boolean. `true` when filter decision allowed the candidate, `false` when rejected, null when not applicable.
- `ai_filter_status`: candidate-level status using `ai_filter_status`.
- `ai_filter_reason`: human-readable reason shown in diagnostics.
- `ai_filter_confidence`: nullable numeric confidence from 0.0 to 1.0.
- `ai_filter_signals`: structured object with normalized signals:
  - `detected_work_mode`
  - `accepted_regions`
  - `accepted_countries`
  - `accepted_timezones`
  - `rejected_regions`
  - `matched_exclusion_keywords`
  - `evidence_quotes`
- `ai_filter_error_code`: optional compact failure/fallback code.
- `ai_filter_error_message`: optional operator-readable failure/fallback detail.
- `ai_filter_model_name`: optional model/provider label when AI was used.
- `ai_filter_prompt_version`: optional version label for the AI filter prompt/schema.

Validation:

- Confidence must be between 0.0 and 1.0 when present.
- Confidence below 0.70 must result in `ai_filter_status=fallback`, not `passed` or `rejected`.
- Rejected candidates must retain `source_evidence`, `source_url`, `source_query`, title/headline, description when available, and AI filter reason/signals.
- Candidates skipped because of duplicate or provider failure should not be counted as AI-rejected.
- Candidates rejected by AI filters must not create a new accepted opportunity.
- Existing candidates without AI filter fields must serialize safely with defaults.

Relationships:

- Belongs to one `job_search_run`.
- May reference one accepted `opportunity` only when accepted after filtering and dedupe.

### `linkedin_collection_inputs`

Represents captured browser posts or provided public content for worker processing.

Existing fields remain.

Validation:

- Browser-captured inputs should preserve broad post text and source URL. AI filter settings belong to the run, not each collection input.
- The extension must not pre-remove posts based on AI filter settings before creating collection inputs.

### `opportunities`

Shared opportunity root, used here with `opportunity_type=job`.

Existing fields remain. This feature does not add AI filter fields to `opportunities` in v1.

Validation:

- Only candidates accepted after AI filter/fallback and dedupe may create opportunities.
- `Freelance` opportunities remain unaffected.
- Existing opportunity list/detail behavior remains compatible.

### `job_opportunity_details`

Lane-specific detail for accepted job opportunities.

Existing review fields remain, including `match_score`, `analysis_status`, and review status.

Validation:

- Review analysis remains separate from AI filter status.
- Accepted opportunities may optionally expose the originating candidate's AI filter summary through linked candidate/run diagnostics, but opportunity records should not duplicate all candidate filter signals in v1.

## State Transitions

### Candidate AI filter status

Typical paths:

- AI filters disabled: `fallback` if deterministic/local rules decide candidate acceptance, or `skipped` for candidates already rejected by earlier rules.
- AI filters enabled and valid confidence >= 0.70: `passed` or `rejected`.
- AI filters enabled and valid confidence < 0.70: `fallback`.
- AI filters enabled but missing config, invalid JSON, rate-limited, timed out, or provider unavailable: `fallback` when deterministic/local rules can decide.
- AI filters enabled and no usable AI or deterministic/local decision exists: `failed`.
- Duplicate/provider-failure/blocked/empty candidates: `skipped`.

### Candidate outcome interaction

- `ai_filter_status=passed` can continue to dedupe and opportunity creation.
- `ai_filter_status=rejected` should produce a non-accepted candidate outcome and no opportunity.
- `ai_filter_status=fallback` can continue when deterministic/local rules accept the candidate.
- `ai_filter_status=skipped` preserves the earlier outcome.
- `ai_filter_status=failed` should be visible in candidate diagnostics and run failed-filter counters.

## Filtering and Diagnostics

Run and candidate list contracts should support:

- Filtering candidates by `ai_filter_status`.
- Returning run counters for inspected, accepted, rejected, duplicate, AI-filter rejected, AI-filter fallback, and AI-filter failed counts.
- Displaying candidate filter reason, confidence, and normalized signals without exposing provider credentials or AI secrets.

## Migration and Compatibility

- Additive fields should be nullable or defaulted.
- Existing runs should default `ai_filters_enabled=false` and safe zero counters.
- Existing candidates should default to `ai_filter_status=skipped` or null-equivalent display behavior when no filter was run.
- Existing API consumers should continue receiving all prior fields.
- New request fields should be optional.
- Indexes are recommended for `job_search_candidates.ai_filter_status`, `job_search_runs.ai_filters_enabled`, and owner-scoped run lookup where query patterns justify them.
