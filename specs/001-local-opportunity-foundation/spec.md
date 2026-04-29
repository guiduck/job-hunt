# Feature Specification: Local Opportunity Foundation

**Feature Branch**: `001-local-opportunity-foundation`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "acho que agora temos td setup pronto e podemos começar o desenvolvimento, se atualize sobre status do projeto e afins no arquivo handoff da documentação, leia bem a constitution que geramos e podemos começar o desenvolvimento com nosso banco de dados, talvez um docker para começo mais rapido localmente... lembre-se de que nosso app nao e so crm de clientes freela, tb servira para buscar por vagas no linkedin e publicacoes no linkedin onde as empresas divulgam seu e-mail e que tenham keywords configuradas do usuario ou extraidas do arquivo do seu curriculo... talvez possamos ter tabs para usar o modo freela e o modo full time job."

## Continuity Context

**Roadmap Phase**: Fase 1. Fundacao operacional  
**Action Plan Step**: 1. Fundacao local and 2. Modelo central de oportunidades  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Create the first development specification for the local opportunity foundation, using the current handoff, constitution, docs, and reference UI images. The foundation must support both freelance client acquisition and full-time job search opportunities, with separate operational lanes but a shared structured opportunity base.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-04-25

- Q: Should the first foundation persist configurable keyword sets, or only store matched keywords on each job opportunity? → A: Persist a minimum keyword input model now, with fallback mock keywords when the user has not configured anything. Default mock keywords include `reactjs`, `typescript`, `nextjs`, `nodejs`, and similar terms that appear in job searches.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a Local Opportunity Workspace (Priority: P1)

As the project operator, I want a local workspace that can persist opportunity records, so I can begin development without losing captured freelance or job-search data between sessions.

**Why this priority**: This is the foundation for every later capability: discovery, review, campaigns, templates, prompts, outreach, and status tracking all depend on reliable local persistence.

**Independent Test**: Can be tested by starting the local workspace, creating representative opportunity records for both lanes, stopping and restarting the workspace, and confirming the records remain available.

**Acceptance Scenarios**:

1. **Given** the local workspace is not running, **When** the operator starts it, **Then** the system provides a usable persistent data environment for development.
2. **Given** representative freelance and job opportunities were saved, **When** the local workspace is restarted, **Then** both opportunity records remain available with their lane-specific context.

---

### User Story 2 - Store Freelance and Job Opportunities Separately but Consistently (Priority: P1)

As the project operator, I want freelance leads and full-time job opportunities to share a consistent base record while preserving their separate meanings, so future screens can show separate tabs without creating two incompatible systems.

**Why this priority**: The constitution requires `freelance` and `job` to be first-class opportunity types. The first data model must support both lanes before any scraper or CRM workflow is built on top.

**Independent Test**: Can be tested by saving one freelance opportunity and one job opportunity, then filtering them by opportunity type and confirming each keeps the fields needed for its own workflow.

**Acceptance Scenarios**:

1. **Given** a freelance client opportunity, **When** it is saved, **Then** it stores business/contact context, niche, location, source evidence, score, temperature, and CRM stage.
2. **Given** a full-time job opportunity, **When** it is saved, **Then** it stores company, role or post headline, source evidence, contact email when present, matched keywords, application status, and operator notes.
3. **Given** both opportunity types exist, **When** the operator requests records by lane, **Then** freelance and job opportunities can be retrieved separately without losing their shared fields.

---

### User Story 3 - Track Manual Review State for Both Lanes (Priority: P2)

As the project operator, I want to mark the state of each opportunity after review, so I can track whether a freelance lead is contacted or converted and whether a job opportunity became an application, response, or interview.

**Why this priority**: The reference UI and current docs show that the system value comes from review and follow-up, not just data capture.

**Independent Test**: Can be tested by updating review status on representative freelance and job opportunities and confirming the state history remains readable.

**Acceptance Scenarios**:

1. **Given** a freelance opportunity is new, **When** the operator marks it as contacted or converted, **Then** the status change is stored and available for future review.
2. **Given** a job opportunity is new, **When** the operator marks it as applied, responded, interview, rejected, or ignored, **Then** the job lane state is stored without reusing misleading freelance-only labels.
3. **Given** an opportunity changes state, **When** the operator views its history, **Then** the system can show the latest state and enough context to understand the change.

---

### User Story 4 - Preserve Search Evidence and Keyword Context (Priority: P2)

As the project operator, I want each opportunity to keep the query, source, and keyword evidence that caused it to be captured, so I can judge quality and improve future search rules.

**Why this priority**: Both the constitution and docs require evidence-backed discovery. Job search especially depends on user-configured keywords and future CV-derived keywords.

**Independent Test**: Can be tested by saving or using a keyword set, saving opportunities with source query, source URL, matched keywords, and notes, then confirming those fields are available for review and filtering.

**Acceptance Scenarios**:

1. **Given** an opportunity was captured from a business search, **When** it is saved, **Then** the system stores the niche, geography, source query, source URL, and evidence that justified capture.
2. **Given** a job opportunity was captured from a job post or LinkedIn publication, **When** it is saved, **Then** the system stores matched keywords and any discovered contact email or application contact.
3. **Given** a future search produces low-quality results, **When** the operator reviews stored opportunities, **Then** the source evidence is available to evaluate what should change.
4. **Given** the operator has not configured keywords yet, **When** job-search context is initialized, **Then** the system provides a default mock keyword set including `reactjs`, `typescript`, `nextjs`, `nodejs`, and similar terms for local development and early testing.

