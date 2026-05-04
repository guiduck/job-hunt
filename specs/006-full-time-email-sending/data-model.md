# Data Model: Full-time Email Sending

## Overview

The feature extends the existing opportunity model additively. Captured `job` opportunities remain the central record. New records support user settings, resumes, mode-scoped templates, previews/drafts, send requests, provider account state, and outreach events.

## Entities

### UserSettings

Operator-owned settings used to render and send `Full-time` emails.

**Fields**:

- `id`: stable identifier
- `operator_name`: display name for template variables
- `operator_email`: sender email shown in previews and validated against Gmail/OAuth account where possible
- `default_mode`: optional UI preference, expected `full_time` in this feature
- `created_at`, `updated_at`

**Validation**:

- `operator_email` must be a valid email when provided.
- The extension can read and update settings but cannot store provider secrets.

### ResumeAttachment

Metadata for a local resume file available to attach to application emails.

**Fields**:

- `id`
- `display_name`
- `file_name`
- `file_path` or storage key controlled by API/worker
- `mime_type`
- `file_size_bytes`
- `sha256`
- `is_available`
- `uploaded_at`
- `created_at`, `updated_at`

**Validation**:

- Allowed MIME types in v1: PDF and common document formats if explicitly supported during implementation.
- Missing or unavailable files cannot be attached.
- New previews select the most recently uploaded available resume by default.
- Resume attachment is optional for all sends; `job_application` without a resume must show a warning.

### EmailTemplate

Mode-scoped template for `Full-time` job application and follow-up emails.

**Fields**:

- `id`
- `mode`: `full_time`
- `template_kind`: `job_application` or `job_follow_up`
- `name`
- `subject_template`
- `body_template`
- `variables_schema`
- `is_active`
- `created_at`, `updated_at`

**Validation**:

- `mode=full_time` is required for all templates in this feature.
- Supported variables include `company_name`, `job_title`, `author_name`, `matched_keywords`, `source_url`, `resume_name`, `operator_name`, and `operator_email`.
- Deactivated templates are not selectable for new drafts but remain referenced by history.
- `Freelance` template kinds must not appear in `Full-time` selection.

### EmailDraft

Previewed and editable email content before approval.

**Fields**:

- `id`
- `opportunity_id`
- `template_id`
- `template_kind`
- `resume_attachment_id` nullable
- `to_email`
- `subject`
- `body`
- `rendered_variables`
- `warnings`
- `status`: `draft`, `approved`, `queued`, `sent`, `failed`, `cancelled`
- `created_at`, `updated_at`

**Validation**:

- `opportunity_id` must reference a `job` opportunity.
- `to_email` must be valid before approval.
- `job_application` drafts with no resume include a warning.
- Draft approval must preserve rendered subject/body and selected resume metadata even if the template changes later.

### SendRequest

Operator-approved send command for one recipient or a bulk batch member.

**Fields**:

- `id`
- `draft_id`
- `opportunity_id`
- `template_id`
- `template_kind`
- `resume_attachment_id` nullable
- `recipient_email`
- `subject_snapshot`
- `body_snapshot`
- `resume_snapshot`
- `status`: `approved`, `queued`, `sending`, `sent`, `failed`, `cancelled`, `skipped_duplicate`, `skipped_missing_contact`, `skipped_invalid_contact`
- `bulk_batch_id` nullable
- `approved_at`
- `queued_at`
- `sent_at`
- `failed_at`
- `error_code`
- `error_message`
- `created_at`, `updated_at`

**Validation**:

- Approval requires an explicit operator action.
- `job_application` send requests are blocked when the opportunity already has a successful `job_application` send.
- Successful `job_application` sends update `job_stage=applied`.
- Failed or skipped requests do not mark the opportunity as applied.

### BulkSendBatch

Preview and approval grouping for up to 25 selected opportunities.

**Fields**:

- `id`
- `template_id`
- `resume_attachment_id` nullable
- `selected_count`
- `sendable_count`
- `skipped_missing_contact_count`
- `skipped_duplicate_count`
- `blocked_invalid_contact_count`
- `limit_blocked_count`
- `status`: `previewed`, `approved`, `queued`, `completed`, `completed_with_failures`, `cancelled`
- `created_at`, `approved_at`, `completed_at`

**Validation**:

- Maximum selected opportunities for v1 preview: 25.
- Each selected opportunity produces either a send request or a skipped/blocked outcome.
- Duplicate `job_application` recipients are skipped/blocked, not overridden.

### SendingProviderAccount

Backend/worker-visible provider status for the operator's Gmail/OAuth sender.

**Fields**:

- `id`
- `provider_name`: `gmail`
- `display_email`
- `display_name`
- `auth_status`: `not_configured`, `authorization_required`, `authorized`, `expired`, `failed`
- `send_limit_per_day`
- `last_checked_at`
- `created_at`, `updated_at`

**Validation**:

- OAuth tokens and client secrets are never exposed to extension responses.
- Approval-to-send is blocked unless the provider is authorized.

### OutreachEvent

Append-only audit event for each email lifecycle outcome.

**Fields**:

- `id`
- `opportunity_id`
- `draft_id` nullable
- `send_request_id` nullable
- `bulk_batch_id` nullable
- `channel`: `email`
- `event_type`: `queued`, `sent`, `failed`, `skipped_duplicate`, `skipped_missing_contact`, `skipped_invalid_contact`
- `provider_name`
- `provider_message_id`
- `recipient_email`
- `template_id`
- `template_kind`
- `resume_attachment_id` nullable
- `subject`
- `status`
- `error_code`
- `error_message`
- `payload`
- `occurred_at`

**Validation**:

- Events are not edited after creation except for strictly technical correction tasks.
- Every approved send request must produce at least one event.
- Bulk send creates one event per recipient outcome.

## Relationships

- `JobOpportunityDetail` belongs to `Opportunity`.
- `EmailDraft` belongs to one `Opportunity`, one `EmailTemplate`, and optionally one `ResumeAttachment`.
- `SendRequest` belongs to one `EmailDraft`, one `Opportunity`, one `EmailTemplate`, and optionally one `BulkSendBatch`.
- `OutreachEvent` references `Opportunity` and may reference `EmailDraft`, `SendRequest`, `BulkSendBatch`, `EmailTemplate`, and `ResumeAttachment`.
- `SendingProviderAccount` is global for the single-operator v1 workflow.

## State Transitions

### EmailDraft

```text
draft -> approved -> queued -> sent
draft -> approved -> queued -> failed
draft -> cancelled
```

### SendRequest

```text
approved -> queued -> sending -> sent
approved -> queued -> sending -> failed
approved -> skipped_duplicate
approved -> skipped_missing_contact
approved -> skipped_invalid_contact
approved -> cancelled
```

### BulkSendBatch

```text
previewed -> approved -> queued -> completed
previewed -> approved -> queued -> completed_with_failures
previewed -> cancelled
```

### JobOpportunityDetail.job_stage

```text
new/saved -> applied
```

Only a successful `job_application` send may move the job to `applied`. `job_follow_up` sends do not change the stage by themselves.

## Indexing Notes

- Index `EmailTemplate(mode, template_kind, is_active)` for selection.
- Index `ResumeAttachment(uploaded_at, is_available)` for default CV lookup.
- Index `SendRequest(status, created_at)` for worker polling.
- Index successful `SendRequest(opportunity_id, template_kind, status)` or equivalent to enforce duplicate `job_application` blocking.
- Index `OutreachEvent(opportunity_id, occurred_at)` for job detail history.
