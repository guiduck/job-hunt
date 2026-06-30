# API Contract: Freelance Bulk Outreach

All routes are under `apps/web` and preserve existing owner scope from the current web session.

Responses must never include provider secret values. Environment diagnostics may include missing variable names.

## Create Batch

`POST /api/freelance/bulk-outreach`

Creates a channel-specific batch from selected leads.

Request:

```json
{
  "channel": "email",
  "leadIds": ["lead_1", "lead_2"],
  "templateId": "template_1",
  "stage": "first_contact",
  "campaignId": "campaign_1"
}
```

Rules:

- `channel` must be `email` or `whatsapp`.
- `leadIds` must contain at least one lead owned by the current user.
- The selected channel is immutable for the batch.
- Niche candidates and reference/image candidates are not valid lead IDs.

Success `201`:

```json
{
  "batch": {
    "id": "batch_1",
    "channel": "email",
    "status": "draft",
    "selectedCount": 2,
    "eligibleCount": 1,
    "missingContactCount": 1,
    "duplicateCount": 0,
    "invalidContactCount": 0
  },
  "items": [
    {
      "id": "item_1",
      "leadId": "lead_1",
      "status": "queued",
      "recipientEmail": "owner@example.com"
    },
    {
      "id": "item_2",
      "leadId": "lead_2",
      "status": "missing_contact",
      "validationErrorCode": "missing_email",
      "validationErrorMessage": "Add an email address before approving Email delivery."
    }
  ]
}
```

Errors:

- `400 invalid_channel`
- `400 empty_selection`
- `403 owner_scope_required`
- `404 lead_not_found`

## Read Batch

`GET /api/freelance/bulk-outreach/{batchId}`

Returns batch, counters, items, channel readiness snapshot, and events summary.

Success `200`:

```json
{
  "batch": {
    "id": "batch_1",
    "channel": "whatsapp",
    "status": "completed",
    "selectedCount": 10,
    "generatedCount": 8,
    "missingContactCount": 1,
    "duplicateCount": 1,
    "skippedCount": 0,
    "sentCount": 0,
    "failedSendCount": 0,
    "diagnostics": []
  },
  "channelReadiness": {
    "channel": "whatsapp",
    "status": "missing_config",
    "providerName": "twilio",
    "missingEnvVars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
    "diagnosticCode": "missing_env",
    "diagnosticMessage": "Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN before sending WhatsApp messages."
  },
  "items": []
}
```

## Generate Batch Items

`POST /api/freelance/bulk-outreach/{batchId}/generate`

Generates or regenerates draft content for eligible items in the batch.

Request:

```json
{
  "itemIds": ["item_1"],
  "retryFailed": true
}
```

Rules:

- Generation creates no delivery requests.
- Generated content uses lead evidence, template, seller settings, offer details, and channel.
- Failed items keep failure diagnostics and do not block successful items.

Success `200`:

```json
{
  "batch": {
    "id": "batch_1",
    "status": "completed",
    "generatedCount": 1,
    "failedCount": 0
  },
  "items": [
    {
      "id": "item_1",
      "status": "generated",
      "recipientEmail": "owner@example.com",
      "subject": "Quick idea for Example Clinic",
      "body": "Hi Example Clinic..."
    }
  ]
}
```

## Update Item Review

`PATCH /api/freelance/bulk-outreach/{batchId}/items/{itemId}`

Saves operator edits before approval.

Email request:

```json
{
  "recipientEmail": "new@example.com",
  "subject": "Updated subject",
  "body": "Updated email body",
  "skip": false
}
```

WhatsApp request:

```json
{
  "recipientWhatsapp": "+15555550123",
  "message": "Updated WhatsApp message",
  "skip": false
}
```

Success `200` returns the updated item and refreshed counters.

Validation errors:

- `400 invalid_email`
- `400 invalid_phone`
- `400 missing_subject`
- `400 missing_body`
- `400 missing_message`
- `400 item_channel_mismatch`

## Approve Delivery

`POST /api/freelance/bulk-outreach/{batchId}/approve`

Approves the channel-specific batch and queues/sends eligible reviewed items.

Request:

```json
{
  "confirm": true
}
```

Rules:

- Approval sends only the batch channel.
- Approval is idempotent; repeated calls do not duplicate sends.
- Skipped, invalid, missing-contact, duplicate-blocked, and failed-generation items remain excluded with reasons.
- Channel readiness is checked at approval time.

Success `200`:

```json
{
  "batch": {
    "id": "batch_1",
    "status": "partially_sent",
    "approvedCount": 7,
    "sentCount": 6,
    "failedSendCount": 1
  },
  "results": [
    {
      "itemId": "item_1",
      "status": "sent",
      "providerName": "resend",
      "providerMessageId": "msg_123"
    },
    {
      "itemId": "item_2",
      "status": "failed_send",
      "diagnosticCode": "provider_rate_limited",
      "diagnosticMessage": "The email provider rate limit was reached. Try again after the reset time."
    }
  ]
}
```

Blocking response `409`:

```json
{
  "error": "channel_not_ready",
  "diagnosticCode": "missing_env",
  "diagnosticMessage": "Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN before sending WhatsApp messages.",
  "missingEnvVars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]
}
```

## Channel Settings and Readiness

`GET /api/freelance/channel-settings`

Success `200`:

```json
{
  "items": [
    {
      "channel": "email",
      "providerName": "resend",
      "status": "ready",
      "displayAddress": "hello@example.com",
      "dailyLimit": 500,
      "remainingToday": 493,
      "missingEnvVars": []
    },
    {
      "channel": "whatsapp",
      "providerName": "twilio",
      "status": "missing_config",
      "dailyLimit": 500,
      "remainingToday": 500,
      "missingEnvVars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]
    }
  ]
}
```

`PATCH /api/freelance/channel-settings`

Request:

```json
{
  "channel": "email",
  "enabled": true,
  "providerName": "resend",
  "displayAddress": "hello@example.com"
}
```

Rules:

- Request may store display metadata and enabled state.
- Secrets are configured via environment variables only.

## Lead Outreach History

`GET /api/freelance/leads/{leadId}/outreach-events`

Returns user-safe delivery/generation history for one lead.

Success `200`:

```json
{
  "items": [
    {
      "id": "event_1",
      "channel": "email",
      "eventType": "sent",
      "recipient": "owner@example.com",
      "subject": "Quick idea for Example Clinic",
      "providerName": "resend",
      "occurredAt": "2026-06-25T12:00:00.000Z"
    }
  ]
}
```
