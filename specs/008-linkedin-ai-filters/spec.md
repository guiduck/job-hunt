# Feature Specification: LinkedIn AI Filters

**Feature Branch**: `008-linkedin-ai-filters`  
**Created**: 2026-05-05  
**Status**: Draft  
**Input**: User description: "Refactor the Plasmo extension Search flow so LinkedIn search stays simple and optional AI filters evaluate captured job posts after collection."

## Continuity Context

**Roadmap Phase**: Fase 3. Revisao e envio para vagas  
**Action Plan Step**: 4. Revisao operacional / 6. Tracking e feedback loop de emprego  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Use `docs/next-spec-prompt.md` with `/speckit-specify` to create the spec for LinkedIn search simplification and optional post-capture AI filters for captured job posts.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-05-05

- Q: When AI filters cannot confidently decide because AI is disabled, missing, unavailable, rate-limited, or invalid, what should happen to otherwise valid candidates? → A: Fallback to current deterministic/local filtering and allow candidates to continue if they pass existing rules.
- Q: Should AI filters be enabled by default for new searches? → A: Disabled by default for new searches; the user must enable AI filters explicitly.
- Q: What confidence threshold should trigger fallback instead of trusting an AI pass/reject decision? → A: Confidence below 0.70 records fallback and uses deterministic/local rules.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start A Broad LinkedIn Search (Priority: P1)

As a Full-time operator using the browser extension, I can start a LinkedIn search with only a text query and sort order, so capture stays broad and does not depend on unreliable advanced search behavior.

**Why this priority**: The current search flow can hide useful posts before the product has enough captured context to judge them.

**Independent Test**: Can be fully tested by starting a search with a broad text query and sort order, confirming the search starts without remote, region, or keyword exclusion fields changing the LinkedIn search itself.

**Acceptance Scenarios**:

1. **Given** the operator opens Search, **When** they view the LinkedIn search section, **Then** it contains only the free-text search input and a sort choice between recent and relevant.
2. **Given** the operator enters `hiring typescript` and selects recent, **When** they start capture, **Then** the opened LinkedIn search uses that query and sort order without appending AI filter criteria to the LinkedIn search text.
3. **Given** existing runs created before this change, **When** the operator views their search or run history, **Then** the runs still render without requiring AI filter fields.

---

### User Story 2 - Filter Captured Posts With Optional AI Review (Priority: P2)

As a Full-time operator, I can enable optional AI filters before capture so each captured post is evaluated after collection for work mode, accepted regions, excluded regions, and excluded keywords before it becomes an accepted opportunity.

**Why this priority**: Post-capture evaluation lets the system use the actual captured evidence, not only brittle search syntax, to reduce false positives.

**Independent Test**: Can be fully tested by enabling AI filters for remote-only and excluded regions, capturing a mixed sample, and confirming accepted and rejected candidates include filter status, reason, and confidence.

**Acceptance Scenarios**:

1. **Given** AI filters are enabled with remote-only and an excluded region, **When** captured posts are evaluated, **Then** posts that clearly require onsite, hybrid, presential, or excluded-region work are rejected before becoming accepted opportunities.
2. **Given** a captured post passes the selected filters, **When** evaluation completes, **Then** the post can continue into the existing opportunity review flow with its captured evidence preserved.
3. **Given** a captured post is rejected by AI filters, **When** the operator inspects the run candidates, **Then** the rejected candidate includes a human-readable reason, confidence value, and normalized filter signals.
4. **Given** AI filters are disabled, **When** capture runs, **Then** the workflow preserves the current deterministic/local filtering behavior as much as practical and does not require AI evaluation.

---

### User Story 3 - Understand Run Outcomes And Fallbacks (Priority: P3)

As a Full-time operator, I can see how many captured candidates were inspected, accepted, rejected by AI filters, skipped as duplicates, or failed, so I can diagnose search quality and false positives without losing evidence.

**Why this priority**: AI-based filtering is only useful if the operator can audit why candidates passed or failed and recover from missing configuration or model failures.

**Independent Test**: Can be fully tested by running captures that include pass, reject, duplicate, disabled-AI, and failed-evaluation cases, then checking the run counters and candidate details.

**Acceptance Scenarios**:

1. **Given** AI configuration is missing, disabled, rate-limited, or returns invalid structured output, **When** candidates are evaluated, **Then** capture does not crash and each affected candidate records fallback or failed status with a reason.
2. **Given** a run includes accepted, rejected, duplicate, and failed candidates, **When** the operator views run diagnostics, **Then** the counters distinguish inspected, accepted, AI-rejected, duplicate, and failed outcomes.
3. **Given** a candidate is rejected by AI filters, **When** the operator later inspects it, **Then** the original captured evidence remains available for debugging false positives and false negatives.
4. **Given** one authenticated user owns a run, **When** another user attempts to inspect or filter that run or its candidates, **Then** access is denied and no candidate data is exposed.

### Edge Cases

