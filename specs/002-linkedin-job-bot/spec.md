# Feature Specification: LinkedIn Job Bot Foundation

**Feature Branch**: `002-linkedin-job-bot`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "criar o banco de dados com docker local e começar o esqueleto do bot de buscar vagas no LinkedIn"

## Continuity Context

**Roadmap Phase**: Fase 1. Fundacao operacional, advancing into the prioritized `job` lane  
**Action Plan Step**: 1. Fundacao local, 2. Modelo central de oportunidades, and 3. Bot 1 de busca de empregos  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-specify cirar o banco de dados com docker local e começar o esuqeleto do bot de buscar vagas no linkedin`

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-04-28

- Q: Should the first LinkedIn job bot skeleton store only opportunities with a public contact channel, or all relevant job matches? -> A: Store only LinkedIn job opportunities that include a public email/contact channel.
- Q: What source mode should the first LinkedIn job bot skeleton use? -> A: Attempt automated LinkedIn search in the first skeleton.
- Q: How should the operator start and inspect a LinkedIn job-search run? -> A: API-triggered run with backend status and result inspection.
- Q: What identity rule should deduplicate LinkedIn job opportunities? -> A: Company, job title/headline, matched keywords, and contact channel.
- Q: What candidate volume should the first automated LinkedIn search support per run? -> A: Small validation run up to 50 candidates, with complete structured job details for accepted opportunities.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prepare Local Opportunity Storage (Priority: P1)

As the operator, I want a repeatable local data foundation so captured opportunities can be stored, inspected, reset, and reused while the product is still being built.

**Why this priority**: The job bot is not useful until discovered opportunities can be persisted with source context and reviewed later.

**Independent Test**: Start the local environment from the documented setup, confirm the opportunity store is reachable, save one sample `job` opportunity, retrieve it, and reset the environment without manual repair.

**Acceptance Scenarios**:

1. **Given** a clean development machine with the project checked out, **When** the operator follows the local setup instructions, **Then** a local opportunity store is available for development use.
2. **Given** the local store is running, **When** a sample job opportunity is saved, **Then** the opportunity can be retrieved with `job` type, source link, source query, matched keywords, and evidence.
3. **Given** the operator needs to restart local work, **When** the environment is stopped and started again, **Then** stored records remain available unless an explicit reset command is used.

---

### User Story 2 - Run a LinkedIn Job Search Skeleton (Priority: P2)

As the operator, I want to run the first automated LinkedIn job-search skeleton so the system can prove the end-to-end flow from keywords to stored LinkedIn job opportunities before broader automation is expanded.

**Why this priority**: The current product priority is the `Full-time` lane, and a thin validated bot path reduces risk before adding outreach, UI, or broader scraping.

**Independent Test**: Start an automated LinkedIn job-search run through backend operations, inspect the run status, and verify that accepted candidates are normalized into reviewable `job` opportunities.

**Acceptance Scenarios**:

1. **Given** no custom keywords are configured, **When** the operator starts a job-search run, **Then** the system uses the approved fallback keywords `reactjs`, `typescript`, `nextjs`, and `nodejs`.
2. **Given** custom keywords are configured, **When** the operator starts a job-search run, **Then** the system uses those custom keywords instead of the fallback set.
3. **Given** a LinkedIn job post or listing contains a matching keyword and a public email or contact channel, **When** the skeleton processes it, **Then** the system stores the company, job title or headline, full job description when available, contact channel, source link, matched keyword, and evidence text.
4. **Given** a job-search run has been started, **When** the operator checks run status through backend operations, **Then** the system shows whether the run is pending, running, completed, completed with no accepted opportunities, or failed.
5. **Given** LinkedIn search is unavailable, blocked, or rate-limited, **When** the operator starts a job-search run, **Then** the run ends with a visible failure state and no fabricated opportunities.
6. **Given** a candidate result lacks enough source evidence, **When** the skeleton processes it, **Then** the result is not stored as a reviewable opportunity.

---

### User Story 3 - Review Captured Job Leads Safely (Priority: P3)

As the operator, I want captured LinkedIn job opportunities to be clearly separated from freelance leads so I can review only relevant job leads and prepare future outreach without mixing product modes.

**Why this priority**: Separation between `Full-time` and `Freelance` is a constitution-level product rule and prevents later CRM and outreach confusion.

**Independent Test**: Capture multiple sample job opportunities and confirm they appear as `job` records with job-specific status, evidence, notes, and no freelance-only primary actions.

**Acceptance Scenarios**:

1. **Given** a captured LinkedIn job opportunity, **When** the operator reviews its record, **Then** the record shows job-specific fields including job stage, matched keywords, source evidence, and operator notes.
2. **Given** the same company, job title or headline, matched keywords, and contact channel are found in more than one run, **When** the system evaluates the result, **Then** duplicate review records are avoided or clearly linked to the existing opportunity.
3. **Given** a captured record belongs to the `job` lane, **When** it is listed for review, **Then** it is not mixed with freelance prospects.

### Edge Cases

- LinkedIn content is inaccessible, rate-limited, removed, or otherwise unavailable during a run.
- A post contains relevant keywords but no public email or contact channel, so it is not stored as an accepted review opportunity in this feature.
- A result has an email but weak or missing job relevance.
- A result appears multiple times through different queries or repeated runs.
- The same company appears with multiple public emails or contact channels for different job titles.
- A post mixes recruiter text, company text, and candidate comments, making the actual opportunity ambiguous.
- Local storage is unavailable when a search run completes.
- The operator has not configured keywords yet.
- A search query returns more than 50 candidates, so the run must stop at the validation cap and record that remaining candidates were not inspected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a repeatable local setup that makes the opportunity data store available for development and manual validation.
- **FR-002**: System MUST persist captured opportunities with an explicit `job` opportunity type and must preserve compatibility with the future `freelance` lane.
- **FR-003**: System MUST allow a job-search run to use operator-configured keywords when present.
- **FR-004**: System MUST use fallback keywords `reactjs`, `typescript`, `nextjs`, and `nodejs` when the operator has not configured keywords.
- **FR-004a**: System MUST attempt an automated LinkedIn job search in the first skeleton while respecting public-data and platform-boundary constraints.
- **FR-004b**: System MUST allow the operator to start a LinkedIn job-search run through backend operations and inspect run status and accepted results.
- **FR-004c**: System MUST limit each automated LinkedIn search run to inspecting at most 50 candidates.
- **FR-005**: System MUST capture, for each accepted job opportunity, company name when available, job title or headline, full job description when available, public email or public contact channel, source link, source query, matched keywords, evidence text, capture time, job stage, and operator notes.
- **FR-006**: System MUST reject or mark as incomplete any candidate result that lacks enough source evidence to justify review.
- **FR-006a**: System MUST store as accepted review opportunities only LinkedIn job candidates that include a public email or public contact channel.
- **FR-007**: System MUST avoid creating duplicate review opportunities for the same company, job title or headline, matched keyword set, and public contact channel.
- **FR-008**: System MUST keep long-running discovery work separate from interactive review and data lookup flows.
- **FR-009**: System MUST preserve platform and compliance boundaries by using only public or user-provided data and by recording enough provenance for manual review.
- **FR-010**: System MUST expose a minimal validation path that proves a search run can create reviewable `job` opportunities without requiring the later UI, email sending, or full CRM workflow.
- **FR-011**: System MUST make failures visible to the operator, including inaccessible source content, missing local storage, empty keyword sets, and runs that produce no accepted opportunities.
- **FR-012**: System MUST keep outreach sending, resume parsing, AI scoring, and freelance prospecting outside this feature.

### Key Entities *(include if feature involves data)*

- **Job Opportunity**: A captured LinkedIn job post or listing that is relevant to the operator's profile and includes a public email or public contact channel; includes company, job title or headline, full job description when available, source link, source query, matched keywords, evidence text, job stage, notes, capture timestamp, and a deduplication identity based on company, job title or headline, matched keywords, and contact channel.
- **Keyword Set**: The keywords used to search and filter opportunities; may be operator-configured or the approved fallback set.
- **Search Run**: A single backend-triggered execution of the job-search skeleton; records when it ran, its current status, which keywords were used, the 50-candidate inspection cap, how many candidates were inspected, how many opportunities were accepted, whether the cap was reached, and any run-level errors.
- **Source Evidence**: The quoted or summarized text and link that justify why a candidate was captured for review.
- **Operator Note**: Manual context added during review to support future qualification, outreach, or rejection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer can complete local setup and save a sample `job` opportunity in under 10 minutes using the documented path.
- **SC-002**: 100% of accepted opportunities include opportunity type, source link or source name, source query, matched keyword data, and evidence text.
- **SC-003**: At least 90% of repeated processing attempts for the same sample inputs avoid duplicate review records.
- **SC-004**: A validation run with at least five representative sample candidates produces a clear accepted, rejected, or incomplete outcome for every candidate.
- **SC-005**: The operator can identify why each accepted opportunity was captured within 30 seconds by reading its stored evidence and matched keywords.
- **SC-006**: No accepted `job` opportunity appears in the future `freelance` review lane during validation.
- **SC-007**: A run that encounters more than 50 candidates inspects no more than 50 and reports that the validation cap was reached.
- **SC-008**: 100% of accepted opportunities expose the available job description, contact channel, company, title or headline, source, matched keywords, and evidence in structured fields.

## Assumptions

- The first user is the project operator working in a local development environment.
- The project already treats `job` and `freelance` as first-class lanes, with `job` prioritized first.
- The local data foundation follows the existing project standard for a containerized local database, but the specification focuses on the user-visible setup outcome rather than implementation details.
- The initial LinkedIn bot is a skeleton and validation path, not a full-scale scraper.
- Only public or user-provided source data is in scope.
- Email sending, resume attachment handling, full CRM UI, and AI-based ranking are later features.
- If custom keywords are unavailable, the approved fallback set is `reactjs`, `typescript`, `nextjs`, and `nodejs`.
