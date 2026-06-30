# Feature Specification: Freelance Bulk Outreach and Channel Settings

**Feature Branch**: `016-freelance-bulk-outreach`  
**Created**: 2026-06-24  
**Status**: Draft  
**Input**: User description: "Freelance Bulk Outreach and Channel Settings from docs/next-spec-prompt.md: add controlled bulk outreach to apps/web so the operator can select leads, generate individualized commercial messages with AI using templates as references, review/edit/skip each generated item, and approve real delivery through configured channels."

## Continuity Context

**Roadmap Phase**: Fase 4.5. Outreach Freelance Em Massa  
**Action Plan Step**: 9. Bulk outreach freelance after the governed Freelance lead catalog  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Use `docs/next-spec-prompt.md` to specify Freelance bulk outreach and channel settings: checkbox selection in the Leads table, AI generation per selected lead using lead evidence/settings/templates, item-level review/edit/skip, explicit approval before real sending, email as the first delivery channel, and WhatsApp as a provider-backed channel design without browser-link shortcuts.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-06-25

- Q: Should Freelance email delivery reuse the existing Full-time FastAPI/Gmail provider or be owned by `apps/web`? -> A: `apps/web` owns Freelance email delivery through its own provider adapter so the Freelance app does not depend on another service running.
- Q: Should WhatsApp be design-only, provider-ready/gated, or implemented end-to-end in this slice? -> A: Implement real WhatsApp delivery end-to-end when configured, with clear in-app diagnostics for missing environment variables, provider credentials, templates, opt-in, rate limits, and delivery failures.
- Q: What email/contact sources are valid for bulk outreach items? -> A: Provider payload, manual edit, or future enrichment are valid if the operator can review and edit the contact and message before approving the channel-specific send.
- Q: What rate limits and daily caps should apply by channel? -> A: Do not use small fixed product caps; use large configurable per-channel environment limits, with visible diagnostics when a limit is missing, reached, or overridden by provider errors.
- Q: Should Email and WhatsApp be approved together or through separate channel actions? -> A: Use separate Email and WhatsApp bulk action buttons after lead selection; the chosen button defines the batch channel before generation, with email review validating recipient/subject/body and WhatsApp review validating phone/message.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Leads for Bulk Outreach (Priority: P1)

As the operator, I want to select multiple Freelance leads from the Leads table so that I can prepare outreach for a focused visible set without losing filters, row links, or lead review context.

**Why this priority**: Bulk outreach starts with an intentional human selection. Without trustworthy selection behavior, later generation and delivery controls can act on the wrong businesses.

**Independent Test**: Can be fully tested by filtering the Leads table, selecting individual rows and all visible rows, changing filters or pages, and confirming that only intended Freelance leads enter the bulk outreach flow.

**Acceptance Scenarios**:

1. **Given** the operator is viewing filtered Freelance leads, **When** they select individual lead rows, **Then** the selected count updates and each selected row remains visibly selected without navigating away from the table.
2. **Given** the operator uses the master checkbox, **When** visible or filtered leads are selected, **Then** only the current visible result set is selected and hidden leads are not silently included.
3. **Given** selected leads include records without usable contact data, **When** the operator opens bulk outreach, **Then** those records remain visible in the batch with blocked or skipped reasons instead of disappearing.
4. **Given** the operator changes filters or pages, **When** existing selections would become hidden or stale, **Then** the UI clearly preserves, clears, or summarizes those selections so the operator can make an informed choice.

---

### User Story 2 - Generate Individualized Outreach Drafts (Priority: P1)

As the operator, I want AI to generate one tailored commercial outreach item per selected lead using my settings and templates as references so that I can review high-quality messages faster than writing each one from scratch.

**Why this priority**: The central product value is converting reviewed leads into useful first-contact drafts while keeping the operator in control.

**Independent Test**: Can be tested by selecting eligible leads, choosing a commercial template and channel, starting generation, and verifying that each item reaches generated, blocked, skipped, or failed status with a clear reason.

