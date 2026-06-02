# Feature Specification: Curated Career Page Search

**Feature Branch**: `codex-013-serpapi-career-search`  
**Created**: 2026-06-02  
**Status**: Draft  
**Input**: User description: "Add a career-page job search flow using curated job sites through the existing search provider key, with external application tabs, source checkboxes, AI evaluation, manual apply URLs, and dashboard counts for email vs external jobs."

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time review, sending, and post-capture intelligence  
**Action Plan Step**: Expand Full-time discovery beyond LinkedIn without returning to the discarded email-enrichment spike  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Specify a new Full-time feature that searches curated career/job sites without requiring company names, saves external application opportunities, separates jobs with email from external application jobs in `/jobs`, evaluates each job with the existing AI matching layer, and keeps application submission manual through the external apply URL.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Curated Career Pages (Priority: P1)

A logged-in Full-time operator can run a career-page search from the Search tab using the same keyword input they use for LinkedIn, select which curated sources to include, and receive job opportunities from supported career/job sites without typing company names.

**Why this priority**: This is the core value of the feature: it expands discovery beyond LinkedIn while avoiding the unusable board-by-company workflow that would not produce enough results.

**Independent Test**: Can be tested by entering `react frontend remoto`, selecting at least one curated source, starting a career-page search, and confirming that returned opportunities contain source evidence, an external job URL, and no requirement to provide a company or board name.

**Acceptance Scenarios**:

1. **Given** the operator is authenticated and has entered keywords, **When** they select curated career-page sources and start the external search, **Then** the system creates a search run that searches only the selected sources and records the source query for each result.
2. **Given** the operator enters a maximum number of opportunities, **When** the external search runs, **Then** the system stops after the requested number of accepted opportunities or when no more fresh supported results are available.
3. **Given** the operator runs an external search, **When** LinkedIn scroll settings are visible elsewhere in the Search tab, **Then** those scroll settings do not affect career-page search behavior.

---

### User Story 2 - Review External Applications Separately (Priority: P1)

A Full-time operator can review jobs with direct email separately from external application jobs, using the same card style and core information already used by LinkedIn-derived jobs, while seeing an explicit action to open the job URL.

**Why this priority**: Email jobs and external application jobs require different actions. Keeping them separate prevents bulk email actions from being offered where no email exists and keeps the daily workflow clear.

**Independent Test**: Can be tested by having at least one email job and one external application job, opening `/jobs`, switching between the two tabs, and confirming that each tab shows only the correct type with the same card information density.

**Acceptance Scenarios**:

1. **Given** the Jobs list contains email-based jobs and external application jobs, **When** the operator opens `/jobs`, **Then** the list provides tabs for jobs with email and external applications.
2. **Given** the operator views the external applications tab, **When** a job card is rendered, **Then** the card shows the same core information as current job cards plus a single action to open the job URL.
3. **Given** multiple external application jobs are selected, **When** the operator uses bulk actions, **Then** bulk deletion is available but bulk opening of application URLs is not available.

---

### User Story 3 - Evaluate External Jobs With AI Matching (Priority: P2)

A Full-time operator can rely on the existing matching layer to decide whether external job results should become opportunities, using the returned job data, source text, selected resume/profile context, and current keyword intent.

**Why this priority**: Curated web results can be noisy. AI evaluation keeps external search useful by filtering out stale, unrelated, or incompatible jobs before they pollute the review queue.

**Independent Test**: Can be tested by running a career-page search with AI evaluation enabled and confirming accepted opportunities contain a match score or explanation while rejected candidates are counted and traceable.

**Acceptance Scenarios**:

1. **Given** an external job result includes title, snippet, description, source URL, and provider metadata, **When** matching is enabled, **Then** the evaluator records whether the result is accepted or rejected with a short reason.
2. **Given** the evaluator cannot complete, **When** a result has enough deterministic evidence to review manually, **Then** the system applies a safe fallback instead of failing the entire run.
3. **Given** a result is rejected as stale, unrelated, or missing a usable application URL, **When** the run completes, **Then** the rejected result is counted for diagnostics but does not appear as an active opportunity.

