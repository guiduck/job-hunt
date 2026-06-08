# Data Model: Curated Career Page Search

## Overview

This feature extends the existing Full-time job-search model instead of creating a separate external-search subsystem. All records remain owner-scoped by `user_id`.

## Entity: Curated Source

Represents a supported source that the operator can include in career-page search.

Fields:

- `key`: stable source identifier, e.g. `greenhouse`, `ashby`, `lever`, `smartrecruiters`, `trampos`, `catho`, `inhire`
- `display_name`: user-facing name
- `source_category`: `ats`, `career_page`, or `job_site`
- `active`: whether source is available in this release
- `enabled_by_default`: true for all initial active sources
- `search_scope`: query template/domain restriction metadata used by worker provider adapter
- `notes`: operational notes for diagnostics/research

Implementation note: This may be a static config list in API/extension/worker for the first release, as long as contracts expose the same keys and future sources remain inactive until explicitly added.

Validation:

- Source keys must be unique.
- User-selected sources must be a non-empty subset of active source keys.
- Future research-only Brazilian sources must not be selectable.

## Entity: External Search Run

Extends the existing `job_search_runs` concept for provider-based career-page search.

Fields:

- existing `id`, `user_id`, `status`, `requested_keywords`, `search_query`, `candidate_limit`, counters, provider status, timestamps
- `source_name`: set to a stable value such as `Curated Career Search` or `SerpApi Career Search`
- `search_kind`: `linkedin` or `career_page`
- `selected_sources`: array of curated source keys
- `accepted_opportunity_limit`: requested maximum accepted opportunities
- `inspected_candidate_cap`: configured cost-based cap for inspected candidates
- `stop_reason`: `accepted_limit_reached`, `candidate_cap_reached`, `no_more_results`, `provider_failed`, `cancelled`, or `unknown`
- `source_diagnostics`: per-source counts and provider errors
- `latest_search_label`: derived timestamp/relative time for extension display

Relationships:

- Has many `External Job Candidate` records through existing `job_search_candidates`.
- May create many `Job Opportunity` records.

State transitions:

- `pending` -> `running` -> `completed`
- `pending` -> `running` -> `completed_no_results`
- `pending` -> `running` -> `failed`
- stale/running timeout handling should follow existing worker patterns.

Validation:

- Only one owner-scoped career-page run may be active for duplicate-start prevention in the UI/API.
- A run must have at least one selected active source.
- Every button click creates a new run; provider cache must not replace the run.

## Entity: External Job Candidate

Extends existing `job_search_candidates` for normalized career-page results before/while they become opportunities.

Fields:

- existing `id`, `user_id`, `run_id`, `opportunity_id`, `outcome`, title/company/description/source fields, AI fields, dedupe fields, timestamps
- `search_kind`: `career_page`
- `curated_source_key`: source key selected by the operator
- `provider_name`: configured search provider
- `provider_result_id`: provider-specific identifier when available
- `apply_url`: official job or application URL
- `result_url`: result/detail URL returned by provider
- `contact_email`: sanitized usable email when found
- `application_kind`: `email` or `external_application`
- `raw_result_context`: JSON payload or safe excerpt needed for diagnostics
- `stale_signal`: optional boolean/reason for stale or closed jobs
- `source_rank`: provider result position

Outcomes:

- `accepted`
- `duplicate`
- `rejected_no_contact` for no email and no usable apply URL
- `rejected_weak_match`
- `rejected_missing_evidence`
- `rejected_ai_filter`
- `failed_provider`
- `failed_parse`
- existing compatible outcomes where applicable

Validation:

- Accepted `external_application` candidates must have a usable `apply_url`.
- Accepted `email` candidates must have a sanitized usable email.
- Candidates with both email and apply URL use `application_kind=email` and preserve `apply_url`.
- Dedupe key should prefer normalized company + role + apply/source URL; include source URL when company/title are missing.

## Entity: Job Opportunity

Existing `opportunities` and `job_opportunity_details` store accepted results.

Relevant existing fields:

- `opportunities.user_id`
- `opportunities.opportunity_type = job`
- `opportunities.title`
- `opportunities.organization_name`
- `opportunities.source_name`
- `opportunities.source_url`
- `opportunities.source_query`
- `opportunities.source_evidence`
- `opportunities.captured_at`
- `job_opportunity_details.company_name`
- `job_opportunity_details.role_title`
- `job_opportunity_details.job_description`
- `job_opportunity_details.contact_channel_type`
- `job_opportunity_details.contact_channel_value`
- `job_opportunity_details.contact_email`
- `job_opportunity_details.application_url`
- `job_opportunity_details.collection_source_type`
- `job_opportunity_details.dedupe_key`
- `job_opportunity_details.job_stage`
- review/AI scoring fields

New/derived semantics:

- `application_kind=email` when `contact_email` is usable.
- `application_kind=external_application` when no email exists and `application_url` is usable.
- `With email` list includes all jobs with usable email, including career-page jobs.
- `External applications` list includes no-email jobs with usable application URLs.
- Manual external application sets `job_stage=applied`.

Validation:

- Email-bearing career-page jobs remain eligible for bulk email preview/generation/send.
- Manual external apply must not create Gmail send requests or outreach events.
- Apply URL should be visible in detail for both email and external jobs when available.

## Entity: Application Status

Uses existing `job_stage` enum.

Relevant values:

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

Rules:

- External no-email jobs start as `new` or current default.
- Marking applied uses `job_stage=applied`.
- Email sends already set `job_stage=applied` through the existing Gmail send path.
- Dashboard external-unapplied count excludes `job_stage=applied`.

## Entity: Dashboard Metrics

Extends existing opportunity metrics response.

Fields:

- existing total/unsent/sent/interview-compatible fields
- `email_job_count`: jobs with usable email
- `email_unsent_count`: email jobs without successful job application email
- `external_application_count`: no-email jobs with usable application URL
- `external_unapplied_count`: external application jobs where `job_stage != applied`

Rules:

- Metrics must be owner-scoped.
- Metrics must aggregate by Full-time mode and not depend on current Jobs pagination filters.
- Deleting or marking external jobs as applied updates counts.

## Entity: Opportunity Lifecycle Policy

Planning constraint for cleanup/retention.

Fields/concepts:

- `captured_at`: source of age calculation
- `lifecycle_age_days`: approximately 30 days for fresh operational jobs
- `history_bearing`: true when sent, applied, has outreach events, response/interview status, or important notes

Rules:

- This plan records the 1-month lifecycle target.
- Full cleanup/archive behavior may be implemented in a dedicated retention feature.
- Do not delete sent/applied/history-bearing records without explicit workflow rules.