**Acceptance Scenarios**:

1. **Given** selected leads have sufficient business context and at least one contact route for the chosen channel, **When** the operator starts generation from the Email or WhatsApp bulk action, **Then** the batch records the chosen channel, creates an item for each selected lead, and produces individualized reviewable text for that channel.
2. **Given** the selected commercial template has tone, structure, and variable placeholders, **When** drafts are generated, **Then** the output follows the template as a reference while adapting to each lead's business, niche, locality, website status, evidence, and offer context.
3. **Given** seller or provider settings include seller name, title, email, WhatsApp, portfolio or company website, offer, price, delivery time, and extra context, **When** generation runs, **Then** available settings may be used as grounded context and missing settings are not invented.
4. **Given** a lead lacks required contact data, has invalid contact data, or has already received the same campaign/channel outreach, **When** generation runs, **Then** the item is blocked or skipped with a specific reason and no delivery request is created.

---

### User Story 3 - Review, Edit, and Skip Batch Items (Priority: P1)

As the operator, I want to review every generated item, edit recipient/channel/content, and skip or unskip leads before approval so that no message is sent without human judgment.

**Why this priority**: Human-reviewed outreach is a constitutional guardrail for this project and the main safety mechanism for bulk actions.

**Independent Test**: Can be tested by opening a generated batch, editing several items, skipping one item, saving changes, refreshing the page, and confirming the saved batch state is still reviewable before approval.

**Acceptance Scenarios**:

1. **Given** a generated batch exists, **When** the operator opens the review panel, **Then** each item shows business identity, chosen channel, recipient or phone target, subject/body or WhatsApp message text, status, reason, and edit controls.
2. **Given** the operator edits email recipient, email subject/body, WhatsApp phone number, WhatsApp message, or skip state, **When** they save the item, **Then** the updated item is persisted and reflected in counters and approval eligibility.
3. **Given** an item is not appropriate to send, **When** the operator marks it skipped, **Then** it is excluded from approval and the skipped reason remains visible.
4. **Given** an item failed generation, **When** the operator reviews the batch, **Then** the failure is visible and the operator can retry generation for that item or keep it skipped without affecting other items.

---

### User Story 4 - Approve Real Email Delivery (Priority: P2)

As the operator, I want to approve real delivery only after reviewing eligible items so that selected Freelance leads receive outreach through configured email without accidental or duplicate sends.

**Why this priority**: Real delivery creates external side effects. It must be explicit, auditable, and duplicate-safe, but it can follow after the generation/review MVP.

**Independent Test**: Can be tested by configuring an email sender, approving only eligible unskipped items in a reviewed batch, and confirming delivery events are created for approved items while blocked, skipped, duplicate, or invalid items remain unsent.

**Acceptance Scenarios**:

1. **Given** a reviewed batch contains eligible unskipped email items and a configured sender, **When** the operator reviews or edits recipients and confirms approval, **Then** delivery requests are created only for those eligible items.
2. **Given** approval is attempted without a configured sender, **When** the operator confirms, **Then** no sends are queued and the UI explains what channel configuration is missing.
3. **Given** a lead already has prior outreach for the same campaign and channel, **When** the operator attempts approval, **Then** the duplicate item is blocked unless the operator is in an explicit follow-up flow.
4. **Given** delivery succeeds or fails for an approved item, **When** the operator reviews the batch or lead history, **Then** the item and lead show the latest delivery outcome with provider status or failure reason.

---

### User Story 5 - Configure Outreach Channels and AI Context (Priority: P2)

As the operator, I want Settings to store commercial context and channel readiness so that generation and delivery use my provider, offer, website, and channel constraints consistently.

**Why this priority**: Bulk outreach quality depends on grounded seller/provider context, and real delivery depends on channel readiness without exposing secrets to the browser.

**Independent Test**: Can be tested by updating seller/company website and free-text AI context, checking channel readiness indicators, generating a batch that uses the saved context, and attempting approval with configured and unconfigured channels.

