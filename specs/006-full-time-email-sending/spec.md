# Feature Specification: Full-time Email Sending

**Feature Branch**: `006-full-time-email-sending`  
**Created**: 2026-05-02  
**Status**: Draft  
**Input**: User description: "Specify the next incremental feature: Full-time email templates and real email sending, including individual send, bulk send foundation, resume attachment support, send tracking, and a dedicated templates section."

## Continuity Context

**Roadmap Phase**: Fase 3. Revisao e envio para vagas  
**Action Plan Step**: 5. Envio de emails para vagas  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Create the next `Full-time` specification for job application templates, resume selection, email preview, explicit send approval, send tracking, and a conservative bulk-send foundation, while keeping the later `Freelance` Google Maps lane out of scope.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-05-02

- Q: When is a resume attachment required for sending? → A: Resume is always optional, but `job_application` sends must warn when no resume is attached; new email previews should default to the last uploaded CV from user settings when available.
- Q: Which sending provider path is required for the first real-send version? → A: Gmail/OAuth real sending is required for v1, while the provider boundary should still allow later alternatives.
- Q: How should duplicate job application sends be handled after one successful application? → A: Duplicate `job_application` sends are blocked after one successful application; later contact should use `job_follow_up`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Full-time Email Templates (Priority: P1)

As the operator, I want a dedicated `Full-time` templates area where I can create, edit, preview, activate, and deactivate job application and job follow-up templates, so I can reuse consistent messages without mixing them with future freelance outreach templates.

**Why this priority**: Real sending depends on reviewed templates that are scoped to the job application workflow and safe to reuse across captured vacancies.

**Independent Test**: Can be fully tested by creating a job application template, rendering a preview with sample opportunity data, deactivating it, and confirming it no longer appears as a selectable send template while remaining available for history.

**Acceptance Scenarios**:

1. **Given** the operator is in the `Full-time` templates area, **When** they create a `job_application` template with subject, body, and supported variables, **Then** the template is saved as active and available for job email preparation.
2. **Given** an existing active template, **When** the operator edits its subject or body, **Then** future previews use the updated content without changing previously recorded send history.
3. **Given** a deactivated template, **When** the operator prepares a new job email, **Then** the template is not offered for new sends but can still be identified in historical events.
4. **Given** a template contains variables for company, job title, author, keywords, source link, resume, operator name, or operator email, **When** the operator previews it, **Then** the rendered result shows actual values or clear fallback text for missing values.

---

### User Story 2 - Prepare and Send One Job Application Email (Priority: P1)

As the operator reviewing a captured job opportunity, I want to choose a template and resume, review the rendered email, edit it, and explicitly confirm sending, so I can apply to a vacancy without manually composing the whole message.

**Why this priority**: Individual send is the first useful end-to-end application workflow and validates templates, resumes, duplicate protection, and provider status before bulk sending.

**Independent Test**: Can be fully tested by selecting one eligible `Full-time` opportunity with a recruiter email, preparing a preview, editing the message, confirming send, and seeing the opportunity marked as applied with send history recorded.

**Acceptance Scenarios**:

1. **Given** a reviewed job opportunity with a valid recipient email, an active job application template, and an available resume, **When** the operator prepares an email, **Then** the system shows recipient, subject, body, selected resume, missing-field warnings, and a confirmation step before sending.
2. **Given** the operator manually edits the previewed subject or body, **When** they confirm the send, **Then** the edited content is what gets sent and recorded.
3. **Given** the operator cancels from the confirmation step, **When** no send is approved, **Then** no email is sent and the job stage remains unchanged.
4. **Given** sending succeeds, **When** the send history is viewed, **Then** it shows template, resume, recipient, send status, provider message reference when available, timestamp, and the applied job stage.

---

### User Story 3 - Manage Resumes in User Settings (Priority: P2)

As the operator, I want a user settings page where I can upload and manage my resumes, so email previews can start with my most recently uploaded CV while still letting me send without an attachment when needed.

**Why this priority**: Resume selection improves job applications, but the workflow must not block sending when the operator intentionally proceeds without an attachment.

**Independent Test**: Can be fully tested by uploading resumes in user settings, preparing a preview that selects the last uploaded CV by default, removing the resume from the preview, seeing a warning for a job application, and confirming the send history records whether a resume was attached.

**Acceptance Scenarios**:

1. **Given** multiple resumes exist in user settings, **When** the operator prepares a new email preview, **Then** the most recently uploaded available CV is selected by default unless the operator chooses another resume or removes the attachment.
2. **Given** no resume is selected for a `job_application` email, **When** the operator reviews the confirmation step, **Then** the system shows a clear warning that the application will be sent without a CV attached.
3. **Given** no resume is selected for a `job_follow_up` email, **When** the operator reviews the confirmation step, **Then** sending can proceed without a resume-specific warning.
4. **Given** a selected resume is unavailable or invalid at send time, **When** the operator attempts to confirm sending, **Then** the system blocks that attachment and asks the operator to choose another resume or continue without one.

---

### User Story 4 - Review Bulk Send Summary Before Approval (Priority: P2)

