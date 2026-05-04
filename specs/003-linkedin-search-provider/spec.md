# Feature Specification: LinkedIn Search Provider

**Feature Branch**: `003-linkedin-search-provider`  
**Created**: 2026-04-30  
**Status**: Draft  
**Input**: User description: "Implementar o verdadeiro bot scraper de busca de vagas no LinkedIn para o fluxo Full-time Job."

## Continuity Context

**Roadmap Phase**: Fase 2. Busca de empregos  
**Action Plan Step**: 3. Bot 1 de busca de empregos  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Create the incremental specification for the first real LinkedIn job search collection provider, replacing the current candidate-only skeleton while preserving the local storage, run tracking, and worker-boundary foundation from `specs/002-linkedin-job-bot`.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-04-30

- Q: Which public contact channels should create accepted opportunities in v1? → A: Public email first; explicit LinkedIn DM with the poster profile link may also be accepted.
- Q: What collection sources should v1 support? → A: Automatic LinkedIn publication search plus user-provided URLs or pasted public content for local validation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collect Real Job Candidates (Priority: P1)

As the operator, I want to start a Full-time Job search run using hiring-intent terms plus my configured keywords or the current fallback keywords, so the system collects multiple real LinkedIn job-related publications instead of only processing pre-supplied sample data.

**Why this priority**: This is the main gap between the current skeleton and a useful job search bot. Without real candidate collection, the existing parser, normalizer, storage, and review flow cannot prove value.

**Independent Test**: Start a job search run with known job keywords and verify that the run searches for public LinkedIn publications containing hiring-intent terms and matching keywords, inspects real or user-provided public LinkedIn job content, records each inspected candidate, and never exceeds the configured inspection cap.

**Acceptance Scenarios**:

1. **Given** the operator has configured job keywords, **When** a new run starts, **Then** the system searches LinkedIn publications using hiring-intent terms plus those keywords and records the source query for each candidate.
2. **Given** no custom keywords are configured, **When** a new run starts, **Then** the system searches with hiring-intent terms plus the fallback keywords `reactjs`, `typescript`, `nextjs`, and `nodejs`.
3. **Given** more than 50 potential candidates are available, **When** the run executes, **Then** the system inspects at most 50 candidates and records that the cap was reached.

---

### User Story 2 - Accept Only Contactable Opportunities (Priority: P2)

As the operator, I want only candidates with a public email or useful public contact channel to become saved job opportunities, so my review list contains actionable leads for manual application.

**Why this priority**: The product value depends on finding contactable opportunities, not merely listing generic jobs that cannot be acted on through the planned email workflow.

**Independent Test**: Run the collector against a mixed set of job posts with and without public contact information, then verify only contactable candidates become accepted opportunities while all rejected candidates retain clear outcomes.

**Acceptance Scenarios**:

1. **Given** a candidate contains a public email and relevant keyword evidence, **When** it is processed, **Then** the system saves it as a job opportunity with company, title or headline, description when available, contact, source, query, matched keywords, evidence, and capture time.
2. **Given** a candidate has relevant keywords but no public email or public contact channel, **When** it is processed, **Then** the system records the candidate as rejected for missing contact information and does not create an accepted opportunity.
3. **Given** a candidate explicitly says the poster can be contacted by LinkedIn direct message and a poster profile link is available, **When** no public email is available, **Then** the system may save the candidate as a contactable opportunity using the profile link as the contact channel.
4. **Given** a candidate duplicates an existing accepted opportunity, **When** it is processed, **Then** the system records the duplicate outcome and links the candidate to the existing opportunity where possible.

---

### User Story 3 - Make Collection Failures Visible (Priority: P3)

As the operator, I want blocked, rate-limited, empty, or inaccessible LinkedIn collection attempts to be visible in the run history, so I can trust that the system did not silently fabricate or hide results.

**Why this priority**: Real collection depends on external platform behavior. Visible failure states are necessary before scaling or adding more automation.

**Independent Test**: Run the collector against unavailable, blocked, empty, or invalid LinkedIn sources and verify the run records a clear status, error reason, and zero fabricated accepted opportunities.

**Acceptance Scenarios**:

1. **Given** LinkedIn blocks, limits, or returns no accessible content, **When** a run executes, **Then** the run records the failure or empty result visibly and does not create accepted opportunities.
2. **Given** a user-provided LinkedIn URL or pasted public content is malformed or irrelevant, **When** it is inspected, **Then** the candidate is rejected with a specific reason.
3. **Given** the collector cannot determine enough evidence for a candidate, **When** it is processed, **Then** the candidate is rejected as weak or unsupported instead of being saved.

---

### Edge Cases

