# Data Model: LinkedIn Runs End-to-End Execution

## Overview

This feature completes the operational persistence flow for LinkedIn Job Search runs. It builds on
the provider metadata introduced in `003-linkedin-search-provider`, keeps accepted opportunities in
the shared `opportunities` model with `opportunity_type=job`, and adds the missing persistence needed
for the worker to consume API-created runs after the request has completed.

## Enums

### `job_search_run_status`

Existing values remain:

- `pending`
- `running`
- `completed`
- `completed_no_results`
- `failed`

Usage in this feature:

- `pending`: run created by API and waiting for worker processing.
- `running`: worker has claimed the run and started processing.
- `completed`: worker created at least one accepted opportunity.
- `completed_no_results`: worker inspected sources but accepted no opportunities.
- `failed`: unrecoverable run failure or stale running run found after worker restart.

### `job_candidate_outcome`

Existing values remain:

- `accepted`
- `rejected_no_contact`
- `rejected_weak_match`
- `rejected_missing_evidence`
- `duplicate`
- `failed_parse`
- `failed_provider`
- `blocked_source`
- `inaccessible_source`
- `empty_source`

Each inspected candidate receives exactly one terminal outcome.

### `provider_status`

Existing values remain:

- `not_started`
- `collected`
- `partial`
- `blocked`
- `inaccessible`
- `empty`
- `failed`

Aggregate run usage:

- `not_started`: pending run has not been claimed.
- `collected`: collection produced at least one accepted opportunity or successful candidate inspection.
- `partial`: collection had a mix of successful and failed/blocked sources.
- `blocked`, `inaccessible`, `empty`: all inspected sources share that non-successful provider state.
- `failed`: worker or provider failed before a coherent candidate set could be inspected, including stale running recovery.

### `contact_channel_type`

Existing values remain:

- `email`
- `linkedin`
- `other_public_contact`

Acceptance rules remain:

- `email` is preferred whenever a public email is present.
- `linkedin` is valid only when the publication explicitly invites contact through LinkedIn message,
  DM, inbox, or equivalent wording and a poster profile URL is available.
- `other_public_contact` is preserved for compatibility but is not auto-accepted by this feature.

### `linkedin_collection_source_type`

Existing values remain:

- `automatic_publication_search`
- `provided_url`
- `provided_public_content`

## Entities

### `job_search_runs`

Represents one operator-created LinkedIn Job Search execution request.

Relevant existing fields:

- `id`
- `status`
- `keyword_set_id`
- `requested_keywords`
- `hiring_intent_terms`
- `collection_source_types`
- `provided_source_count`
- `source_name`
- `candidate_limit`
- `inspected_count`
- `accepted_count`
- `rejected_count`
- `duplicate_count`
- `cap_reached`
- `provider_status`
- `provider_error_code`
- `provider_error_message`
- `started_at`
- `completed_at`
- `error_message`
- `created_at`
- `updated_at`

Additional requirement:

- A stale running run must be identifiable by status and age or startup policy, then marked `failed`
  with `provider_status=failed`, `provider_error_code=stale_running`, and an operator-readable
  message.

Validation:

- `candidate_limit` must not exceed 50.
- `requested_keywords` must contain configured keywords or fallback job keywords.
- `hiring_intent_terms` must contain at least one term when automatic publication search is enabled.
- Terminal runs must have `completed_at`.
- `inspected_count`, `accepted_count`, `rejected_count`, and `duplicate_count` must reconcile with
  persisted candidate outcomes.

Relationships:

- has many `job_search_candidates`
- has many `linkedin_collection_inputs` if provided URLs/content are persisted in a separate table
- accepted candidates may reference `opportunities`

### `linkedin_collection_inputs`

Represents source inputs supplied at run creation so the asynchronous worker can process them later.

Fields:

- `id`
- `run_id`
- `source_type`
- `source_url`
- `provided_text`
- `label`
- `created_at`

Validation:

- `run_id` is required.
- `source_type` is either `provided_url` or `provided_public_content`.
- `source_url` is required when `source_type=provided_url`.
- `provided_text` is required when `source_type=provided_public_content`.
- Inputs are only source material; they do not bypass parser, normalizer, evidence, contact, dedupe, or cap rules.

Relationships:

- belongs to one `job_search_run`
- may produce zero or more inspected candidates

Compatibility note:

- If implementation chooses persisted JSON on `job_search_runs` instead of a table, the same logical
  fields and validation rules still apply and contracts/quickstart must describe the visible behavior.

### `job_search_candidates`

Represents one inspected LinkedIn publication, provided URL, or provided public content item.

Relevant existing fields:

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
- `collection_source_type`
- `hiring_intent_term`
- `provider_name`
- `provider_status`
- `provider_error_code`
- `poster_profile_url`
- `contact_priority`
- `source_url`
- `source_query`
- `source_evidence`
- `matched_keywords`
- `raw_excerpt`
- `dedupe_key`
- `rejection_reason`
- `inspected_at`
- `created_at`

Validation:

- `run_id`, `outcome`, `source_query`, and `matched_keywords` are required.
- Accepted candidates require `opportunity_id`, `contact_channel_value`, `source_evidence`, and at least one matched keyword.
- Provider failure outcomes require `provider_status` and either `provider_error_code` or `rejection_reason`.
- Duplicate candidates should reference the existing `opportunity_id` when available.
- Candidate rows must not be created beyond the run's 50-candidate cap.

Relationships:

- belongs to one `job_search_run`
- may reference one accepted `opportunity`

### `opportunities`

Shared opportunity root, used here only with `opportunity_type=job`.

Relevant fields:

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

- Accepted opportunities from this feature must have `opportunity_type=job`.
- Accepted opportunities must have linked job detail, source evidence, matched keyword evidence, and contact channel.
- Provider failures, inaccessible sources, empty sources, weak matches, missing evidence, missing contact, and stale runs must not create opportunities.

### `job_opportunity_details`

Lane-specific detail for accepted job opportunities.

Relevant fields:

- `company_name`
- `role_title`
- `post_headline`
- `job_description`
- `contact_channel_type`
- `contact_channel_value`
- `contact_email`
- `application_url`
- `linkedin_url`
- `poster_profile_url`
- `contact_priority`
- `hiring_intent_term`
- `collection_source_type`
- `matched_keywords`
- `dedupe_key`
- `job_stage`

Validation:

- Public email is preferred when both email and LinkedIn DM are present.
- LinkedIn contact requires `poster_profile_url` and evidence text showing an explicit contact invitation.
- `dedupe_key` uses normalized company, role/headline, sorted matched keywords, and preferred contact channel value.

## State Transitions

### Run status

`pending` -> `running` -> `completed`

`pending` -> `running` -> `completed_no_results`

`pending` -> `running` -> `failed`

`running` -> `failed` for stale running recovery after worker restart.

No automatic retry transition is part of v1.

### Candidate outcome

Each inspected candidate receives one terminal outcome:

- accepted candidates create or link to a `job` opportunity
- duplicate candidates link to an existing opportunity where possible
- rejected candidates increment rejected counts and store `rejection_reason`
- provider failure candidates store provider status/error detail and never create opportunities

### Provider status aggregation

Run provider status is derived from candidate/provider outcomes:

- any accepted or successful inspected candidate plus failures -> `partial`
- successful inspected candidates without failures -> `collected`
- all blocked/inaccessible/empty candidates -> matching provider status
- unrecoverable worker failure or stale running recovery -> `failed`

## Deduplication

The existing dedupe key remains based on normalized:

- company name
- role title or post headline
- sorted matched keyword set
- preferred contact channel value

Public email is the preferred contact channel value when present.

## Validation Rules

- The worker may inspect no more than 50 candidates for a run.
- Every inspected candidate must be persisted before final run completion.
- `accepted_count`, `rejected_count`, and `duplicate_count` must match persisted candidate outcomes.
- Accepted opportunities require public email or explicit LinkedIn contact invitation with poster profile URL.
- LinkedIn contact invitation detection must cover common English and Portuguese wording and must not
  accept a loose profile link without invitation text.
- Stale running runs become failed/stale and do not create new candidates or opportunities during recovery.
- User-provided URL/content inputs follow the same provider, parser, normalizer, evidence, contact, dedupe, and cap rules as automatic collection.

## Compatibility Notes

- Existing API routes remain the public contract and are extended rather than replaced.
- Existing provider, parser, normalizer, dedupe, and opportunity creation rules remain authoritative.
- Schema changes should be additive. If current implementation already has all required fields, no new migration is required except for persisted collection inputs or stale-run metadata gaps.
- No outreach events, resume attachments, UI dashboard, AI scoring, freelance prospecting, or queue/broker model is introduced.