---

### User Story 4 - Track Manual External Applications (Priority: P2)

A Full-time operator can mark an external application job as applied after using the external site, so dashboard counts and future ATS resume generation can include these jobs even though no email send event exists.

**Why this priority**: External applications cannot be sent by the system, but they still need operational status and future learning value for ATS resume generation.

**Independent Test**: Can be tested by opening an external application job, clicking the external apply URL, manually marking it as applied, and confirming dashboard counts update accordingly.

**Acceptance Scenarios**:

1. **Given** an external application job has not been applied to, **When** the operator marks it as applied, **Then** its job status changes to applied without creating an email send event.
2. **Given** an external application job is marked applied, **When** the dashboard is refreshed, **Then** it no longer counts as an unapplied external job.
3. **Given** a future ATS resume generator reads applied jobs, **When** it includes external application jobs, **Then** those jobs have enough title, description, source, and match context to be useful.

---

### User Story 5 - See Email And External Counts On Dashboard (Priority: P3)

A Full-time operator can see how many actionable jobs are email-based and how many are external application jobs still awaiting manual application.

**Why this priority**: The dashboard should reflect the two different operating lanes instead of treating all unsent jobs as email tasks.

**Independent Test**: Can be tested by creating mixed job opportunities and confirming the dashboard shows separate totals for email jobs and unapplied external application jobs.

**Acceptance Scenarios**:

1. **Given** the operator has email jobs and external application jobs, **When** the dashboard loads, **Then** it shows separate counts for email-based jobs and external jobs awaiting manual application.
2. **Given** an external job is marked applied, **When** dashboard metrics refresh, **Then** the external unapplied count decreases while email metrics are unchanged.

### Edge Cases

- A curated source returns search results that are not individual job pages; those results must be rejected or ignored without blocking the run.
- A result URL points to a job that is closed, stale, or no longer accessible; the run must record the failure or rejection and continue.
- A result appears in more than one curated search query or source; only one active opportunity should remain.
- A selected source returns no results; the run should show zero accepted results for that source without failing all selected sources.
- A job has no email contact; it must be classified as an external application instead of being routed to email sending.
- A job has both an email and an application URL; it should be treated as email-based for outreach eligibility while preserving the application URL as supporting context.
- The source provider key is missing or unavailable; the user should see that external search cannot run while existing LinkedIn and Jobs functionality remains available.
- A search returns more candidate results than requested; the accepted opportunity count should respect the operator's requested maximum.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Search experience MUST provide a career-page search action below the LinkedIn search action.
- **FR-002**: The career-page search action MUST use the current keyword input and maximum opportunity count.
- **FR-003**: The career-page search action MUST NOT require the operator to enter company names, board names, tenant names, or ATS client identifiers.
- **FR-004**: The Search experience MUST allow the operator to include or exclude supported curated sources before starting a career-page search.
- **FR-005**: The initial supported source set MUST include InHire, Ashby, Lever, Greenhouse, SmartRecruiters, Trampos, and Catho.
- **FR-006**: Future Brazilian sources under consideration, including Programathor, Remotar, GeekHunter, Vagas.com.br, and InfoJobs, MUST remain out of the active source set until explicitly enabled in a later feature.
- **FR-007**: The system MUST search only selected sources for each career-page run.
- **FR-008**: The system MUST record source query, source name, source URL, source evidence, and raw result context sufficient for diagnostics and later review.
- **FR-009**: External search candidates MUST be deduplicated before active opportunities are shown to the operator.
- **FR-010**: External search candidates MUST be classified as email-based when they contain a usable public email and as external application jobs when they do not.
- **FR-011**: External application opportunities MUST preserve a usable job URL or application URL.
- **FR-012**: External application opportunities MUST expose job title, company when known, source name, source URL, description or source evidence, matched keywords, and AI match information when available.
- **FR-013**: AI evaluation MUST assess each external job candidate using returned job data, source evidence, user profile/resume context when available, keywords, and existing search preferences.
- **FR-014**: AI evaluation MUST produce an accept/reject decision with a short reason and traceable signals when enabled or available.
- **FR-015**: If AI evaluation fails, the system MUST apply a deterministic fallback or mark the candidate for safe rejection without failing the whole run.
- **FR-016**: Jobs MUST provide separate tabs or equivalent segmented views for email-based jobs and external application jobs.
- **FR-017**: External application cards MUST use the same card structure and information density as existing job cards wherever the data exists.
- **FR-018**: External application cards MUST provide one primary action to open the job URL.
- **FR-019**: The system MUST NOT provide a bulk action to open multiple external job URLs at once.
- **FR-020**: Bulk selection in the external applications view MUST support deletion of selected jobs.
- **FR-021**: External application detail MUST not add a separate rich detail experience beyond the existing description/evidence needed to review the job.
- **FR-022**: External application jobs MUST support manual marking as applied.
- **FR-023**: Manual marking as applied MUST NOT create Gmail send requests or email outreach events.
- **FR-024**: Dashboard metrics MUST distinguish email-based jobs from external application jobs awaiting manual application.
- **FR-025**: Dashboard metrics MUST update when an external application job is marked applied or deleted.
- **FR-026**: Existing LinkedIn search, LinkedIn capture, email sending, Gmail OAuth, and AI field assistant flows MUST continue to work without requiring external search configuration.
- **FR-027**: External search runs MUST be owner-scoped so one user's source selections, candidates, opportunities, and metrics are not visible to another user.
- **FR-028**: External search must preserve enough job title, description, source, URL, and evaluation context for a future ATS resume generator to use applied external jobs as input.