- Public LinkedIn content is unavailable, blocked, rate-limited, or requires authentication.
- A LinkedIn publication contains a hiring-intent term but none of the configured or fallback keywords.
- A source contains multiple emails, generic contact forms, or recruiter contact text.
- A source contains both a public email and a LinkedIn direct-message instruction; the public email remains the preferred contact channel.
- A candidate has strong keyword evidence but no public contact channel.
- A candidate has public contact information but weak or unrelated job evidence.
- A candidate appears through multiple keywords, queries, or provided sources.
- A job post lacks company name, title, description, or canonical source link.
- A run starts with no custom keyword configuration.
- A provided source contains non-LinkedIn content or irrelevant copied text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the operator to start a Full-time Job collection run using hiring-intent terms plus configured keywords or the fallback keywords `reactjs`, `typescript`, `nextjs`, and `nodejs`.
- **FR-001a**: System MUST treat `hiring`, `contratando`, and `contratamos` as initial hiring-intent terms for LinkedIn publication search.
- **FR-002**: System MUST collect multiple LinkedIn job-related candidates from public LinkedIn publications that match hiring-intent terms and configured or fallback keywords, without bypassing platform restrictions.
- **FR-002a**: System MUST also support LinkedIn URLs or public content supplied by the user as a local validation and fallback collection source.
- **FR-003**: System MUST inspect no more than 50 candidates in a single run and MUST record whether the inspection cap was reached.
- **FR-004**: System MUST capture, when available, company name, job title or headline, job description, public email, explicit LinkedIn direct-message contact with poster profile link, source link, source query, matched keywords, evidence text, and capture time for each inspected candidate.
- **FR-005**: System MUST process collected candidates through the existing candidate review flow so accepted, rejected, duplicate, missing-contact, weak-match, and failed candidates are represented consistently.
- **FR-006**: System MUST save only contactable job opportunities as accepted opportunities; a contactable opportunity has a public email or an explicit LinkedIn direct-message instruction with the poster profile link available.
- **FR-007**: System MUST persist accepted opportunities with structured fields for company, title or headline, description when available, preferred contact channel, source, query, matched keywords, evidence, job stage, and operator notes.
- **FR-007a**: System MUST prefer public email over LinkedIn direct-message profile contact when both contact channels are found for the same candidate.
- **FR-008**: System MUST record rejected candidates with a clear outcome reason, including at minimum duplicate, missing contact, missing evidence, weak keyword match, inaccessible source, blocked source, empty source, and parse failure.
- **FR-009**: System MUST preserve source traceability for every inspected candidate, including the originating hiring-intent term, keyword, query, or provided source whenever available.
- **FR-010**: System MUST make run status, inspected candidate counts, accepted counts, rejected counts, duplicate counts, cap status, and failure details visible to the operator.
- **FR-011**: System MUST keep long-running collection work outside the user-facing request/response path so starting a run does not require the operator to wait for all collection work to finish.
- **FR-012**: System MUST NOT send email, apply to jobs, parse resumes, rank candidates with AI, build a complete user interface, or collect freelance prospects as part of this feature.
- **FR-013**: System MUST NOT fabricate opportunities when LinkedIn content is unavailable, blocked, rate-limited, empty, malformed, or inaccessible.
- **FR-014**: System MUST support local validation of a complete run, including candidate collection, candidate outcomes, accepted opportunity persistence, deduplication, and visible failure handling.

### Key Entities *(include if feature involves data)*

- **Job Search Run**: A single operator-started Full-time Job collection attempt, including keyword inputs, source inputs, lifecycle status, result counts, cap status, and failure details.
- **Collected LinkedIn Candidate**: A LinkedIn job-related publication, listing, provided URL, or provided public content item inspected during a run, including extracted text, contact signals, hiring-intent term, matched keywords, source metadata, and outcome.
- **Accepted Job Opportunity**: A contactable job opportunity saved for operator review, tied to the `job` lane and containing structured company, role, preferred contact channel, source, keyword, evidence, and review fields.
- **Rejected Candidate Outcome**: The recorded reason an inspected candidate did not become an accepted opportunity, such as missing contact, duplicate, weak match, inaccessible source, blocked source, empty source, or parse failure.
- **Keyword Set**: The operator's configured job search terms or the fallback set used to drive collection and explain candidate matches.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a local validation run with accessible automatic LinkedIn publication results or user-provided LinkedIn job content, the operator can start a run and see final run status, inspected count, accepted count, rejected count, and failure details without manual database inspection.
- **SC-002**: Every run inspects 50 or fewer candidates and clearly indicates whether additional candidates were skipped due to the cap.
- **SC-003**: 100% of accepted opportunities include either a public email or an explicit LinkedIn direct-message instruction with poster profile link, plus source reference, matched keyword evidence, and capture time.
- **SC-004**: 100% of rejected candidates include a specific outcome reason that explains why no accepted opportunity was created.
- **SC-005**: Duplicate candidates from repeated keywords or repeated sources do not create duplicate accepted opportunities during validation.
- **SC-006**: Blocked, empty, inaccessible, or malformed collection attempts produce visible run or candidate failure records and create zero fabricated opportunities.

## Assumptions

- The current local storage, run lifecycle, candidate parsing, normalization, and opportunity review foundation from `specs/002-linkedin-job-bot` remains the base for this feature.
- The first safe collection version should attempt automatic search of public LinkedIn publications using hiring-intent terms plus job keywords, and may also use user-provided LinkedIn URLs and user-provided public page content; it will not bypass login walls, platform restrictions, or access controls.
- If LinkedIn public search is unavailable in a local environment, validation may use user-provided LinkedIn URLs or copied public content while preserving the same run, candidate, and opportunity outcomes.
- The operator is a trusted local user validating the Full-time Job flow before any staging environment exists.
- Email sending, resume attachment, full UI, AI scoring, and freelance prospecting remain planned later and are out of scope for this feature.
