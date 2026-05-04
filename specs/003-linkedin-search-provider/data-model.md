# Data Model: LinkedIn Search Provider

## Overview

This feature extends the `002-linkedin-job-bot` foundation with real collection source metadata for
LinkedIn publication search. Accepted opportunities still use the shared `opportunities` root with
`opportunity_type=job`; inspected candidates retain provider, query, contact, evidence, and outcome
details.

## Enums

### `job_search_run_status`

Existing values remain:

- `pending`
- `running`
- `completed`
- `completed_no_results`
- `failed`

### `job_candidate_outcome`

Existing values remain:

- `accepted`
- `rejected_no_contact`
- `rejected_weak_match`
- `rejected_missing_evidence`
- `duplicate`
- `failed_parse`

Additional values:

- `failed_provider`
- `blocked_source`
- `inaccessible_source`
- `empty_source`

### `contact_channel_type`

Existing values remain:

- `email`
- `linkedin`
- `other_public_contact`

Usage in this feature:

- `email` is preferred whenever a public email is present.
- `linkedin` is valid only when the publication explicitly invites LinkedIn DM and a poster profile link is available.
- `other_public_contact` is preserved for compatibility but not auto-accepted by this feature.

### `linkedin_collection_source_type`

- `automatic_publication_search`
- `provided_url`
- `provided_public_content`

### `provider_status`

- `not_started`
- `collected`
- `partial`
- `blocked`
- `inaccessible`
- `empty`
- `failed`

## Entities

### `job_search_runs`

Represents one operator-started LinkedIn job collection run.

Existing fields from `002-linkedin-job-bot` remain.

Additional fields:

- `hiring_intent_terms`: array of terms used for publication search, initially `hiring`, `contratando`, `contratamos`
- `collection_source_types`: array of source types enabled for the run
- `provided_source_count`: count of supplied URLs or pasted content items
- `provider_status`: aggregate provider status for the run
- `provider_error_code`: optional machine-readable provider failure code
- `provider_error_message`: optional operator-readable provider failure message

Validation:

- `candidate_limit` must not exceed 50.
- `requested_keywords` must contain at least one configured or fallback keyword.
- `hiring_intent_terms` must contain at least one term for automatic publication search.
- A run may complete with zero accepted opportunities, but it must expose whether the reason was no results, blocked source, inaccessible source, empty source, or all candidates rejected.

Relationships:

- has many `job_search_candidates`
- may reference a `keyword_set`
- accepted candidates may reference `opportunities`

### `job_search_candidates`

Represents one inspected LinkedIn publication, provided URL, or provided public content item.

Existing fields from `002-linkedin-job-bot` remain.

Additional fields:

- `collection_source_type`
- `hiring_intent_term`
- `provider_name`
- `provider_status`
- `provider_error_code`
- `poster_profile_url`
- `contact_priority`
- `raw_excerpt`

Validation:

- `run_id`, `outcome`, `source_query`, `matched_keywords`, and `collection_source_type` are required.
- Accepted candidates require `contact_channel_value`, `source_evidence`, and at least one matched keyword.
- `contact_channel_type=email` requires a valid public email in `contact_channel_value`.
- `contact_channel_type=linkedin` requires `poster_profile_url` and evidence that the post invites LinkedIn DM.
- `contact_priority` is `primary` for public email and `secondary` for LinkedIn DM when no email is found.
- Failed, blocked, inaccessible, and empty candidates require a provider status or rejection reason.

Relationships:

- belongs to one `job_search_run`
- may create or reference one accepted `opportunity`

### `opportunities`

Shared opportunity root, used here only with `opportunity_type=job`.

Additional usage:

- `source_name` remains `LinkedIn`.
- `source_url` stores the LinkedIn publication URL, listing URL, or provided source URL when available.
- `source_query` stores the hiring-intent term plus job keyword query or the provided source label.
- `source_evidence` stores the text that justified capture, including contact evidence.

Validation:

- Accepted opportunities from this feature must be `opportunity_type=job`.
- Accepted opportunities must have at least one linked `job_opportunity_detail`.
- Accepted opportunities must not be created for provider failures, inaccessible content, empty content, weak matches, or missing contact.

### `job_opportunity_details`

Lane-specific details for accepted job opportunities.

Existing fields remain.

Additional fields:

- `poster_profile_url`
- `contact_priority`
- `hiring_intent_term`
- `collection_source_type`

Validation:

- Public email is preferred when both email and LinkedIn DM contact are available.
- LinkedIn DM contact requires a poster profile link and evidence text showing that DM contact was invited.
- `dedupe_key` uses normalized company, role/headline, matched keywords, and preferred contact channel value.

### `keyword_sets`

Stores configured or fallback search terms.

Additional usage:

- Configured user keywords drive automatic publication search.
- If no active keyword set exists, fallback terms remain `reactjs`, `typescript`, `nextjs`, and `nodejs`.
- Hiring-intent terms are not stored as user skill keywords; they are run/provider query terms.

### `linkedin_collection_inputs`

Optional supporting entity for user-provided URLs or pasted public content.

Fields:

- `id`
- `run_id`
- `source_type`
- `source_url`
- `provided_text`
- `label`
- `created_at`

Validation:

- `source_type` is either `provided_url` or `provided_public_content`.
- `source_url` is required when `source_type=provided_url`.
- `provided_text` is required when `source_type=provided_public_content`.
- Inputs are only used to produce inspected candidates; they do not automatically create accepted opportunities.

## State Transitions

### Run status

`pending` -> `running` -> `completed`

`pending` -> `running` -> `completed_no_results`

`pending` -> `running` -> `failed`

Provider failures may result in `completed_no_results` when handled as visible empty/blocked outcomes, or
`failed` when the run cannot inspect any source due to an unrecoverable provider error.

### Provider status

`not_started` -> `collected`

`not_started` -> `partial`

`not_started` -> `blocked`

`not_started` -> `inaccessible`

`not_started` -> `empty`

`not_started` -> `failed`

### Candidate outcome

Each inspected candidate receives exactly one terminal outcome. Duplicate candidates reference the
existing opportunity when possible and do not create new accepted opportunities.

## Deduplication

The existing dedupe key remains based on normalized:

- company name
- role title or post headline
- sorted matched keyword set
- preferred contact channel value

For candidates with both public email and LinkedIn DM contact, public email is the preferred contact
channel value for deduplication.

## Validation Rules

- A run inspects no more than 50 candidates.
- Automatic publication search must combine one hiring-intent term with at least one configured or fallback keyword.
- Accepted opportunities require either public email or explicit LinkedIn DM evidence with poster profile URL.
- Public email is preferred over LinkedIn DM when both exist.
- Accepted opportunities require source query, matched keyword evidence, contact evidence, and capture time.
- Blocked, inaccessible, empty, malformed, parse-failed, and provider-failed sources must not create accepted opportunities.
- User-provided URL/content candidates follow the same normalization, contact, evidence, and dedupe rules as automatically collected candidates.

## Compatibility Notes

- Existing `002` API routes remain the base and are extended rather than replaced.
- Existing parser/normalizer functions are preserved but extended for LinkedIn DM profile contact and provider failure outcomes.
- Existing opportunity review fields remain unchanged for operator notes and `job_stage`.
- No outreach events, resume attachments, UI dashboard, AI scoring, or freelance prospecting data model is introduced.