### Key Entities *(include if feature involves data)*

- **Curated Source**: A supported job source the operator may include in career-page search. Key attributes include display name, source category, active status, search scope, and whether it is enabled by default.
- **External Search Run**: A user-owned search operation over selected curated sources. Key attributes include keywords, selected sources, requested opportunity count, run status, counters, and source-level diagnostics.
- **External Job Candidate**: A raw or normalized job result found during a career-page search before it becomes an opportunity. Key attributes include source, source URL, apply URL, title, company, description/evidence, raw result context, dedupe key, and evaluation outcome.
- **Job Opportunity**: The existing Full-time opportunity record. For this feature it distinguishes email-based jobs from external application jobs while keeping shared card information, status, notes, source evidence, and future ATS resume context.
- **Application Status**: The operator-controlled status for a job opportunity. External application jobs can be marked applied manually without creating email send records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can start a career-page search from the Search tab in under 30 seconds without entering any company, board, or tenant identifier.
- **SC-002**: At least 90% of accepted external application opportunities contain a usable job URL that opens an application or job detail page.
- **SC-003**: A mixed Jobs list with at least one email job and one external job can be separated into the correct tabs with no cross-contamination of email-only and external-only actions.
- **SC-004**: Selecting multiple external application jobs allows deletion but never opens more than one external application URL from a single bulk action.
- **SC-005**: Dashboard counts for email-based jobs and unapplied external jobs update after deletion or manual applied-status changes without requiring a new search.
- **SC-006**: In a manual review sample of 20 accepted external opportunities, at least 70% are relevant to the entered keywords or have an AI explanation that makes the acceptance decision understandable.
- **SC-007**: A source returning zero results or unavailable data does not prevent results from other selected sources from completing.

## Assumptions

- The existing authenticated Full-time extension remains the primary user interface for this feature.
- The existing search provider key configured for prior search work can be reused for curated web search in the planning phase, but the specification focuses on the product behavior rather than a specific provider contract.
- Career-page search should prioritize simple application experiences and official job/application URLs over discovering company emails.
- LinkedIn remains a separate capture flow and continues using scroll/capture settings; career-page search does not use scroll limits.
- External application opportunities are still `job` opportunities and should remain compatible with existing filters, notes, deletion, status changes, and future ATS resume generation.
- The first release uses a curated source list and does not attempt open-ended scraping of the entire web.