**Acceptance Scenarios**:

1. **Given** the operator updates seller identity, company or portfolio website, offer details, delivery terms, and extra AI context, **When** messages are generated, **Then** the drafts can use that context without inventing facts outside the saved settings and lead evidence.
2. **Given** the operator opens channel settings, **When** email is not configured, **Then** email delivery is shown as unavailable while generation/review can still proceed.
3. **Given** WhatsApp is not configured through an approved business messaging provider, **When** the operator reviews channel settings or batch actions, **Then** WhatsApp sending is blocked with clear in-app diagnostics for the missing provider, environment variable, credential, template, opt-in, or rate-limit requirement and no prefilled browser-link shortcut is offered as final delivery.
4. **Given** channel rate limits or daily caps are configured by environment or imposed by the provider, **When** the operator prepares or approves a batch, **Then** the system displays the applicable limit, remaining capacity, and any missing or exceeded configuration before blocking or queuing delivery.

### Edge Cases

- A selected lead has a phone number but no email while the batch is set to email.
- The operator selects Email but some leads only have phone/WhatsApp contacts, or selects WhatsApp but some leads only have email contacts.
- A selected lead has email, phone, or WhatsApp text that is malformed, duplicated, imported from provider payload, enriched later, or manually edited during review.
- A lead has both `website_url` and `social_url`, and the message should distinguish owned website from social-only presence.
- A batch includes leads from multiple campaigns or no campaign context.
- A selected lead has stale website/status evidence, uncertain classification, or missing source URL.
- AI generation returns unusable, empty, unsafe, or non-commercial content for one item while other items succeed.
- The operator closes and reopens the app while a batch is queued, running, or partially reviewed.
- A provider is configured but later becomes disconnected, rate-limited, or unauthorized before approval.
- A large per-channel environment cap is missing, malformed, exceeded, or lower than the provider's actual available capacity.
- Approval is clicked twice, or two tabs attempt to approve the same item.
- A previous outreach event exists for the same lead/channel/campaign, but the operator wants a future follow-up.
- WhatsApp provider constraints require approved templates, opt-in, or message windows before delivery.
- WhatsApp delivery is selected but required provider configuration, environment variables, account approval, templates, opt-in evidence, or rate-limit capacity are missing.
- A generated message accidentally uses job, resume, candidature, or full-time vocabulary in a Freelance context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Leads table MUST support individual row selection and a master selection control for visible or filtered Freelance leads.
- **FR-002**: Selection behavior MUST preserve existing lead filters, row navigation, per-row actions, and mobile or narrow-layout usability.
- **FR-003**: The system MUST provide a bulk outreach entry point that opens a review flow for the selected leads and shows selected, eligible, blocked, and missing-contact counts before generation.
- **FR-003a**: The Leads table MUST expose separate bulk action buttons or commands for Email and WhatsApp after lead selection, and the chosen action MUST define the batch channel before generation starts.
- **FR-004**: Bulk outreach MUST create a durable batch record with owner scope, selected lead references, chosen channel, template choice, lifecycle status, counters, timestamps, and failure summary.
- **FR-005**: Each selected lead MUST create a durable batch item with lead, campaign when available, contact channel, recipient/contact target, content fields, status, skip state, duplicate state, validation errors, and send outcome.
- **FR-006**: Batch and item statuses MUST distinguish queued, running, completed, failed, skipped, approved, sent, failed_send, duplicate_blocked, missing_contact, and invalid_contact states or equivalent user-visible states.
- **FR-007**: The generation flow MUST create individualized draft content per lead using saved lead context, source evidence, website/social status, commercial status, niche/category, locality, contact signals, selected commercial template, and saved seller/provider context.
- **FR-008**: Generated content MUST treat the selected template as tone and structure guidance, not as permission to invent facts about the seller, offer, lead, website, results, or prior relationship.
- **FR-009**: AI generation MUST never create delivery requests or send outreach automatically.
- **FR-010**: The review flow MUST show per-item status and counters for selected, eligible, missing contact, duplicate, invalid, generated, failed, skipped, approved, sent, and failed-send items.
- **FR-011**: The operator MUST be able to edit and save each item's channel-specific contact and content before approval: email recipient, subject, and body for Email batches; phone or WhatsApp contact target and message text for WhatsApp batches; plus skip state for either channel.
- **FR-012**: Items with missing or invalid contact data MUST remain visible with specific reasons and MUST be excluded from approval until corrected or deliberately skipped.
- **FR-012a**: Provider payload, manual operator edits, and future enrichment MAY all supply email or WhatsApp contact targets, but the final contact value MUST be visible, validated, and editable in the review step before the operator approves sending.
- **FR-013**: The system MUST block duplicate outreach for the same lead, campaign, and channel unless a separate explicit follow-up flow is selected.
- **FR-014**: The approval flow MUST require an explicit operator confirmation after generation and review before any real delivery is queued.
- **FR-014a**: Email and WhatsApp approvals MUST be separate channel-specific actions so one approval cannot send both channels at once.
- **FR-015**: Approval MUST create delivery requests or delivery events only for eligible, unskipped, non-duplicate, reviewed items in the approved batch.
- **FR-016**: Email MUST be supported as the first real delivery channel when a sender is configured and ready, and the Freelance app MUST own the email delivery workflow through its own provider adapter rather than depending on the Full-time service being available.
- **FR-017**: Email delivery state MUST be visible at both batch-item level and lead-history level, including sent, failed, skipped, duplicate-blocked, provider status, recipient, subject, and timestamp where available.
- **FR-018**: Settings MUST include or extend commercial context for seller/provider name, title, email, WhatsApp, portfolio or company website, offer title, offer description, price or payment terms, delivery time, and free-text AI context.
- **FR-019**: Settings MUST expose channel readiness for email and WhatsApp without exposing provider secrets, tokens, or private credentials to browser-visible UI.
- **FR-019a**: Channel readiness MUST include configurable per-channel daily limits from environment or provider state, without relying on small hard-coded product caps.
- **FR-020**: WhatsApp MUST be implemented as a real provider-backed delivery channel when configured, with configuration, readiness, compliance constraints, rate limits, delivery status, and history expectations.
- **FR-021**: WhatsApp MUST NOT be implemented as a final delivery flow through prefilled browser links or query-string shortcuts.
- **FR-022**: If WhatsApp provider configuration, required environment variables, credentials, account approval, opt-in evidence, templates, message windows, or rate limits are not ready, the UI MUST keep WhatsApp sending unavailable and show a specific operator-readable diagnostic for what is missing or failing.
- **FR-022a**: WhatsApp delivery attempts MUST record and display provider request status, provider response status, missing-configuration errors, rate-limit blocks, template/opt-in blocks, sent state, and failed-send reasons at batch-item and lead-history level.
- **FR-023**: Bulk outreach MUST preserve owner scope using the existing web authentication/session behavior so one operator cannot see or approve another operator's batches, items, settings, or events.
- **FR-024**: The Freelance UI MUST use business, prospecting, offer, website, demo, WhatsApp, and commercial language, and MUST NOT reuse Full-time wording such as job, resume, candidature, recruiter, or interview for this flow.
- **FR-025**: The system MUST keep niche candidates and reference/image-derived catalog candidates outside bulk outreach; only real saved Freelance leads from operator/provider flows may enter a batch.
- **FR-026**: Batch state MUST survive page refresh or app reopen so the operator can resume review, retry failed generation, or inspect delivery outcomes.
- **FR-027**: The system MUST provide clear empty, loading, queued, running, failed, partial-success, and completed states for generation and delivery.
- **FR-028**: Tests MUST cover selection behavior, eligibility, generation context, item review edits, approval blocking, duplicate prevention, missing/invalid contacts, owner scope, settings context, and channel gating.

