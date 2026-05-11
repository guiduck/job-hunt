# Data Model: Full-time Workflow Fixes

## Operator Account

Existing owner identity for all protected data.

**Fields**:

- `id`: stable local user identifier
- `email`: unique normalized account email
- `display_name`: operator display name
- existing password/session fields remain supported

**Relationships**:

- Has zero or more `Google Identity Link` records.
- Owns settings, opportunities, resumes, templates, provider accounts, batches, drafts, and outreach events.

**Validation**:

- Email remains unique.
- Linking a Google identity by verified email must not create duplicate local users.

## Google Identity Link

Association between a verified Google account and a local operator account for primary app authentication.

**Fields**:

- `id`
- `user_id`
- `provider`: `google`
- `provider_subject`: stable Google account subject identifier
- `email`: verified Google email at link time
- `email_verified`: boolean
- `display_name`: optional name from Google profile
- `created_at`
- `updated_at`
- `last_login_at`

**Relationships**:

- Belongs to one `Operator Account`.

**Validation**:

- `(provider, provider_subject)` is unique.
- A verified Google email can link to an existing local account with the same normalized email.
- This entity must not store Gmail send tokens and must not mark Gmail sending as connected.

## Gmail Sending Connection

Existing provider account used for approved Gmail sending.

**Fields**:

- Existing `provider_name`, `display_email`, `display_name`, `auth_status`, `token_json`, and timestamps.

**Relationships**:

- Belongs to one `Operator Account`.

**Validation**:

- Created/updated only by the Gmail send OAuth flow.
- Not created or authorized by Google primary authentication.

## Opportunity Page

Response envelope for owner-scoped Full-time opportunity lists.

**Fields**:

- `items`: list of existing opportunity list items
- `page`: 1-based current page
- `page_size`: default 50
- `total_items`: total matching rows
- `total_pages`: total pages for current criteria
- `has_next`: boolean
- `has_previous`: boolean

**Relationships**:

- Items are existing `Opportunity`/`JobOpportunityDetail` list records owned by the current user.

**Validation**:

- `page_size` defaults to 50 and should not exceed the accepted maximum for popup performance.
- Filters/search/sort are applied before pagination.
- Empty pages caused by shrinking result sets should resolve to a valid page or return clear metadata for correction.

## Job Contact Email

Explicit email value associated with a job opportunity.

**Fields**:

- Existing `contact_email`
- Existing `contact_channel_value`
- Sanitized recipient value used by draft/send flows

**Validation**:

- Captured and manually edited emails are sanitized before storage/use.
- Invalid trailing suffixes such as attached `hashtag` are removed only when a valid email can be recovered.
- Values that remain invalid are rejected or flagged.
- Valid plus tags, hyphenated domains, subdomains, and multi-label domains are preserved.

## Sender Profile

Owner-scoped settings used for generated outreach.

**Fields**:

- Existing `operator_name`
- Existing `operator_email`
- Existing `portfolio_url`
- New `operator_linkedin_url`

**Relationships**:

- Belongs to one `Operator Account`.
- Read by template preview and AI email generation context.

**Validation**:

- `operator_linkedin_url` is optional.
- When present, it must be a supported LinkedIn profile URL.
- Missing value never blocks generation and must not be fabricated.

## AI Generation Batch

Durable bulk AI generation request for selected opportunities.

**Fields**:

- `id`
- `user_id`
- `status`: `queued`, `running`, `completed`, `completed_with_failures`, `failed`, `cancelled`
- `selected_count`
- `completed_count`
- `failed_count`
- `skipped_count`
- `resume_attachment_id`
- `template_id`
- `created_at`
- `updated_at`

**Relationships**:

- Has many `AI Generation Batch Item` records.
- Belongs to one `Operator Account`.

**State transitions**:

- `queued -> running -> completed`
- `queued -> running -> completed_with_failures`
- `queued -> running -> failed`
- `queued|running -> cancelled`

**Validation**:

- Selection remains capped by existing bulk email limit of 50.
- Batch ownership must be enforced for every read/update/approval action.

## AI Generation Batch Item

One selected opportunity inside an AI generation batch.

**Fields**:

- `id`
- `batch_id`
- `opportunity_id`
- `recipient_email`
- `status`: `queued`, `running`, `completed`, `failed`, `skipped`
- `reason`
- `subject`
- `body`
- `retryable`
- `started_at`
- `completed_at`
- `updated_at`

**Relationships**:

- Belongs to one `AI Generation Batch`.
- References one owner-scoped `Opportunity`.

**State transitions**:

- `queued -> running -> completed`
- `queued -> running -> failed`
- `queued -> skipped`

**Validation**:

- Completed items become reviewable immediately, even while other items remain queued or running.
- Failed or skipped items include an operator-readable reason.
- Completed items do not create send requests until the operator reviews and approves sending.

## Search Run Feedback

Operator-visible capture progress for a LinkedIn run.

**Fields**:

- `run_id`
- `run_status`: `pending`, `running`, `completed`, `completed_no_results`, `failed`
- `inspected_count`
- `accepted_count`
- `rejected_count`
- `duplicate_count`
- AI filter counters such as passed, rejected, fallback, failed, skipped
- optional warning when candidate or opportunity details are temporarily unavailable

**Relationships**:

- Reads from one owner-scoped capture run.
- May link to candidate details and run opportunities when those details are available.

**Validation**:

- Run-level counters remain visible even when candidate or opportunity detail loading fails.
- A detail loading failure must not reset counters to zero.
- Terminal run status remains visible even when sample candidates cannot be displayed.

## AI Filter Signal

Structured diagnostic information attached to a candidate after optional AI review.

**Fields**:

- `detected_work_mode`: normalized readable value such as `remote`, `hybrid`, `onsite`, `presential`, `unknown`, or `mixed`
- region/country/timezone signals
- speaker/job-opening signals when available
- evidence quotes and fit summaries when available

**Relationships**:

- Belongs to one `AI Generation Batch Item` only when used in generated message context indirectly; otherwise belongs to one job search candidate.

**Validation**:

- Composite provider values such as `onsite|hybrid` or `remote|hybrid|onsite` are normalized or tolerated as mixed/unknown-compatible values.
- Unexpected signal values must not prevent candidate details or run feedback from being shown.

## Dedupe Identity

User-visible identity used to decide whether an approved candidate becomes a new opportunity or a duplicate.

**Fields**:

- normalized company name when available
- normalized role title or post headline when available
- matched keywords
- contact channel value
- source URL fallback only when company/title are missing

**Relationships**:

- Stored with job opportunity details and candidates for later duplicate checks.

**Validation**:

- Company/title remain the primary dedupe signal when present.
- If company and title are both missing, source URL discriminates different posts from the same recruiter email.
- Same source URL with same contact/keywords may still be treated as duplicate.
- Different source posts sharing recruiter email and keywords must not all collapse into one duplicate when company/title are empty.

## AI Filter Region Preference

Optional Search criteria used only when AI filters are enabled.

**Fields**:

- `accepted_regions`
- `excluded_regions`
- existing remote/onsite preferences as applicable

**Validation**:

- Not included in base LinkedIn capture query when AI filters are disabled.
- Not evaluated during candidate acceptance when AI filters are disabled.
- Legacy persisted region state must not affect base capture.
