# Web UI Contract: Freelance Bulk Outreach

## Leads Table Selection

- Each row has a stable checkbox with an accessible label containing the business name.
- The header checkbox selects only currently visible/filtered rows, not hidden rows across all pages.
- Selection summary shows selected count and visible-selected count.
- Changing filters or page must either preserve selected hidden rows with a clear summary or offer a clear reset; no hidden selection should be silently sent.
- Row navigation and existing per-row actions must still work when checkboxes are present.

## Bulk Action Entry Points

After at least one lead is selected, show two distinct actions:

- `Generate Email`
- `Generate WhatsApp`

Behavior:

- Clicking `Generate Email` creates an Email batch.
- Clicking `Generate WhatsApp` creates a WhatsApp batch.
- The chosen channel is shown in the review panel title and cannot silently change.
- Each action previews selected, eligible, missing-contact, invalid, and duplicate counts.
- Leads missing the selected channel contact are counted as excluded and do not enter draft generation or editable delivery review.

## Review Panel

The review panel must show:

- Batch channel
- Batch counters
- Channel readiness banner
- Missing configuration diagnostics
- Template used
- Seller/settings context summary
- Per-item business name, niche/category, city, website/social status, and source evidence summary
- Per-item status and reason
- Skip/unskip action

Email item editor:

- Recipient email input
- Subject input
- Body textarea
- Validation messages for missing/invalid email, subject, or body

WhatsApp item editor:

- Phone/WhatsApp input
- Message textarea
- Validation messages for missing/invalid phone, missing message, template/opt-in/message-window blocks

## Generation States

States:

- Empty: selected leads but no batch yet
- Creating batch
- Queued
- Generating
- Completed
- Partial generation failure
- Failed

Rules:

- AI generation never sends.
- Failed items remain visible.
- The operator can retry failed generation for one item or selected failed items.
- The operator can edit generated content before approval.

## Approval States

Email approval and WhatsApp approval are separate channel-specific actions.

Before approval, show:

- Eligible count
- Excluded count by reason
- Channel readiness
- Configured/provider daily limit
- Remaining capacity
- Duplicate-blocked items

Approval confirmation copy must state the exact channel and eligible item count.

Examples:

- "Send 18 reviewed emails"
- "Send 12 reviewed WhatsApp messages"

Approval must not send both channels at once.

## Channel Settings UI

Settings should show Email and WhatsApp readiness without exposing secrets.

For each channel:

- Provider name
- Enabled/disabled state
- Display sender/address/number when available
- Required env var names
- Missing env var names
- Daily limit and remaining capacity
- Last readiness check time
- Diagnostic code and operator-readable message

Diagnostic examples:

- Missing env: "Configure RESEND_API_KEY before sending email."
- Missing WhatsApp credentials: "Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN before sending WhatsApp messages."
- Template required: "The WhatsApp provider requires an approved template for this contact."
- Opt-in missing: "This contact cannot receive WhatsApp outreach until opt-in evidence is recorded."
- Rate limit: "The channel limit has been reached. Try again after the reset time."

## Copy and Terminology Guard

Allowed Freelance terms:

- lead
- business
- prospect
- offer
- website
- demo
- Email
- WhatsApp
- outreach
- first contact

Disallowed in new Freelance bulk UI:

- job
- resume
- candidature
- recruiter
- interview

## Accessibility Expectations

- Checkboxes, action buttons, dialogs, tabs, and validation messages must have accessible labels.
- Item editor controls must retain focus predictably after saving.
- Error banners must be visible without relying only on color.
- Buttons must not shift layout as counters update.