### Key Entities *(include if feature involves data)*

- **Bulk Outreach Batch**: A selected set of Freelance leads prepared for generation, review, approval, and delivery through one channel and template context.
- **Bulk Outreach Item**: A per-lead draft and delivery unit inside a batch, including contact target, generated content, review state, skip state, validation state, duplicate state, and final delivery outcome.
- **Outreach Channel Setting**: Operator-owned readiness and policy configuration for a channel such as email or WhatsApp, including provider state, display sender, limits, and blocked reasons.
- **Commercial Generation Context**: The grounded input used to generate a message, including lead evidence, website/social status, niche, locality, template reference, seller/company settings, offer details, and operator-provided AI context.
- **Outreach Event**: An auditable record that a batch item was queued, sent, failed, skipped, blocked as duplicate, or blocked for missing/invalid contact.
- **Duplicate Outreach Rule**: The rule that prevents repeated first-contact sends to the same lead, campaign, and channel unless a future follow-up flow explicitly overrides it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The operator can select at least 50 visible Freelance leads from a filtered table and open the bulk outreach flow in under 30 seconds without losing filter context.
- **SC-002**: 100% of selected leads are counted in the batch summary as eligible, blocked, skipped, duplicate, invalid, missing-contact, generated, or failed; missing-contact and duplicate leads are excluded from editable delivery review instead of blocking eligible leads.
- **SC-003**: At least 95% of eligible selected leads receive an individualized generated draft or a specific generation failure reason during a completed generation run.
- **SC-004**: The operator can review, edit, skip, and save changes for any generated item before approval, and the saved state persists after a page refresh.
- **SC-005**: Zero delivery requests are created before explicit operator approval in acceptance testing.
- **SC-006**: Approval creates delivery work only for eligible, unskipped, non-duplicate reviewed items, with 100% of excluded items retaining visible reasons.
- **SC-006a**: In acceptance testing, Email approval sends only reviewed Email batch items and WhatsApp approval sends only reviewed WhatsApp batch items; no mixed-channel approval sends both.
- **SC-007**: Duplicate first-contact outreach to the same lead, campaign, and channel is blocked in 100% of tested duplicate scenarios unless an explicit follow-up flow is used.
- **SC-008**: Email readiness, missing configuration, provider failure, configured channel limit, remaining capacity, and rate-limit states are visible to the operator before approval.
- **SC-009**: WhatsApp sending works end-to-end when a real business messaging provider is configured and remains blocked with a specific diagnostic when configuration, credentials, templates, opt-in, or rate-limit capacity are missing; no tested WhatsApp path sends through a prefilled browser link.
- **SC-010**: Zero Full-time/job-specific labels appear in the Freelance bulk outreach UI during acceptance review.

## Assumptions

- The current `014-freelance-web-app` and `015-freelance-niche-catalog` implementation is the baseline.
- The first delivery slice focuses on first-contact outreach; follow-up sequencing is a later explicit flow.
- Email is the first real send channel, and WhatsApp is also in scope for real provider-backed delivery when the required provider configuration, credentials, templates, opt-in rules, and limits are operational.
- Exact email and WhatsApp provider choices can be decided during planning, as long as secrets remain server-side and the operator sees readiness/errors clearly.
- Channel caps are configured through large per-channel environment limits or provider-reported capacity rather than small fixed product caps.
- Freelance email delivery should be implemented within `apps/web` through a dedicated provider adapter; reuse of Full-time provider behavior is a reference pattern only, not a runtime dependency.
- AI generation may run asynchronously or synchronously during the first implementation, but generated content and batch state must be durable and resumable.
- The operator is an internal authenticated user, and existing web auth/session behavior is the owner-scope boundary.
- Leads without email may still be eligible for WhatsApp if phone/WhatsApp readiness exists, but they are blocked for email until a valid recipient is added or edited during review.
- Provider-real Google Maps discovery quality remains a separate concern; this feature operates on already saved real Freelance leads and must not create leads from niche candidates or reference files.