As the operator, I want to select multiple eligible job opportunities, review a summary of who will be sent to and who will be skipped, and explicitly approve the batch, so I can apply to several jobs while avoiding accidental or duplicate sends.

**Why this priority**: Bulk sending is part of the desired workflow, but the first version must remain conservative, transparent, and auditable.

**Independent Test**: Can be fully tested by selecting a mixed set of opportunities and confirming that eligible jobs are queued, missing-email jobs are skipped, jobs with an existing successful application send are skipped, and each recipient receives its own tracked event.

**Acceptance Scenarios**:

1. **Given** selected opportunities include valid recipients, missing recipients, and already-sent applications, **When** the bulk summary is shown, **Then** the operator sees counts and details for sendable, skipped missing-email, skipped duplicate, and blocked items.
2. **Given** the number of sendable recipients exceeds the configured conservative limit, **When** the operator reviews the batch, **Then** the system blocks or trims the batch and explains the limit before any send is approved.
3. **Given** the operator approves a valid batch, **When** the send workflow runs, **Then** each recipient has an individual tracked event and partial failures do not erase successful sends.
4. **Given** the operator cancels the bulk confirmation, **When** the workflow exits, **Then** no recipients are sent to and no opportunity stage changes.

---

### User Story 5 - Inspect Application Send History (Priority: P3)

As the operator, I want to see the sending history on a job detail, so I can understand which template and resume were used, whether sending succeeded, and what follow-up may be needed.

**Why this priority**: History closes the loop for manual operation and prepares the later response, interview, rejection, and follow-up workflows.

**Independent Test**: Can be fully tested by opening a job with previous send attempts and confirming the timeline displays successful sends, failed sends, skipped duplicates, provider references, errors, and timestamps.

**Acceptance Scenarios**:

1. **Given** a job has one or more send attempts, **When** the operator opens the job detail, **Then** the history lists each attempt with recipient, template, resume, status, timestamp, and error when present.
2. **Given** a send failed after approval, **When** the operator reviews history, **Then** the failure is visible without marking the job as successfully applied.
3. **Given** a job was successfully sent with a `job_application` template, **When** the operator tries to prepare another job application send for the same job, **Then** the duplicate application send is blocked and the operator is directed to use a follow-up template instead.

### Edge Cases

- A job opportunity has no recipient email: sending is blocked for individual send and skipped with a clear reason in bulk send.
- A recipient email is malformed: confirmation is blocked until the recipient is corrected or the opportunity is removed from the batch.
- Company name, job title, author name, keywords, source link, resume name, operator name, or operator email is missing: previews show visible fallback text or warnings before approval.
- No active template exists for the selected email purpose: email preparation cannot continue until an active `Full-time` template is available.
- No usable resume exists: the operator can continue without an attachment, but `job_application` confirmation shows a clear warning that no CV will be attached.
- The sending provider is not connected or not authorized: preview remains available, but approval-to-send is blocked with setup guidance.
- The sending provider fails after approval: the send attempt is recorded as failed, the opportunity is not marked as successfully applied, and the error is visible in history.
- The worker or sending processor is unavailable after approval: the request remains pending or failed with a visible status and no silent loss of approval history.
- The same opportunity already has a successful `job_application` send: another application send is blocked, while later contact must use the `job_follow_up` path.
- Bulk sending has partial success: successful recipients remain recorded, failed recipients show errors, and skipped recipients remain unchanged.
- The operator navigates away or cancels before confirmation: no send is created and no opportunity state changes.
- A future `Freelance` template or outreach type exists: it must not appear in `Full-time` job application template selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated `Full-time` templates section for job application and job follow-up email templates.
- **FR-002**: The system MUST keep `Full-time` templates separate from future `Freelance` templates in listing, selection, preview, and history.
- **FR-003**: Users MUST be able to create, list, edit, activate, deactivate, and preview `job_application` and `job_follow_up` templates.
- **FR-004**: Templates MUST support subject and body content with variables for company name, job title, author name, matched keywords, source link, resume name, operator name, and operator email.
- **FR-005**: Template previews MUST show clear fallback text or warnings when structured opportunity, resume, or operator values are missing.
- **FR-006**: The system MUST preserve historical references to templates even after a template is edited or deactivated.
- **FR-007**: Users MUST be able to manage resume records from a user settings page with display name, file identity, file type, availability status, and upload timestamp.
- **FR-008**: New email previews MUST select the most recently uploaded available CV by default when one exists, and users MUST be able to change or remove the selected resume before approval.
- **FR-009**: Email preparation MUST be available from both a job detail action and an eligible job list action.
- **FR-010**: Email preparation MUST require the operator to choose a template, review or change the default resume selection, review recipient, review subject, review body, and see missing-field warnings before approval.
- **FR-011**: Users MUST be able to manually edit the rendered subject and body before confirming a send.
- **FR-012**: The system MUST validate recipient email format before allowing approval for individual or bulk sending.
- **FR-013**: The system MUST require explicit operator confirmation before any real email is sent.
- **FR-013a**: Resume attachments MUST remain optional for all sends, but `job_application` confirmation MUST warn clearly when no resume is attached.
- **FR-014**: The system MUST prevent provider secrets or credentials from being stored in the operator-facing client.
- **FR-015**: Real email sending MUST be performed through Gmail/OAuth in v1 and recorded as a tracked workflow, not treated as a mailto, copy-only action, or local/mock sender.
- **FR-016**: Actual delivery work MUST happen outside the immediate user request so slow, retried, or batch sending cannot block the review interface.
- **FR-017**: The system MUST record send lifecycle events, including queued, sent, failed, skipped duplicate, and skipped missing contact.
- **FR-018**: A successful application send MUST update the related job opportunity to an applied state without overwriting operator notes, source evidence, review status, or unrelated fields.
- **FR-019**: A failed send MUST NOT mark the related job opportunity as successfully applied.
- **FR-020**: The job detail MUST show send history with template used, resume used, recipient, status, provider message reference when available, timestamp, and error when present.
- **FR-021**: The system MUST detect a prior successful `job_application` send for the same job opportunity and block another `job_application` send; later contact MUST use a `job_follow_up` template.
- **FR-022**: Users MUST be able to select multiple eligible `Full-time` job opportunities for a bulk-send preparation flow.
- **FR-023**: Bulk-send preparation MUST show a confirmation summary that separates sendable recipients, missing-email skips, duplicate skips, invalid-recipient blocks, and limit-related blocks.
- **FR-024**: Bulk-send approval MUST enforce conservative recipient limits and create one tracked event per selected recipient outcome.
- **FR-025**: Bulk-send partial failures MUST preserve successful send records, failed send records, skipped records, and unchanged opportunity states for unsent jobs.
- **FR-026**: All visible language in this feature MUST use `Full-time` job application terms such as vacancy, company, recruiter email, application, resume, response, interview, and rejection.
- **FR-027**: The feature MUST NOT expose freelance prospecting actions, Lovable/demo prompts, WhatsApp commercial templates, or Google Maps discovery as part of this workflow.
- **FR-028**: The feature MUST preserve existing opportunity list, detail, review, notes, filters, diagnostics, and capture workflows while adding sending capabilities.

