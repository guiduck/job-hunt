# Data Model: Job Review Intelligence

## Overview

This feature adds review-ready intelligence to accepted `job` opportunities and the candidates that produced them. It keeps the existing run, candidate, opportunity, and job detail structure, then extends it with additive fields for scoring, explanation, analysis status, review status, normalized job attributes, missing keywords, and historical outcome signals.

## Enums

### `job_review_status`

New values:

- `unreviewed`: accepted job opportunity has not been inspected by the operator.
- `reviewing`: operator has started reviewing the opportunity.
- `saved`: operator wants to keep the opportunity for later application work.
- `ignored`: operator decided not to pursue the opportunity.

This is separate from `job_stage`, which continues to track application lifecycle.

### `candidate_analysis_status`

New values:

- `deterministic_only`: deterministic parser/normalizer/scorer produced the review profile and AI was not used.
- `ai_assisted`: optional AI analysis returned valid structured output and contributed to review fields.
- `fallback`: AI was attempted but invalid, unavailable, timed out, or incomplete; deterministic analysis produced the review profile.
- `failed`: neither AI nor deterministic analysis produced a complete review profile.
- `skipped`: analysis was intentionally skipped for a provider failure, duplicate, or non-reviewable candidate.

### Existing enums

Existing values remain for:

- `opportunity_type`: `job`, `freelance`
- `job_stage`: `new`, `saved`, `applied`, `responded`, `interview`, `rejected`, `ignored`
- `job_search_run_status`: `pending`, `running`, `completed`, `completed_no_results`, `failed`
- `job_candidate_outcome`: `accepted`, `rejected_no_contact`, `rejected_weak_match`, `rejected_missing_evidence`, `duplicate`, `failed_parse`, `failed_provider`, `blocked_source`, `inaccessible_source`, `empty_source`
- `provider_status`: `not_started`, `collected`, `partial`, `blocked`, `inaccessible`, `empty`, `failed`
- `contact_channel_type`: `email`, `linkedin`, `other_public_contact`

## Entities

### `job_search_runs`

Represents one operator-created LinkedIn Job Search execution request.

Existing fields remain.

New analysis summary fields:

- `analysis_enabled`: whether optional AI analysis was enabled for this run.
- `analysis_status`: aggregate status for candidate analysis, using values such as `deterministic_only`, `ai_assisted`, `fallback`, `failed`, or `skipped`.
- `analysis_error_code`: optional compact error code when analysis had a run-level failure.
- `analysis_error_message`: optional operator-readable analysis failure summary.
- `deterministic_only_count`: number of candidates analyzed without AI.
- `ai_assisted_count`: number of candidates whose valid AI output contributed to review fields.
- `analysis_fallback_count`: number of candidates that fell back to deterministic analysis after AI problems.
- `analysis_failed_count`: number of candidates without complete review analysis.
- `analysis_skipped_count`: number of provider-failure, duplicate, or non-reviewable candidates skipped by analysis.

Validation:

- Counts must reconcile with persisted candidates.
- `analysis_status` should be `deterministic_only` when AI is disabled and candidates were successfully analyzed deterministically.
- `analysis_status` should be `fallback` when at least one AI attempt failed but deterministic analysis completed.
- `analysis_status` should be `ai_assisted` when at least one candidate used valid AI output and no fallback/failed analysis dominates the run.
- Run analysis failure must not change provider status or fabricate opportunities.

Relationships:

- has many `job_search_candidates`
- accepted candidates may reference `opportunities`

### `job_search_candidates`

Represents one inspected LinkedIn publication, provided URL, or provided public content item.

Existing fields remain.

New review and analysis fields:

- `match_score`: nullable integer from 0 to 100.
- `score_explanation`: optional human-readable explanation of score.
- `score_factors`: structured object with positive factors, negative factors, missing keywords, historical adjustment, and evidence references.
- `analysis_status`: required analysis status for the candidate.
- `analysis_confidence`: optional confidence label or numeric confidence from deterministic/AI analysis.
- `analysis_error_code`: optional compact code for invalid AI output, timeout, disabled analyzer, or failed analysis.
- `analysis_error_message`: optional operator-readable summary.
- `ai_model_name`: optional model/provider label if AI was used.
- `ai_prompt_version`: optional version label for the analysis prompt/schema if AI was used.
- `normalized_company_name`: company name selected for review display.
- `normalized_role_title`: role title selected for review display.
- `detected_seniority`: optional seniority extracted from collected text.
- `detected_modality`: optional modality such as remote, hybrid, onsite, or unknown.
- `detected_location`: optional location or market extracted from collected text.
- `missing_keywords`: requested keywords not found or not supported by evidence.
- `historical_similarity_signals`: structured object describing comparable past review/application outcomes used as score adjustment.

Validation:

- `match_score` must be between 0 and 100 when present.
- Accepted candidates should have `match_score`, `score_explanation`, and `analysis_status`.
- Provider failure candidates may use `analysis_status=skipped` and no score.
- AI-assisted candidates require validated structured output before fields are persisted as AI-assisted.
- Fallback candidates require deterministic score/explanation and analysis error visibility.
- Historical signals adjust score only when comparable descriptions or keywords exist.

Relationships:

- belongs to one `job_search_run`
- may reference one accepted `opportunity`

### `opportunities`

Shared opportunity root, used here only with `opportunity_type=job`.

Existing fields remain:

- `id`
- `opportunity_type`
- `title`
- `organization_name`
- `source_name`
- `source_url`
- `source_query`
- `source_evidence`
- `operator_notes`
- `captured_at`
- `created_at`
- `updated_at`

Validation:

- Global `Full-time` lists must filter or infer `opportunity_type=job`.
- `Freelance` opportunities must not receive job review fields or appear in job review result sets.
- Existing opportunities missing review fields must remain readable through defaults.

### `job_opportunity_details`

Lane-specific detail for accepted job opportunities.

Existing fields remain.

New review-ready fields:

- `review_status`: required `job_review_status`, default `unreviewed`.
- `match_score`: integer 0 to 100.
- `score_explanation`: human-readable score explanation.
- `score_factors`: structured object with keyword, evidence, contact, role fit, AI, and historical components.
- `analysis_status`: candidate analysis status that produced the final review profile.
- `analysis_confidence`: optional confidence value.
- `analysis_error_code`: optional compact error code.
- `analysis_error_message`: optional operator-readable summary.
- `normalized_company_name`: company value used by review UI.
- `normalized_role_title`: role value used by review UI.
- `detected_seniority`: optional seniority.
- `detected_modality`: optional modality.
- `detected_location`: optional location.
- `missing_keywords`: requested keywords not supported by the collected evidence.
- `historical_similarity_signals`: structured summary of comparable past outcomes used as score adjustment.

Validation:

- `review_status` defaults to `unreviewed`.
- `match_score` must be between 0 and 100.
- `score_explanation` must reference visible evidence, keyword fit, contact/evidence quality, or fallback status.
- `analysis_status` must be visible on accepted opportunities.
- `review_status` updates must not overwrite source evidence, matched keywords, or analysis output.
- `job_stage` remains separate and defaults to `new`.

Relationships:

- belongs to one `opportunity`

### `opportunity_keyword_matches`

Existing keyword match rows remain unchanged. They continue to support exact matched keyword filtering and score explanation evidence.

### Historical outcome signals

Historical scoring does not require a new table in v1 if comparable outcomes can be derived from existing accepted job details and opportunities.

Inputs:

- review outcomes from `review_status`, especially `saved` and `ignored`
- application outcomes from `job_stage`, especially `responded`, `interview`, `rejected`, and `ignored`
- comparable matched keywords
- comparable normalized role title or description snippets when available

Rules:

- Current opportunity evidence remains the primary score source.
- Historical outcome signals adjust but do not replace the baseline score.
- Absence of history must not reduce confidence by itself; it should be shown as no historical adjustment.
- Score factors must make historical adjustment visible when used.

## State Transitions

### Review status

Initial accepted opportunity state:

`unreviewed`

Allowed operator transitions:

`unreviewed` -> `reviewing`

`unreviewed` -> `saved`

`unreviewed` -> `ignored`

`reviewing` -> `saved`

`reviewing` -> `ignored`

`saved` -> `reviewing`

`ignored` -> `reviewing`

Review status does not imply an application was sent.

### Job stage

Existing `job_stage` transitions remain independent:

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

`job_stage` may later feed historical scoring, but this feature does not automate stage changes.

### Analysis status

Typical candidate paths:

- AI disabled: `deterministic_only`
- AI enabled and valid: `ai_assisted`
- AI enabled but invalid/unavailable: `fallback`
- provider failure or duplicate without new review profile: `skipped`
- analyzer cannot produce valid deterministic review fields: `failed`

## Filtering Rules

`Full-time` opportunity lists must support:

- `opportunity_type=job`
- `min_score`
- `matched_keyword` or keyword text
- `contact_available`
- `contact_channel_type`
- `job_stage`
- `review_status`
- `provider_status`
- `analysis_status`
- `source_query`
- `source_name`
- `run_id` where linked through accepted candidate
- `campaign_id` only where available in future or existing records

Filtering must never mix `Freelance` records into `Full-time` results.

## Migration and Compatibility

- Additive fields should be nullable or defaulted.
- Existing accepted job opportunities should default to `review_status=unreviewed`.
- Existing accepted job opportunities may use deterministic-only review profile defaults or visible incomplete-review reason until backfilled.
- Existing API consumers should continue to receive all prior fields.
- New filters should be optional and must not change default list behavior except by adding new response fields.
- Indexes are recommended for `review_status`, `match_score`, `analysis_status`, and `provider_status` where query patterns justify them.
