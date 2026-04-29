# Data Model: LinkedIn Job Bot Foundation

## Overview

This feature extends the local opportunity foundation with backend-triggered `job_search_runs`,
candidate outcome tracking, and richer `job` opportunity details for automated LinkedIn discovery.
Accepted opportunities are stored in the shared opportunity model with `opportunity_type=job`.

## Enums

### `job_search_run_status`

- `pending`
- `running`
- `completed`
- `completed_no_results`
- `failed`

### `job_candidate_outcome`

- `accepted`
- `rejected_no_contact`
- `rejected_weak_match`
- `rejected_missing_evidence`
- `duplicate`
- `failed_parse`

### `contact_channel_type`

- `email`
- `linkedin`
- `other_public_contact`

### `keyword_source`

- `manual`
- `mock`
- `cv`

### `job_stage`

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

## Entities

### `job_search_runs`

Represents one backend-triggered automated LinkedIn job-search execution.

Fields:

- `id`
- `status`
- `keyword_set_id`
- `requested_keywords`
- `source_name`
- `candidate_limit`
- `inspected_count`
- `accepted_count`
- `rejected_count`
- `duplicate_count`
- `cap_reached`
- `started_at`
- `completed_at`
- `error_message`
- `created_at`
- `updated_at`

Validation:

- `candidate_limit` defaults to 50 and must not exceed 50 for this feature.
- `requested_keywords` must contain at least one keyword after fallback resolution.
- `status` starts as `pending`, transitions to `running`, then to a terminal status.
- `error_message` is required when `status=failed`.

Relationships:

- belongs to optional `keyword_set`
- has many `job_search_candidates`
- has many accepted `opportunities` through `job_search_candidates.opportunity_id`

### `job_search_candidates`

Represents each inspected LinkedIn candidate and its normalization outcome.

Fields:

- `id`
- `run_id`
- `opportunity_id`
- `outcome`
- `company_name`
- `role_title`
- `post_headline`
- `job_description`
- `contact_channel_type`
- `contact_channel_value`
- `source_url`
- `source_query`
- `source_evidence`
- `matched_keywords`
- `dedupe_key`
- `rejection_reason`
- `inspected_at`
- `created_at`

Validation:

- `run_id` is required.
- `outcome` is required.
- Accepted candidates require `opportunity_id`, `company_name` or `post_headline`, `contact_channel_value`, `source_query`, `source_evidence`, and at least one matched keyword.
- `dedupe_key` is generated from normalized company, title/headline, matched keywords, and contact channel.
- Rejected candidates require `rejection_reason`.

Relationships:

- belongs to `job_search_run`
- may create or reference one accepted `opportunity`

### `opportunities`

Shared root record from the foundation, used here only with `opportunity_type=job`.

Additional usage in this feature:

- `title` stores the best available job title or post headline.
- `organization_name` stores the company name when available.
- `source_name` stores `LinkedIn`.
- `source_url`, `source_query`, and `source_evidence` are required for accepted automated captures.
- `operator_notes` remains manually editable after capture.

Validation:

- Accepted automated captures must have `opportunity_type=job`.
- Accepted automated captures must have a linked `job_opportunity_detail`.
- Accepted automated captures must not be created when public contact channel is missing.

Relationships:

- has one `job_opportunity_detail`
- has many `opportunity_keyword_matches`
- may be linked from one or more duplicate `job_search_candidates`

### `job_opportunity_details`

Lane-specific details for accepted LinkedIn job opportunities.

Fields:

- `id`
- `opportunity_id`
- `company_name`
- `role_title`
- `post_headline`
- `job_description`
- `contact_channel_type`
- `contact_channel_value`
- `contact_email`
- `application_url`
- `linkedin_url`
- `matched_keywords`
- `dedupe_key`
- `job_stage`
- `response_notes`
- `interview_at`
- `created_at`
- `updated_at`

Validation:

- Must reference an opportunity with `opportunity_type=job`.
- `contact_channel_value` is required for accepted automated captures.
- `contact_email` is populated when `contact_channel_type=email`.
- `job_stage` defaults to `new`.
- `dedupe_key` must match the accepted candidate dedupe key.

### `keyword_sets`

Stores configured or fallback search terms.

Additional usage in this feature:

- If no active manual `job` keyword set exists, use the mock set containing `reactjs`, `typescript`, `nextjs`, and `nodejs`.
- Later CV-derived keyword sets may be added without changing the run contract.

### `opportunity_keyword_matches`

Records the terms that justified acceptance.

Fields:

- `id`
- `opportunity_id`
- `keyword_set_id`
- `matched_term`
- `match_context`
- `created_at`

Validation:

- Automated accepted opportunities require at least one keyword match.
- `match_context` should quote or summarize where the term appeared.

## State Transitions

### `job_search_run_status`

`pending` -> `running` -> `completed`

`pending` -> `running` -> `completed_no_results`

`pending` -> `running` -> `failed`

Terminal states do not transition back to active states.

### Candidate outcome

Each candidate receives exactly one terminal outcome after inspection. Duplicate candidates should
reference the existing opportunity when possible instead of creating a new accepted opportunity.

### Job stage

`new` -> `saved` -> `applied` -> `responded` -> `interview`

Any stage may transition to `rejected` or `ignored`.

## Deduplication

`dedupe_key` is generated from normalized:

- company name
- role title or post headline
- sorted matched keyword set
- contact channel value

If the same dedupe key appears in later runs, the candidate is marked `duplicate` and linked to the
existing opportunity when available.

## Validation Rules

- A run inspects no more than 50 candidates.
- Accepted opportunities require public email or public contact channel.
- Accepted opportunities require source query and source evidence.
- Accepted opportunities expose job description when available, but missing job description does not block acceptance if evidence and contact are present.
- Search failures, rate limits, unavailable content, and parse failures must be visible through run or candidate state.

## Compatibility Notes

- Existing foundation entities remain the base; this feature adds job-run metadata and richer job detail fields.
- `contact_channel_value` generalizes email while preserving `contact_email` for email-specific workflows.
- No outreach event, resume attachment, UI dashboard, or AI scoring entity is introduced in this feature.
