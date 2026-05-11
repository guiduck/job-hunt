# Feature Specification: Full-time Workflow Fixes

**Feature Branch**: `009-full-time-fixes`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: "Create a focused Full-time fixes specification covering email sanitization, Google primary auth, Search UI region behavior, opportunities pagination, sender profile LinkedIn URL, and item-level AI generation progress."

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time LinkedIn MVP hardening after post-capture AI filters  
**Action Plan Step**: 4. Revisao operacional / 5. Envio de emails para vagas / 5.5. Login de usuario, ownership e prontidao para deploy  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-specify` for focused Full-time fixes after discarding the external job-source spike: sanitize invalid email suffixes, add Google primary auth, move Search region to AI filters only, paginate Jobs/opportunities, add sender LinkedIn URL, and expose per-item progress for long-running AI bulk generation.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-05-08

- Q: When AI bulk generation is still running, when should completed items become reviewable? -> A: Completed items can be reviewed as soon as they finish, while the batch continues.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep Captured Contacts Usable (Priority: P1)

As the Full-time operator, I want captured and manually entered email addresses to be cleaned without corrupting valid addresses, so generated drafts and approved sends use a real recipient instead of strings polluted by LinkedIn parsing artifacts.

**Why this priority**: Outreach depends on valid contact data. Invalid suffixes such as `hashtag` can make an otherwise useful opportunity unusable and can cause avoidable send failures.

**Independent Test**: Can be fully tested by saving captured and manually entered job contacts with normal emails, emails followed by invalid attached text, and unusual but valid email forms, then confirming only the invalid suffixes are removed and invalid addresses remain rejected.

**Acceptance Scenarios**:

1. **Given** a captured job post contains an email with trailing invalid text attached after the domain, **When** the opportunity is stored or prepared for outreach, **Then** the saved recipient email contains only the valid address.
2. **Given** the operator manually edits a recipient email to a valid address, **When** the value is saved, **Then** the exact valid address is preserved.
3. **Given** an email-like value remains invalid after cleanup, **When** the operator tries to save or use it, **Then** the system blocks or flags it with a clear validation state instead of silently accepting it.

---

### User Story 2 - Sign In With Google Without Granting Send Access (Priority: P1)

As the Full-time operator, I want to log in or create my account with Google, while understanding that Gmail sending still requires a separate provider connection, so account access is easy but email-send permissions remain explicit.

**Why this priority**: Google sign-in reduces login friction, but conflating it with Gmail send OAuth creates a security and trust risk.

**Independent Test**: Can be fully tested by signing up and logging in with a Google account, verifying the local user session starts, then confirming Gmail send remains disconnected until the Settings connection flow is completed.

**Acceptance Scenarios**:

1. **Given** an unauthenticated operator is on the login screen, **When** they choose `Login with Google` and Google confirms their identity, **Then** they are logged into the extension as the matching local user.
2. **Given** an unauthenticated operator is on the registration screen, **When** they choose `Sign up with Google` or `Cadastrar com Google`, **Then** a local user is created or linked using the Google account identity and email.
3. **Given** an operator signs in with Google for primary authentication, **When** they open Settings, **Then** Gmail send access is still shown as disconnected unless the Gmail provider connection was previously completed.
4. **Given** an operator already has a local account with the same verified email, **When** they complete Google sign-in, **Then** the account is linked without creating a duplicate operator profile.

---

### User Story 3 - Search Broadly and Apply Region Only in AI Filters (Priority: P1)

As the Full-time operator, I want LinkedIn Search to capture broadly by text and sort order while region preferences live only in optional AI filters, so unreliable search-region behavior does not hide useful posts before review.

**Why this priority**: The current publication search path does not reliably honor region. Region should inform optional post-capture evaluation, not the base capture path.

**Independent Test**: Can be fully tested by starting searches with AI filters disabled and enabled, confirming the base search is not narrowed by region when filters are off and region preferences are considered only when AI filters are on.

**Acceptance Scenarios**:

1. **Given** AI filters are disabled, **When** the operator starts a LinkedIn Search, **Then** region preferences are not sent or applied as part of the base search.
2. **Given** AI filters are enabled and region preferences are filled, **When** captured candidates are evaluated, **Then** region is considered as part of the optional post-capture AI review.
3. **Given** AI filters are disabled after previously being enabled, **When** a new search starts, **Then** prior region preferences do not affect capture or candidate acceptance.
4. **Given** captured candidates include AI review details that cannot be displayed in full, **When** the Search feedback refreshes, **Then** the operator still sees run-level progress and accepted/rejected/duplicate counters rather than a reset or zeroed state.

---

### User Story 4 - Review Hundreds of Jobs Without a Heavy Popup (Priority: P1)

As the Full-time operator, I want the Jobs list to load opportunities in pages of 50 while preserving my filters and sort, so the popup stays responsive even when I have hundreds of saved opportunities.

**Why this priority**: The current list can become heavy with large opportunity counts, which slows daily review and increases the chance of accidental bulk actions.

**Independent Test**: Can be fully tested with more than 100 matching opportunities by navigating next and previous pages, changing filters/search/sort, and confirming the displayed results and counts remain consistent.

**Acceptance Scenarios**:

1. **Given** more than 50 opportunities match the current filters, **When** the operator opens Jobs, **Then** only the first page is listed by default and pagination controls show that more results are available.
2. **Given** the operator applies filters, search text, or sorting, **When** they navigate pages, **Then** those criteria remain applied across next and previous navigation.
3. **Given** the operator changes a filter or search term, **When** the result set changes, **Then** the page position resets to a valid page and does not show an empty page while matching opportunities exist.
4. **Given** the operator selects `All listed`, **When** they perform a bulk action, **Then** the selection applies only to the visible opportunities on the current filtered page.

---

### User Story 5 - Include Sender LinkedIn in Generated Messages (Priority: P2)

As the Full-time operator, I want my sender profile to include my LinkedIn URL, so AI-generated application emails can reference my professional profile when it strengthens the message.

**Why this priority**: The operator's LinkedIn profile is a useful credibility signal for job outreach and belongs with sender identity alongside name, email, and portfolio URL.

**Independent Test**: Can be fully tested by saving a sender profile LinkedIn URL, generating previews for selected opportunities, and confirming the profile can appear in the generation context while remaining owner-scoped.

**Acceptance Scenarios**:

1. **Given** the operator opens sender profile settings, **When** they add a valid LinkedIn URL and save, **Then** the URL is stored with that operator's profile.
2. **Given** the operator generates an AI email preview, **When** a sender LinkedIn URL is available, **Then** the generated context can reference it when appropriate for the opportunity and template.
3. **Given** no sender LinkedIn URL is saved, **When** an AI email is generated, **Then** generation continues without inventing or exposing a LinkedIn profile.
4. **Given** two different operators use the system, **When** each views or uses sender profile settings, **Then** neither can see or use the other's LinkedIn URL.

---

### User Story 6 - See Per-Item AI Generation Progress (Priority: P2)

As the Full-time operator, I want each selected opportunity in a long AI bulk generation batch to show its own progress state, so I know which messages are queued, running, completed, failed, or skipped before I review and send anything.

**Why this priority**: Long-running generation currently leaves the operator blind until the full batch returns. Per-item progress makes batches safer and easier to recover from.

**Independent Test**: Can be fully tested by starting a bulk generation for multiple selected opportunities, watching individual statuses change, confirming completed items become reviewable before the whole batch finishes, and confirming failed or skipped items remain visible with reasons.

**Acceptance Scenarios**:

1. **Given** the operator starts AI generation for multiple selected opportunities, **When** the batch begins, **Then** each selected opportunity receives an initial visible status such as queued.
2. **Given** generation is in progress, **When** individual items start or finish processing, **Then** their visible statuses update independently.
3. **Given** an item cannot be generated because of missing required data or another recoverable condition, **When** the batch completes or continues, **Then** that item is marked failed or skipped with a human-readable reason.
4. **Given** some items complete successfully and others fail or are skipped, **When** the operator reviews the batch, **Then** only completed draft content is available for human review and no email is sent automatically.
5. **Given** a bulk generation batch is still processing, **When** one selected opportunity reaches completed status, **Then** the operator can review that completed item's generated content without waiting for the remaining items to finish.

### Edge Cases

- Captured text may include punctuation, hashtags, URL fragments, or social text immediately after an email; cleanup must remove only invalid suffixes and preserve valid email characters.
- Some valid addresses may use plus tags, subdomains, hyphens, or multiple domain labels; cleanup must not normalize them into a different address.
- A Google account email may already belong to a password-based local user; linking must avoid duplicate accounts and preserve existing owner-scoped data.
- A Google sign-in may succeed while Gmail send is disconnected; the operator must still be able to use non-send parts of the app and see a separate Gmail connection prompt only where sending is needed.
- Paginated data may shrink after delete, filter change, dedupe, or status update; navigation must remain on a valid page and never imply hidden selected items are still selected.
- Bulk delete, bulk preview, and bulk send actions must make clear whether they apply to current visible page items or explicitly selected items.
- Region preferences saved from older popup state must not continue to affect base LinkedIn search after this feature.
- Search feedback must remain useful when secondary candidate or opportunity detail loading fails; run-level counters should remain visible instead of being replaced by zeros.
- AI filter signal values may be composite or broader than expected, such as mixed work modes; candidate serialization and Search feedback must tolerate them without hiding run progress.
- Captured posts may be approved by AI but still rejected as duplicates; dedupe must avoid collapsing distinct posts from the same recruiter email when company and title extraction are empty.
- AI bulk generation may be partially complete when the popup closes or refreshes; progress must be recoverable enough for the operator to resume review without duplicate generation surprises.
- Sender profile LinkedIn URL may be missing, invalid, or not a LinkedIn URL; the operator must get clear validation and AI generation must not fabricate a substitute.
- Discarded external job-source data or local migration placeholders may exist in development databases; this feature must not depend on or revive that source.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST sanitize email addresses captured from LinkedIn job content before they are saved as contact data or used in outreach preparation.
- **FR-002**: The system MUST apply the same email cleanup and validation expectations to manually entered or edited job recipient emails.
- **FR-003**: The system MUST remove invalid trailing text such as `hashtag` when it is attached to an otherwise valid email string.
- **FR-004**: The system MUST preserve valid email addresses, including common plus tags, hyphenated domains, subdomains, and multi-label domains, without over-trimming valid characters.
- **FR-005**: The system MUST reject or clearly flag values that remain invalid after cleanup.
- **FR-006**: The login screen MUST offer `Login with Google` as a primary authentication option alongside existing login paths.
- **FR-007**: The registration screen MUST offer Google registration using copy appropriate to the current language, including `Sign up with Google` or `Cadastrar com Google`.
- **FR-008**: A successful Google authentication MUST create or link a local operator account by Google identity and verified email, then start an authenticated app session for that operator.
- **FR-009**: Google primary authentication MUST NOT grant Gmail send access, create a sending-provider connection, expose Gmail tokens, or imply that email sending is available.
- **FR-010**: Gmail send connection status and consent MUST remain a separate Settings flow that the operator completes before real Gmail sending is available.
- **FR-011**: Base LinkedIn Search behavior MUST use only the operator's search text and sort choice for capture-level search criteria.
- **FR-012**: Region preferences MUST live only inside the optional AI filters area and MUST be sent or evaluated only when AI filters are enabled.
- **FR-013**: Turning AI filters off MUST prevent region preferences from affecting capture, candidate acceptance, or saved opportunity creation.
- **FR-014**: The opportunities list MUST support paginated results with a default page size of 50 opportunities.
- **FR-015**: The Jobs UI MUST provide next and previous page navigation when more matching opportunities exist.
- **FR-016**: Pagination MUST preserve the active mode, filters, search text, sort order, and any relevant owner-scoped view state across page navigation.
- **FR-017**: Selection controls MUST clearly communicate that `All listed` selects only visible opportunities on the current filtered page.
- **FR-018**: Bulk actions MUST operate only on explicitly selected visible items unless a future all-pages flow is separately specified.
- **FR-019**: Sender profile settings MUST include an owner-scoped `LinkedIn URL` field alongside sender name, sender email, and portfolio URL.
- **FR-020**: Sender profile LinkedIn URL validation MUST accept valid LinkedIn profile URLs and clearly reject unsupported or malformed values.
- **FR-021**: AI email generation MUST include the operator's sender LinkedIn URL in the available generation context when a valid URL exists.
- **FR-022**: AI email generation MUST remain useful when the sender LinkedIn URL is missing and MUST NOT invent profile links.
- **FR-023**: Bulk AI generation MUST expose item-level progress for each selected opportunity using statuses equivalent to queued, running, completed, failed, and skipped.
- **FR-024**: Each failed or skipped AI generation item MUST include a reason that is understandable to the operator.
- **FR-025**: Completed AI generation items MUST become available for operator review as soon as each item completes, even when the rest of the batch is still queued or running.
- **FR-026**: Completed AI generation items MUST remain subject to human review and approval before any send request is created.
- **FR-027**: The feature MUST NOT expose model provider secrets, OAuth client secrets, Gmail tokens, or hidden send permissions to the extension.
- **FR-028**: The feature MUST NOT reintroduce the discarded external job-source provider, dedicated UI, configuration, metrics, or email discovery pipeline.
- **FR-029**: Search capture feedback MUST keep showing run-level counters and status when secondary candidate or opportunity details cannot be loaded.
- **FR-030**: Candidate AI filter signals MUST tolerate composite or unexpected-but-readable work mode values without preventing the operator from seeing run progress.
- **FR-031**: Opportunity deduplication MUST use company and title as primary identity when available, and MUST use source URL as a fallback discriminator when company and title are missing.
- **FR-032**: Opportunity deduplication MUST NOT treat different source posts from the same recruiter email and same matched keywords as duplicates when no company or title was extracted.

### Key Entities *(include if feature involves data)*

- **Operator Account**: The owner identity for app sessions and data. It may be password-based, Google-authenticated, or linked to both, but it remains one owner-scoped account.
- **Google Identity Link**: The association between a verified Google account identity and a local operator account for primary app authentication. It does not represent Gmail send permission.
- **Gmail Sending Connection**: A separate operator-granted provider connection used only for approved Gmail sending. It remains disconnected until the operator completes the send-provider consent flow.
- **Opportunity Page**: A page of up to 50 matching Full-time opportunities plus navigation metadata, filtered and sorted for the current operator.
- **Visible Selection**: The current set of selected opportunities on the displayed filtered page. It does not imply selection across hidden pages.
- **Sender Profile**: Owner-scoped settings used to personalize generated messages, including sender name, sender email, portfolio URL, and LinkedIn URL.
- **AI Generation Batch Item**: One selected opportunity within a bulk generation request, with its own progress status, optional generated content, and failure or skip reason.
- **AI Filter Region Preference**: Optional region criteria used only by post-capture AI filters when enabled, never by the base LinkedIn capture query.
- **Dedupe Identity**: The user-visible identity used to decide whether an approved candidate is a new opportunity or a duplicate of an existing opportunity. It prioritizes company and title when present and falls back to source-specific evidence when those fields are missing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of captured email strings with known invalid trailing suffix patterns in validation samples are cleaned into valid recipient emails without manual editing.
- **SC-002**: 100% of validation samples containing normal valid email addresses, including plus tags and subdomains, are preserved without destructive trimming.
- **SC-003**: A new or returning operator can complete Google sign-in and reach the authenticated extension experience in under 2 minutes.
- **SC-004**: 100% of Google-authenticated sessions without a completed Gmail sending connection show Gmail send as disconnected or unavailable until the separate provider flow is completed.
- **SC-005**: In searches with AI filters disabled, 0 region preferences affect base capture behavior or candidate acceptance.
- **SC-006**: In validation runs where candidate detail loading fails but run status is available, the Search feedback still displays nonzero inspected/accepted/rejected/duplicate counters within one refresh cycle.
- **SC-007**: Jobs list interactions remain responsive for at least 500 saved Full-time opportunities, with the default view displaying no more than 50 opportunity cards at once.
- **SC-008**: Operators can navigate next and previous pages while preserving filters/search/sort with no more than one corrective action after changing criteria.
- **SC-009**: In pagination usability checks, operators can correctly identify that `All listed` applies to the visible page in at least 90% of attempts.
- **SC-010**: 100% of saved sender profile LinkedIn URLs remain visible only to the owning operator and are available to generated email previews for that operator.
- **SC-011**: During a bulk AI generation of at least 25 selected opportunities, each item shows a terminal completed, failed, or skipped state without requiring the operator to wait for a single opaque batch result.
- **SC-012**: During a bulk AI generation where at least one item completes before the full batch finishes, the operator can open and review that completed item's generated content before the remaining items reach a terminal state.
- **SC-013**: In validation samples with different source posts sharing the same recruiter email and matched keywords but missing company/title, approved candidates are not all collapsed into one duplicate opportunity.

## Non-Goals

- Reintroducing any discarded external job-source provider, source-specific UI, configuration, metrics, or enrichment pipeline.
- Adding all-pages selection or bulk actions across every page of a filtered result set.
- Automatically sending emails after AI generation or bypassing operator review.
- Granting Gmail send access as a side effect of Google primary authentication.
- Building the future Next.js web app or the Freelance Google Maps workflow.
- Changing the product distinction between `job` and `freelance` lanes.
- Replacing existing templates, resumes, Gmail send history, or AI filter diagnostics with a new workflow.

## Assumptions

- The feature targets the existing Full-time Plasmo extension workflow and owner-scoped backend data.
- LinkedIn remains the only active job discovery source for this pass.
- Search region is unreliable as a base LinkedIn publication search control and is useful only as optional post-capture AI review context.
- Default pagination size is 50 opportunities per page; other page sizes are not required for this focused pass.
- Selection semantics remain page-scoped unless a future specification introduces an explicit all-pages selection flow.
- Google primary authentication uses verified Google identity and email for account creation or linking, while Gmail send OAuth remains a separate provider authorization.
- Long-running AI generation should provide durable enough progress visibility that closing or refreshing the popup does not leave the operator blind.
- Existing human-reviewed outreach rules remain in force: generated messages are drafts/previews until the operator explicitly approves sending.