- AI filters are enabled, but no AI provider credentials are configured.
- AI filters are enabled, but the provider is temporarily unavailable, rate-limited, or returns invalid structured output.
- A captured post has no job description beyond the visible post evidence.
- A captured post uses ambiguous work-mode language such as "remote-friendly", "hybrid optional", or "must be near office".
- A captured post mentions multiple countries, time zones, or relocation options.
- Accepted and excluded regions overlap in the operator's filter settings.
- An excluded keyword appears in a non-disqualifying context, such as "not onsite" or "no relocation".
- A post is a duplicate of an existing opportunity but would otherwise pass the AI filter.
- Existing runs and candidates do not have AI filter fields.
- A user attempts to inspect, reprocess, or view candidates from another user's run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Search experience MUST separate LinkedIn search inputs from AI filter inputs.
- **FR-002**: The LinkedIn search section MUST allow only free-text query/keywords and sort order choices of recent or relevant.
- **FR-003**: The system MUST keep LinkedIn capture broad by using only the search text and sort order to start the LinkedIn search and capture visible posts.
- **FR-004**: The Search experience MUST provide an optional AI filters section that the user can enable or disable before starting capture.
- **FR-004a**: AI filters MUST be disabled by default for new searches and MUST require explicit user enablement before they affect candidate evaluation.
- **FR-005**: AI filters MUST support remote-only preference, exclusion of onsite/hybrid/presential roles, target or accepted regions, excluded regions, and excluded keywords.
- **FR-006**: When AI filters are enabled, every captured candidate MUST be evaluated after capture and before it becomes an accepted opportunity, unless it is skipped for an earlier deterministic reason such as duplication.
- **FR-007**: Candidate evaluation MUST consider captured post evidence, title or headline, available job description, source link, contact context, and the user's selected filter settings.
- **FR-008**: Each evaluated candidate MUST record whether it passes the AI filter.
- **FR-009**: Each evaluated candidate MUST record an AI filter status of passed, rejected, fallback, failed, or skipped.
- **FR-010**: Each evaluated candidate MUST record a human-readable filter reason.
- **FR-011**: Each evaluated candidate MUST record a confidence value for the filter decision when a decision is made.
- **FR-011a**: AI filter decisions with confidence below 0.70 MUST record fallback status and use deterministic/local rules instead of trusting the AI pass/reject decision.
- **FR-012**: Each evaluated candidate SHOULD record normalized signals for detected work mode, accepted regions, accepted countries, accepted time zones, rejected regions, and matched exclusion keywords when those signals can be inferred.
- **FR-013**: Rejected candidates MUST retain enough captured evidence and decision data to debug false positives and false negatives.
- **FR-014**: Candidates that pass AI filters MUST continue into the existing accepted opportunity review flow without removing existing opportunity fields or review behavior.
- **FR-015**: When AI filters are disabled, missing required configuration, rate-limited, unavailable, invalid, or not confident enough to decide, the system MUST preserve deterministic/local fallback behavior, avoid crashing capture, and allow otherwise valid candidates to continue when they pass existing rules.
- **FR-016**: Existing run creation, candidate listing, opportunity listing, extension authentication, and current session behavior MUST remain compatible.
- **FR-017**: Existing public field names MUST be preserved unless new optional fields are added.
- **FR-018**: Existing runs and candidates without AI filter data MUST still render and remain inspectable by their owner.
- **FR-019**: Run diagnostics MUST expose counts for inspected candidates, accepted candidates, candidates rejected by AI filters, duplicates, and failed evaluations.
- **FR-020**: Users MUST NOT be able to run filters for, inspect candidates from, or view diagnostic details for another user's run.
- **FR-021**: AI provider credentials and model configuration MUST remain outside the browser extension and MUST NOT be sent to or stored by the extension.
- **FR-022**: The feature MUST NOT remove existing deterministic filters until equivalent fallback behavior and validation coverage exist.

### Key Entities *(include if feature involves data)*

- **Search Configuration**: The operator's search input for a capture run, including text query, sort order, whether AI filters are enabled, and selected filter preferences.
- **AI Filter Settings**: Optional post-capture criteria for remote-only preference, work-mode exclusions, accepted regions, excluded regions, and excluded keywords.
- **Captured Candidate**: A collected LinkedIn post or job candidate with source evidence, title/headline, description when available, source link, contact context, ownership, and processing status.
- **AI Filter Decision**: The candidate-level outcome containing pass/fail decision, status, reason, confidence, and normalized signals.
- **Search Run Diagnostics**: The run-level summary of inspected, accepted, rejected, duplicate, skipped, fallback, and failed candidate outcomes.
- **Accepted Opportunity**: A candidate that passed required evaluation and continues into the existing Full-time opportunity review and outreach workflow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new searches can be started with only a text query and sort order before any optional filters are configured.
- **SC-002**: In a mixed manual test sample of at least 20 captured posts, every candidate receives one of the defined AI filter statuses when AI filters are enabled.
- **SC-003**: 95% of clearly onsite, hybrid, presential, or excluded-region posts in the manual sample are rejected when matching AI filters are enabled.
- **SC-004**: 100% of rejected candidates retain source evidence plus a readable reason and confidence or fallback/failed explanation.
- **SC-005**: 100% of missing-configuration, unavailable-provider, rate-limit, invalid-output, and confidence-below-0.70 cases complete without crashing the capture run and fall back to existing deterministic/local rules.
- **SC-006**: Existing runs created before this feature render without errors in run and candidate views.
- **SC-007**: Two-user ownership tests prevent cross-user run or candidate inspection in 100% of direct access attempts.
- **SC-008**: Run diagnostics show inspected, accepted, AI-rejected, duplicate, and failed counts for every completed capture run.

## Assumptions

- The current active product lane is `Full-time`; the future `Freelance` lane is not part of this feature.
- The browser extension remains the primary local-first operator interface for this workflow.
- AI filtering is optional and should improve search quality without becoming a hard dependency for capture.
- AI provider credentials remain server-side operational configuration and are never exposed to the extension.
- Existing deterministic parsing, scoring, deduplication, ownership, opportunity review, and outreach flows remain in place.
- Rejected candidates remain useful operational records for diagnostics even when they do not become accepted opportunities.
- Existing run and candidate contracts can evolve through additive optional fields.
