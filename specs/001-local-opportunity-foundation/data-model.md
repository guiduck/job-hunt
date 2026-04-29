# Data Model: Local Opportunity Foundation

## Overview

The first schema uses `opportunities` as the shared root for both `freelance` and `job` lanes.
Lane-specific tables store fields that should not be forced into the other lane.

## Enums

### `opportunity_type`

- `freelance`
- `job`

### `market_scope`

- `domestic`
- `international`

### `opportunity_status`

Shared lightweight review state:

- `new`
- `ignored`

### `freelance_stage`

- `new`
- `contacted`
- `interested`
- `proposal_requested`
- `proposal_sent`
- `won`
- `lost`
- `ignored`

### `job_stage`

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

### `lead_temperature`

- `cold`
- `warm`
- `hot`

### `website_status`

- `confirmed`
- `not_identified`
- `suspected`
- `unknown`

### `keyword_source`

- `manual`
- `mock`
- `cv`

### `campaign_status`

- `draft`
- `collecting`
- `paused`
- `completed`
- `archived`

## Entities

### `campaigns`

Groups a search/prospecting round.

Fields:

- `id`
- `name`
- `opportunity_type`
- `market_scope`
- `target_niche`
- `target_region`
- `target_city`
- `status`
- `notes`
- `created_at`
- `updated_at`

Validation:

- `name` is required.
- `opportunity_type` is required.
- `status` defaults to `draft`.

Relationships:

- has many `opportunities`
- may reference many `keyword_sets` in later features

### `keyword_sets`

Stores configured or fallback search terms for the job lane.

Fields:

- `id`
- `name`
- `source`
- `opportunity_type`
- `terms`
- `is_active`
- `is_default`
- `created_at`
- `updated_at`

Validation:

- `terms` must contain at least one keyword.
- `source=mock` records must be clearly distinguishable from user-provided records.
- Initial mock terms include `reactjs`, `typescript`, `nextjs`, `nodejs`.

Relationships:

- has many `opportunity_keyword_matches`

### `opportunities`

Shared root record for all captured or manually created opportunities.

Fields:

- `id`
- `campaign_id`
- `opportunity_type`
- `market_scope`
- `title`
- `organization_name`
- `category`
- `city`
- `region`
- `country`
- `source_name`
- `source_url`
- `source_query`
- `source_evidence`
- `score`
- `status`
- `operator_notes`
- `captured_at`
- `created_at`
- `updated_at`

Validation:

- `opportunity_type` is required.
- `title` or `organization_name` is required.
- `source_evidence` is required for captured opportunities.
- `score`, when present, must be between 0 and 100.

Relationships:

- belongs to optional `campaign`
- has one `freelance_opportunity_detail` when `opportunity_type=freelance`
- has one `job_opportunity_detail` when `opportunity_type=job`
- has many `interactions`
- has many `opportunity_keyword_matches`

### `freelance_opportunity_details`

Lane-specific client acquisition data.

Fields:

- `id`
- `opportunity_id`
- `business_name`
- `contact_name`
- `phone`
- `email`
- `website_url`
- `website_status`
- `google_maps_url`
- `lead_temperature`
- `freelance_stage`
- `demo_url`
- `created_at`
- `updated_at`

Validation:

- Must reference an opportunity with `opportunity_type=freelance`.
- `freelance_stage` defaults to `new`.
- `website_status` defaults to `unknown`.

### `job_opportunity_details`

Lane-specific full-time job search data.

Fields:

- `id`
- `opportunity_id`
- `company_name`
- `role_title`
- `post_headline`
- `contact_email`
- `application_url`
- `linkedin_url`
- `matched_keywords`
- `job_stage`
- `response_notes`
- `interview_at`
- `created_at`
- `updated_at`

Validation:

- Must reference an opportunity with `opportunity_type=job`.
- `job_stage` defaults to `new`.
- `matched_keywords` may be empty only for manually created records.

### `opportunity_keyword_matches`

Join table recording why a job opportunity matched a keyword set.

Fields:

- `id`
- `opportunity_id`
- `keyword_set_id`
- `matched_term`
- `match_context`
- `created_at`

Validation:

- `matched_term` is required.
- Must reference an opportunity with `opportunity_type=job` for this feature.

### `interactions`

Manual or system-recorded history for an opportunity.

Fields:

- `id`
- `opportunity_id`
- `interaction_type`
- `channel`
- `summary`
- `payload`
- `created_at`

Validation:

- `summary` is required for manual notes.
- `payload` may store structured context for future prompt/message events.

## State Transitions

### Freelance

`new` -> `contacted` -> `interested` -> `proposal_requested` -> `proposal_sent` -> `won`

Any stage may transition to `lost` or `ignored`.

### Job

`new` -> `saved` -> `applied` -> `responded` -> `interview`

Any stage may transition to `rejected` or `ignored`.

## Seed Data

The first local seed should create one active mock `keyword_set`:

- `name`: `Default Mock Job Keywords`
- `source`: `mock`
- `opportunity_type`: `job`
- `terms`: `reactjs`, `typescript`, `nextjs`, `nodejs`
- `is_default`: `true`

## Compatibility Notes

- UI may continue using the word `lead`, but API and schema should prefer `opportunity`.
- Future prompt artifacts, message templates, and outreach events should reference `opportunities`.
- Future worker jobs should write into these tables rather than creating separate scraper-specific storage.