### Key Entities

- **Full-time Email Template**: A reusable email subject and body for job application or job follow-up, scoped to the `Full-time` mode, with active status and supported variables.
- **User Settings**: Operator-owned profile area for managing sender details and uploaded resumes used by `Full-time` email previews.
- **Resume Attachment**: A resume available for application sends, including display metadata, file identity, type, availability, and upload recency used for default selection.
- **Email Draft/Preview**: A reviewed email candidate for one opportunity, containing selected template, selected resume, recipient, rendered subject, rendered body, warnings, and approval state.
- **Send Request**: An explicit operator-approved individual or bulk send action that can be queued, processed, completed, failed, or cancelled.
- **Sending Provider Account**: The operator-authorized Gmail/OAuth account used for v1 real sending, with status visible before approval and provider boundaries that allow later alternatives.
- **Outreach Event**: An immutable history record for an email lifecycle outcome, including recipient, template, resume, provider status, provider reference when available, timestamp, and error details.
- **Job Opportunity**: A captured `Full-time` opportunity that may receive an application send and whose application state can move to applied after successful sending.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The operator can create an active job application template and render a preview with opportunity data in under 2 minutes.
- **SC-002**: For an eligible reviewed job with an email, the operator can prepare, review, edit, confirm, and record an individual application send in under 3 minutes, with or without a resume attached.
- **SC-003**: 100% of real sends require an explicit confirmation action after preview and before delivery.
- **SC-004**: 100% of successful sends create visible history with recipient, template, resume, status, and timestamp.
- **SC-005**: 100% of missing-email and invalid-email opportunities are blocked or skipped before delivery is attempted.
- **SC-006**: Bulk preparation for up to 25 selected opportunities shows sendable, skipped, blocked, and duplicate counts before approval.
- **SC-007**: Partial bulk send failures preserve accurate final status for every selected opportunity, with no successful send lost, no failed send marked as successful, and no duplicate application sent to an already-applied job.
- **SC-008**: No `Freelance`, Google Maps, Lovable/demo, or WhatsApp commercial actions appear in the `Full-time` email preparation and template selection workflow.

## Assumptions

- The operator is the only user for the first version and sends from their own authorized email account.
- The first usable provider path is an operator-owned Gmail/OAuth account; another provider can be added later without changing the user-facing workflow.
- Resume file storage is local-first for the initial version, managed through user settings, with the last uploaded available CV selected by default in new previews.
- Bulk send is a conservative foundation, not full automation; every batch requires human review, confirmation, recipient limits, duplicate checks, and per-recipient tracking.
- Reply inbox synchronization is out of scope for this feature; response, interview, rejection, and follow-up tracking can be extended after send history exists.
- Existing captured `Full-time` opportunities, review statuses, notes, scores, filters, and capture diagnostics remain compatible and must not be removed or reinterpreted.
- Future `Freelance` Google Maps discovery, Lovable prompt generation, demo generation, WhatsApp sending, and freelance templates remain separate future work.
