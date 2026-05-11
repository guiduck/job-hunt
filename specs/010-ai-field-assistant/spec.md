# Feature Specification: AI Field Assistant

**Feature Branch**: `010-ai-field-assistant`  
**Created**: 2026-05-09  
**Status**: Draft  
**Input**: User description: "Create an AI Field Assistant in the Full-time extension that detects external job application text fields, offers a magic-wand control for AI-generated resume/profile-based answers, reuses up to 3 recent responses per keyword, replaces the awkward Keep open behavior with a persistent extension shell, and hides unauthenticated app navigation."

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time review, sending, and post-capture intelligence  
**Action Plan Step**: Add an in-browser productivity layer for real application forms before returning to durable async AI generation/post-send hardening  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `docs/next-spec-prompt.md`

This feature extends the current Full-time LinkedIn workflow without changing the active discovery source. It helps the operator answer external application form questions faster, while preserving human review, Google primary auth separation from Gmail OAuth, trusted-server-only model access, owner-scoped data, and the current popup state/capture behavior.

## Clarifications

### Session 2026-05-09

- Q: How should the assistant decide which external sites/domains it is active on? -> A: The assistant is disabled by default for external domains; the operator can enable it for the current tab/domain from the extension, and manage enabled domains in Settings.
- Q: When should generated field answers be saved as reusable keyword responses? -> A: Generated or edited answers are saved only when the operator explicitly chooses to save them.
- Q: Should enabling the assistant apply to the exact page or a broader site scope? -> A: Enabling uses the base domain by default so subpaths are covered automatically, with an optional exact-page mode for cases where the operator wants a narrower activation.
- Q: Should the current Keep open behavior remain alongside the persistent assistant shell? -> A: Replace Keep open for authenticated users with the persistent assistant shell; do not keep both primary flows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate an answer in an application field (Priority: P1)

As an authenticated Full-time operator filling an external job application, I want a small magic-wand action to appear on eligible long-answer fields so I can generate a tailored response from my resume/profile and insert it only after reviewing it.

**Why this priority**: This is the core user value: reducing repetitive form-filling time while keeping the operator in control.

**Independent Test**: Can be tested by opening a supported application form with a visible long-answer question, generating an answer from the field action, reviewing it, and inserting it into the chosen field without submitting the form.

**Acceptance Scenarios**:

1. **Given** the operator is authenticated and a visible long-answer field asks about motivation, **When** the field becomes active or visible, **Then** the assistant shows a compact magic-wand action anchored to that field.
2. **Given** the operator opens the field assistant menu, **When** they choose to generate an answer, **Then** the system creates a relevant draft response using their saved professional context and shows it for review before insertion.
3. **Given** a generated response is visible for review, **When** the operator confirms insertion, **Then** the answer is inserted into the original field and the external form is not submitted automatically.
4. **Given** the operator dismisses the menu or cancels generation, **When** they continue typing manually, **Then** the field content remains unchanged.

---

### User Story 2 - Reuse recent answers by keyword (Priority: P2)

As an authenticated operator, I want the field assistant to recognize common application question types and offer recent answers for that keyword so I can reuse or adapt good responses without regenerating every time.

**Why this priority**: Reuse compounds the time savings and reduces unnecessary AI generation for repeated questions.

**Independent Test**: Can be tested by saving or using responses for a detected keyword, returning to another field with the same keyword, and confirming that no more than 3 relevant recent responses are available for reuse.

**Acceptance Scenarios**:

1. **Given** the operator has prior responses for the keyword "motivation", **When** they open the assistant on another motivation-style field, **Then** the menu lists up to 3 recent or useful responses for that keyword.
2. **Given** more than 3 responses exist for the same operator and keyword over time, **When** a new response is saved or used, **Then** only the latest or most useful 3 responses remain available for that keyword.
3. **Given** the detected keyword has low confidence, **When** the menu opens, **Then** the operator can still generate a general answer or provide a manual keyword before saving a reusable response.
4. **Given** a reusable answer is selected, **When** the operator chooses insert, replace, or append where available, **Then** the chosen text is applied only to the active field after explicit action.
5. **Given** a generated or edited answer is inserted into a field, **When** the operator does not choose to save it, **Then** it is not stored as a reusable response for that keyword.

---

### User Story 3 - Keep the assistant available during long application sessions (Priority: P3)

As an operator working through multi-step application forms, I want a persistent, minimizable extension shell so the assistant remains available even when the normal popup would close.

**Why this priority**: The current Keep open action is awkward and does not match the real application flow, where the user clicks between page fields and extension controls.

**Independent Test**: Can be tested by opening the assistant shell from the extension, clicking outside the popup into the page, minimizing/restoring the shell, and confirming the active session and assistant state remain available.

**Acceptance Scenarios**:

1. **Given** the operator is authenticated, **When** they open the persistent assistant shell, **Then** a compact, non-blocking UI remains available on the current tab after popup focus is lost.
2. **Given** the persistent shell is open, **When** the operator minimizes it, **Then** it becomes a small affordance that can be restored without losing current state.
3. **Given** the persistent shell is open on a page with eligible fields, **When** the operator uses a field action, **Then** generation status and recent response choices are reflected without requiring the native popup to stay open.
4. **Given** the operator closes the shell, **When** they continue using the page, **Then** no assistant UI remains on top of page content until reopened.
5. **Given** the current site is not enabled for the assistant, **When** the operator opens the extension on that site, **Then** they can explicitly enable the field assistant for the current domain.
6. **Given** the operator wants the assistant only on one specific page, **When** they choose exact-page activation, **Then** the assistant remains inactive on other pages from the same domain unless separately enabled.
7. **Given** the operator is authenticated, **When** they need the extension to remain available while using the page, **Then** the persistent shell is the primary path instead of the old Keep open window.

---

### User Story 4 - Authenticated-only extension experience (Priority: P4)

As an unauthenticated visitor, I should only see login, registration, and reset flows, so operational navigation and product controls are not visible before there is a valid session.

**Why this priority**: It removes confusing unauthenticated UI and makes auth boundaries clearer before expanding the extension into external pages.

**Independent Test**: Can be tested by clearing the session and opening the extension, then confirming only auth flows are visible and the field assistant does not appear on external pages.

**Acceptance Scenarios**:

1. **Given** there is no valid session, **When** the extension UI opens, **Then** the Opportunity Desk title, tab navigation, and operational actions are hidden.
2. **Given** there is no valid session, **When** an external application page has eligible fields, **Then** no magic-wand control or assistant shell appears.
3. **Given** the operator successfully logs in, **When** the extension refreshes its session state, **Then** operational navigation and authenticated assistant controls become available.

### Edge Cases

- A page has multiple visible fields with similar labels: each assistant action must stay anchored to its own field and insert only into the field selected by the operator.
- A supported application page is on a domain that has not been enabled by the operator: the assistant must remain inactive until the operator explicitly enables that domain or current tab.
- A site has useful application pages and unrelated account/search/settings pages under the same domain: the operator should be able to choose exact-page activation to avoid broad assistant visibility.
- A field is hidden, disabled, readonly, too short, or not intended for long-form answers: the assistant must not show a generation action.
- A field appears after a page transition or dynamic form step: the assistant should detect it without requiring a full page reload.
- A field is removed while generation is in progress: the result should not be inserted automatically, and the operator should see that the original field is no longer available.
- A field contains sensitive or payment-related signals such as password, OTP, card, document, phone, payment, or short email entry: the assistant must remain disabled.
- A site layout would cause the action to cover typed text or critical controls: the assistant should reposition, collapse, or skip the field.
- The operator is offline, the backend is unavailable, or generation fails: the menu should show a recoverable error and keep manual typing unaffected.
- The saved resume/profile context is missing or incomplete: generation should explain what context is missing and avoid inventing unsupported claims.
- The user signs out while a shell or field menu is open: assistant controls should close or become inactive, and no new page context should be sent.
- The same keyword is detected across different sites: reuse is allowed only within the authenticated owner's saved response history and must not cross users.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST make the field assistant available only to authenticated operators with a valid app session.
- **FR-001a**: The field assistant MUST be disabled by default on external domains and become active only after the operator explicitly enables the current tab/domain.
- **FR-001b**: The operator MUST be able to add the current base domain to the assistant-enabled list from the extension and manage enabled domains in Settings.
- **FR-001c**: The operator SHOULD be able to enable the assistant for the exact current page when they do not want activation to apply across the full base domain.
- **FR-002**: The system MUST detect visible editable fields that are suitable for job application long-form answers, including long text fields and rich editable answer areas.
- **FR-003**: The system MUST ignore sensitive, irrelevant, or unsafe fields, including password, payment, OTP, card, document, phone, short email, search, disabled, readonly, hidden, and unsupported-page fields.
- **FR-004**: The system MUST show a compact magic-wand action for eligible fields without blocking the user's typed text, breaking the host page layout, or relying on browser behaviors that are unreliable for editable controls.
- **FR-005**: The field action MUST open a compact menu with a primary AI generation action and up to 3 saved responses for the detected keyword when available.
- **FR-006**: The system MUST infer a field keyword from safe field metadata and nearby question text, such as labels, accessibility names, placeholder text, field identifiers, surrounding question copy, page context, and known application question categories.
- **FR-007**: The system MUST support common application question categories including motivation, experience, salary, availability, work authorization, English level, technology stack, professional summary, and general fit.
- **FR-008**: The system MUST send only sanitized, minimal field context needed for answer generation and MUST NOT send the full page DOM or unrelated page content.
- **FR-009**: AI-generated answers MUST be grounded in the authenticated owner's saved professional context, including resume/profile information, sender profile, portfolio URL, LinkedIn URL, and relevant template hints when available.
- **FR-010**: Model credentials, provider secrets, OAuth tokens, prompt secrets, and full resume file contents MUST NOT be exposed to browser-visible surfaces or external pages.
- **FR-011**: Generated answers MUST be shown for operator review before insertion.
- **FR-012**: The system MUST insert, replace, or append text only after an explicit operator action and MUST never submit an external application form automatically.
- **FR-013**: The operator MUST be able to reuse a saved response from the menu and apply it to the active field after review or explicit selection.
- **FR-014**: The operator SHOULD be able to edit a generated or reused answer before final insertion when the review surface is shown.
- **FR-015**: The system MUST store reusable field response suggestions owner-scoped by keyword.
- **FR-015a**: The system MUST save a generated, edited, or inserted answer as a reusable field response only when the operator explicitly chooses to save it.
- **FR-016**: The system MUST keep no more than 3 explicitly saved reusable responses per owner and keyword, using recency or usefulness to decide which responses remain available.
- **FR-017**: The system MUST provide a way to discard a generated answer so it is not saved as a reusable suggestion.
- **FR-018**: The persistent assistant shell MUST provide a non-blocking, minimizable extension surface that can remain available in the active tab after the native popup loses focus.
- **FR-018a**: The persistent assistant shell MUST replace the authenticated Keep open flow as the primary way to keep extension controls available during page work.
- **FR-019**: The persistent shell MUST allow the operator to close or disable the assistant on the current page.
- **FR-020**: The persistent shell MUST preserve the existing Full-time capture, Jobs, templates, settings, Google primary auth, Gmail OAuth/send, and popup state behavior.
- **FR-021**: The unauthenticated extension view MUST hide product title, tab navigation, and operational actions, showing only login, registration, and reset flows.
- **FR-022**: The system MUST keep app Google sign-in separate from Gmail send authorization; using the field assistant MUST NOT imply Gmail send access.
- **FR-023**: The system MUST allow the operator to disable the field assistant when it is distracting or unsupported on the current page.
- **FR-024**: The system MUST make failures visible in the assistant UI without changing page field contents unless the operator explicitly applies text.
- **FR-025**: The feature MUST NOT reintroduce the discarded external job-source provider, email discovery pipeline, or source-specific UI/configuration.

