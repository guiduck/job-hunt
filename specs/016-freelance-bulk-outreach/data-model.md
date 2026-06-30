# Data Model: Freelance Bulk Outreach and Channel Settings

## Existing Entities Extended

### FreelanceLead

Existing lead record remains the source of truth for business identity, source evidence, website/social status, contact values, score, status, notes, and campaign context.

New relationships:

- Has many `BulkOutreachItem`
- Has many `OutreachEvent`

Relevant fields used by this feature:

- `email`
- `phone`
- `whatsapp`
- `websiteUrl`
- `socialUrl`
- `sourceEvidence`
- `classificationReasons`
- `campaignId`
- `commercialStatus`

### SellerSettings

Existing seller settings continue to provide generation context. The implementation should add missing fields only if needed by the spec, such as company/provider website or more explicit AI context labels, while preserving existing fields:

- `sellerName`
- `sellerTitle`
- `sellerEmail`
- `sellerWhatsapp`
- `portfolioUrl`
- `offerTitle`
- `offerDescription`
- `landingPagePrice`
- `installments`
- `deliveryTime`
- `extraContext`

## New Enums

### OutreachChannel

- `email`
- `whatsapp`

### BulkOutreachBatchStatus

- `draft`
- `queued`
- `running`
- `completed`
- `failed`
- `approved`
- `partially_sent`
- `sent`

### BulkOutreachItemStatus

- `queued`
- `generating`
- `generated`
- `generation_failed`
- `missing_contact`
- `invalid_contact`
- `duplicate_blocked`
- `skipped`
- `approved`
- `sending`
- `sent`
- `failed_send`

### OutreachEventType

- `generated`
- `generation_failed`
- `item_updated`
- `skipped`
- `unskipped`
- `approved`
- `queued_send`
- `sent`
- `failed_send`
- `blocked_missing_contact`
- `blocked_invalid_contact`
- `blocked_duplicate`
- `blocked_channel_not_ready`
- `blocked_rate_limit`

### ChannelReadinessStatus

- `ready`
- `missing_config`
- `missing_credentials`
- `not_approved`
- `missing_template`
- `missing_opt_in`
- `rate_limited`
- `provider_error`
- `disabled`

## New Entities

### BulkOutreachBatch

Represents one operator-created, channel-specific bulk outreach workflow.

Fields:

- `id`
- `userId`
- `channel`: `OutreachChannel`
- `campaignId?`
- `templateId?`
- `stage`: `first_contact` for this slice
- `status`: `BulkOutreachBatchStatus`
- `selectedCount`
- `eligibleCount`
- `missingContactCount`
- `invalidContactCount`
- `duplicateCount`
- `generatedCount`
- `failedCount`
- `skippedCount`
- `approvedCount`
- `sentCount`
- `failedSendCount`
- `channelLimitSnapshot`: JSON with configured limit, provider limit, remaining capacity, reset time
- `generationContextSnapshot`: JSON with seller/settings/template summary and no secrets
- `diagnostics`: JSON with user-safe readiness/failure details
- `createdAt`
- `updatedAt`
- `generatedAt?`
- `approvedAt?`
- `completedAt?`

Relationships:

- Belongs to optional `FreelanceCampaign`
- Belongs to optional `CommercialTemplate`
- Has many `BulkOutreachItem`
- Has many `OutreachEvent`

Validation rules:

- `channel` is immutable after creation.
- Batch creation requires at least one selected lead.
- Batch owner must match every selected lead owner.
- Approval allowed only after generation/review and only for eligible unskipped items.

### BulkOutreachItem

Represents one lead's draft, review state, and delivery state within a batch.

Fields:

- `id`
- `userId`
- `batchId`
- `leadId`
- `campaignId?`
- `channel`: copied from batch
- `status`: `BulkOutreachItemStatus`
- `contactSource`: `provider_payload`, `manual_edit`, `enrichment`, or `lead_existing`
- `recipientEmail?`
- `recipientPhone?`
- `recipientWhatsapp?`
- `subject?`
- `body?`
- `message?`
- `templateId?`
- `generationInputContext`: JSON with lead/template/settings summary
- `generationErrorCode?`
- `generationErrorMessage?`
- `validationErrorCode?`
- `validationErrorMessage?`
- `duplicateOfEventId?`
- `skipReason?`
- `operatorEditedAt?`
- `approvedAt?`
- `sentAt?`
- `providerName?`
- `providerMessageId?`
- `providerStatus?`
- `providerErrorCode?`
- `providerErrorMessage?`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `BulkOutreachBatch`
- Belongs to `FreelanceLead`
- Has many `OutreachEvent`

Validation rules:

- Email items require `recipientEmail`, `subject`, and `body` before approval.
- WhatsApp items require `recipientWhatsapp` or `recipientPhone`, plus `message`, before approval.
- Contact targets can come from lead/provider/manual/enrichment but final values must be visible and editable.
- Skipped items are excluded from approval.
- Duplicate first-contact items are blocked unless a future follow-up flow is explicitly added.

### OutreachChannelSetting

Stores owner-scoped, user-safe channel configuration and readiness state. Secrets remain in environment/provider config, not visible in client responses.

Fields:

- `id`
- `userId`
- `channel`: `email` or `whatsapp`
- `providerName`
- `displayName?`
- `displayAddress?`
- `status`: `ChannelReadinessStatus`
- `enabled`
- `dailyLimit?`
- `remainingToday?`
- `limitResetAt?`
- `requiredEnvVars`: JSON names only, no values
- `missingEnvVars`: JSON names only, no values
- `diagnosticCode?`
- `diagnosticMessage?`
- `lastCheckedAt?`
- `createdAt`
- `updatedAt`

Validation rules:

- Must never store provider secret values.
- Missing env vars are shown as names only.
- Readiness can be refreshed before approval.

### OutreachEvent

Auditable record for generation, review, approval, delivery, and blocking outcomes.

Fields:

- `id`
- `userId`
- `batchId?`
- `itemId?`
- `leadId`
- `campaignId?`
- `channel`
- `eventType`: `OutreachEventType`
- `providerName?`
- `providerMessageId?`
- `recipient?`
- `subject?`
- `status`
- `diagnosticCode?`
- `diagnosticMessage?`
- `payload`: JSON user-safe provider/request summary
- `occurredAt`

Validation rules:

- Event owner must match batch/item/lead owner.
- Failed and blocked events must include a diagnostic code/message.
- Provider payloads must be scrubbed of secrets before persistence or UI display.

## State Transitions

### Batch

```text
draft -> queued -> running -> completed
draft -> failed
completed -> approved -> partially_sent -> sent
completed -> approved -> sent
completed -> approved -> failed
```

Notes:

- Generation may be synchronous in first implementation, but persisted status should still support queued/running.
- Approval is channel-specific; one batch has one channel.

### Item

```text
queued -> generating -> generated
queued -> missing_contact
queued -> invalid_contact
queued -> duplicate_blocked
generating -> generation_failed
generated -> skipped
skipped -> generated
generated -> approved -> sending -> sent
generated -> approved -> sending -> failed_send
```

Notes:

- Manual edits keep item in `generated` unless they make the contact invalid.
- Duplicate or missing-contact items can become generated/eligible if the operator edits the contact and duplicate rule no longer blocks.

## Duplicate Rule

For first-contact outreach, block sending when an existing `OutreachEvent` or sent item exists for:

- same `userId`
- same `leadId`
- same `campaignId` when available
- same `channel`
- same `stage = first_contact`
- event type/status equivalent to sent or queued send

Future follow-up flow may explicitly bypass this with a different stage and separate UI.

## Channel Diagnostics

Diagnostic codes should be stable and testable:

- `missing_env`
- `missing_credentials`
- `provider_not_configured`
- `provider_not_approved`
- `template_required`
- `opt_in_required`
- `message_window_closed`
- `daily_limit_reached`
- `provider_rate_limited`
- `provider_unauthorized`
- `provider_rejected`
- `network_error`
- `unknown_provider_error`

Messages must be operator-readable and should point to the likely missing configuration without exposing secret values.