---

### Edge Cases

- If an opportunity has incomplete contact data, it must still be saveable when source evidence is strong enough for later review.
- If the same organization appears in both `freelance` and `job` lanes, the system must allow distinct opportunity records rather than forcing a merge.
- If a job post does not include an email, it must remain trackable as a job opportunity without being treated as an outreach-ready freelance lead.
- If a public LinkedIn post contains an email but no formal job listing, it must still be representable as a job-search opportunity with source evidence.
- If a keyword comes from user configuration now and from CV extraction later, the opportunity must be able to record which keyword matched without depending on the extraction mechanism.
- If the user has not input any keywords, the system must fall back to a clearly marked mock keyword set for development rather than blocking job-search setup.
- If a record is duplicated by name, phone, email, or source URL, the system must leave enough data for future deduplication instead of silently overwriting records.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a local persistent workspace for opportunity data used during development.
- **FR-002**: System MUST store opportunities with an explicit `opportunity_type` that distinguishes `freelance` from `job`.
- **FR-003**: System MUST support shared opportunity fields for name/title, category or niche, geography, source name, source URL, source query, source evidence, score, notes, and timestamps.
- **FR-004**: System MUST support freelance-specific context, including business/contact details, website status, campaign association, demo URL, lead temperature, and CRM stage.
- **FR-005**: System MUST support job-specific context, including company, role or post headline, matched keywords, contact email when available, application URL or source URL, application status, and response/interview tracking state.
- **FR-006**: System MUST allow opportunities from both lanes to be created, listed, filtered by lane, retrieved individually, and updated for manual review state.
- **FR-007**: System MUST preserve search evidence for every saved opportunity so a human can understand why it was captured.
- **FR-008**: System MUST allow operator notes and interaction history to be associated with an opportunity.
- **FR-009**: System MUST provide enough campaign context for freelance discovery rounds and future job search rounds to be grouped and reviewed.
- **FR-010**: System MUST allow a minimum keyword set to be stored for job-search discovery, including name, source, terms, active state, and lane.
- **FR-011**: System MUST provide a default mock keyword set for local development when the user has not configured keywords; the default set MUST be distinguishable from user-provided keywords.
- **FR-012**: System MUST keep long-running discovery and enrichment work out of the request/response path for this foundation.
- **FR-013**: System MUST keep outreach sending out of scope for this feature while preserving fields needed for future human-reviewed outreach.
- **FR-014**: System MUST update `docs/handoff.md` when this feature changes the current project status or next development step.

### Key Entities *(include if feature involves data)*

- **Opportunity**: Shared record representing either a freelance lead or a full-time job opportunity. It carries the lane, title/name, source evidence, score, notes, and review state.
- **Freelance Opportunity Details**: Lane-specific data for client acquisition, including business name, contact channels, website status, demo URL, lead temperature, and CRM stage.
- **Job Opportunity Details**: Lane-specific data for full-time job search, including company, role or post headline, matched keywords, source post or listing, contact email, application status, response state, and interview state.
- **Campaign**: Operational grouping for a search/prospecting round, including market, niche or keyword set, geography, lane, status, and counters.
- **Keyword Set**: User-defined, mock fallback, or future CV-derived terms used to identify relevant job posts, LinkedIn publications, or business-service opportunities. It includes a name, source, lane, active state, and terms.
- **Interaction**: Manual or system-recorded event tied to an opportunity, such as note added, status changed, prompt generated, message drafted, application submitted, response received, or interview scheduled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can start a fresh local workspace and verify persistent opportunity storage in under 10 minutes using documented steps.
- **SC-002**: At least one representative `freelance` opportunity and one representative `job` opportunity can be saved, retrieved, updated, and listed separately by lane.
- **SC-003**: 100% of saved opportunities include an opportunity type, source evidence, and enough context for a human to understand why the record exists.
- **SC-004**: A job opportunity can be tracked through at least these manual states: new, applied, responded, interview, rejected, and ignored.
- **SC-005**: A freelance opportunity can be tracked through at least these manual states: new, contacted, interested, proposal requested, proposal sent, won, lost, and ignored.
- **SC-006**: No future UI tab or filter needs separate storage systems to distinguish `freelance` from `job`; both lanes can be queried from the shared opportunity base.
- **SC-007**: When no user keywords exist, a developer can still initialize job-search context using clearly marked mock keywords such as `reactjs`, `typescript`, `nextjs`, and `nodejs`.
- **SC-008**: The feature handoff clearly states what was completed, what remains next, and which prompt/spec initiated the work.

## Assumptions

- The first implementation increment is backend/data-foundation focused; a full web interface is not part of this feature.
- The local workspace will follow the project decision to use the existing backend stack and local database direction documented in `README.md`, `docs/architecture.md`, and the constitution.
- LinkedIn scraping, CV parsing, automated outreach sending, and full campaign automation are future features; this feature only prepares the data foundation they require.
- The word `lead` may remain in UI or legacy naming for now, but product behavior must treat `freelance` and `job` as first-class opportunity lanes.
- Job opportunities can come from formal job listings or public posts that include relevant keywords, company context, or contact email.
- Mock keywords are for local development and early testing only; user-provided or future CV-derived keywords should replace or augment them when available.