### Key Entities

- **Field Assist Context**: A sanitized description of the active editable field and question, including detected keyword, safe labels/question text, page-level context, and confidence signals.
- **Field Response Suggestion**: An owner-scoped reusable answer associated with a keyword, response text, source, usage metadata, and creation/update timestamps.
- **Assistant Shell State**: The current tab-level presentation state for the persistent assistant, including open, minimized, closed, disabled, active field, generation status, and latest menu state.
- **Generated Field Answer**: A draft answer produced for one field context and owner profile, reviewable before insertion and optionally saved as a reusable suggestion.
- **Professional Context**: Owner-scoped resume/profile/sender data used to ground answers, including name, email, portfolio URL, LinkedIn URL, default resume content, and template hints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a representative application form with 5 eligible long-answer fields, the operator can generate, review, and insert answers for all fields without the extension popup needing to stay focused.
- **SC-002**: At least 90% of eligible long-answer fields in a sample of common application forms show a usable assistant action that does not cover typed text or primary form controls.
- **SC-003**: 100% of sensitive field examples in the validation set, including password, OTP, card, phone, payment, document, and short email fields, do not show an assistant action.
- **SC-004**: For repeated keywords, the assistant shows no more than 3 saved responses per authenticated owner and keyword.
- **SC-005**: 100% of generated or reused answers require explicit operator action before insertion and 0 external forms are submitted by the assistant.
- **SC-006**: 95% of successful generation attempts present a reviewable draft or a reusable answer choice within 10 seconds under normal local development conditions.
- **SC-007**: Unauthenticated users see only auth-related UI in the extension and no field assistant controls on external pages.
- **SC-008**: Operators can disable or close the assistant on a page in one action, and the assistant stays closed or disabled until they explicitly reopen it.

## Non-Goals

- Automatically submitting job applications.
- Filling password, payment, OTP, phone, document, card, or other sensitive fields.
- Scraping full page DOMs or storing arbitrary page content.
- Building a crawler for ATS sites.
- Replacing the existing LinkedIn capture source or adding a new job discovery provider.
- Granting Gmail send permission through app Google sign-in.
- Implementing automatic deletion or archival of old opportunities in this feature.
- Completing durable worker-owned AI bulk generation or post-send feedback hardening in this feature.

## Assumptions

- The target user is the authenticated owner/operator of the Full-time workflow.
- The assistant is intended for browser-based application forms and similar external pages where the operator is actively typing.
- The first version favors safe eligibility and opt-out behavior over appearing on every possible field.
- Only minimal, sanitized field context is needed to generate useful answers.
- Saved response reuse is keyword-based and owner-scoped, not shared across users.
- Keeping 3 responses per owner and keyword is sufficient for v1 and avoids unbounded response growth.
- If a keyword cannot be inferred confidently, a general answer flow is acceptable.
- Existing resume/profile/settings data remains the source of truth for professional context.
- Automatic opportunity retention cleanup is valuable but belongs in a later data-retention specification.
