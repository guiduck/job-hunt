# Data Model: Full-time LinkedIn Jobs External Search

## Overview

The feature reuses existing Full-time job search and opportunity records. New data should be additive and owner-scoped. The implementation may use new nullable columns, JSON diagnostic payloads, or small companion structures following existing project patterns, but the behavioral model below must be represented.

## Entity: LinkedIn Jobs External Search Run

Represents one operator-started LinkedIn Jobs external search from the extension.

### Fields

- `id`: Existing run identifier.
- `user_id`: Owner of the run.
- `search_kind`: Distinguishes `linkedin_jobs_external` from existing `linkedin` post capture and `career_page` search.
- `status`: `pending`, `running`, `completed`, `completed_no_results`, `failed`, `cancelled`, or existing compatible terminal statuses.
- `search_text`: Operator input used for the run, nullable for default browse.
- `search_mode`: `default_browse`, `classic_keywords`, or `assisted`.
- `query_terms`: Terms used for classic OR-style search.
- `date_posted`: `any_time`, `past_month`, `past_week`, or `past_24_hours` for classic mode.
- `sort`: `relevant` or `most_recent` for classic mode.
- `selected_source_keys`: Curated external source keys enabled for this run.
- `max_pages`: Integer, default 15, maximum 30.
- `navigation_method`: `direct_url`, `direct_url_with_geo`, `jobs_click_path`, `assisted_entry`, or `unknown`.
- `terminal_reason`: Why the run stopped, such as `max_pages_reached`, `no_next_page`, `no_renderable_results`, `linkedin_login_required`, `navigation_failed`, or `cancelled`.
- `diagnostics`: Safe counters and messages for operator/debug UI.
- `created_at`, `updated_at`, `started_at`, `completed_at`: Existing or additive lifecycle timestamps.

### Validation Rules

- `user_id` is required and must match the authenticated extension/API session.
- `max_pages` defaults to 15 and must be between 1 and 30.
- `date_posted` and `sort` apply only to classic mode unless a reliable assisted path is proven.
- `selected_source_keys` must be a subset of known curated sources.
- Diagnostics must not contain cookies, OAuth tokens, LinkedIn session secrets, or raw credentials.

### State Transitions

```text
pending -> running -> completed
pending -> running -> completed_no_results
pending -> running -> failed
pending -> cancelled
running -> cancelled
```

Existing stale/timeout recovery can be reused if compatible, but browser capture timeouts should be reported as safe terminal reasons rather than leaving active runs blocked.

## Entity: LinkedIn Jobs Inspected Candidate

Represents one LinkedIn Jobs card/result inspected by the extension.

### Fields

- `id`: Candidate identifier.
- `run_id`: Parent LinkedIn Jobs external search run.
- `user_id`: Owner, matching the run.
- `linkedin_job_url`: URL of the LinkedIn job detail when available.
- `job_title`: Captured visible job title when available.
- `company_name`: Captured visible company name when available.
- `location_text`: Captured location text when available.
- `apply_button_kind`: `external`, `easy_apply`, `missing`, or `unknown`.
- `raw_apply_href`: Raw apply href discovered from LinkedIn, if any.
- `decoded_apply_url`: Decoded official external application URL, if any.
- `canonical_apply_url`: Canonical URL used for source matching and dedupe.
- `source_key`: Matched curated source key, if accepted or source-recognized.
- `outcome`: `accepted`, `skipped_easy_apply`, `unsupported_source`, `duplicate`, `failed_decode`, `missing_external_apply`, or `inspection_failed`.
- `skip_reason`: Safe reason for non-accepted outcomes.
- `page_number`: Page where the card was inspected.
- `position_on_page`: Optional card position for diagnostics.
- `created_at`: Inspection timestamp.

### Validation Rules

- Accepted candidates require `decoded_apply_url`, `canonical_apply_url`, and a recognized `source_key`.
- Easy Apply jobs must never become accepted candidates.
- Unsupported sources are recorded as outcomes only; they do not create a separate denylist.
- Duplicate candidates must reference the canonical URL or existing opportunity key used to detect duplication when possible.

## Entity: Curated External Job Source

Shared source registry used by career-page search and LinkedIn Jobs external search.

### Fields

- `key`: Stable source key, such as `inhire`, `ashby`, `lever`, `greenhouse`, `smartrecruiters`, `trampos`, `catho`, or `teamtailor` if accepted.
- `label`: Operator-facing source name.
- `url_patterns`: Domains/path patterns used to match official application URLs.
- `enabled_by_default`: Whether the source is selected by default in the External jobs tab.
- `source_family`: Optional grouping for ATS/career source behavior.

### Validation Rules

- LinkedIn Jobs external search and career-page search must use the same registry.
- Unknown domains are unsupported and not persisted as accepted opportunities.
- Teamtailor may be added only as a curated source with explicit patterns and tests.

## Entity: External Application Opportunity

Existing Full-time job opportunity saved for manual application through an official URL.

### Required Data From This Feature

- `opportunity_type`: `job`.
- `job_application_kind`: `external_application`.
- `application_url`: Decoded/canonical official external apply URL.
- `source_name`: LinkedIn Jobs / matched curated source.
- `source_url`: LinkedIn job URL when available, otherwise safe LinkedIn Jobs search/result URL.
- `source_query`: Search text/mode used by the run.
- `source_evidence`: Includes discovery source, selected source key, decoded apply URL, LinkedIn job URL, and run id.
- `job_stage`: Existing default for newly saved external applications.

### Dedupe Rules

- Primary dedupe key is canonical external apply URL.
- Existing opportunity identity rules still apply to avoid duplicates when canonical URL is missing or ambiguous.
- Dedupe must be owner-scoped.

## Diagnostics Counters

Each run should expose at least:

- `pages_visited`
- `jobs_inspected`
- `external_links_found`
- `accepted`
- `skipped_easy_apply`
- `unsupported_source`
- `duplicates`
- `failures`
- `terminal_reason`
- `navigation_method`

Counters must be derived from candidate outcomes or stored consistently with candidate outcomes.
