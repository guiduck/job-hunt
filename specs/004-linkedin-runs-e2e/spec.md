# Feature Specification: LinkedIn Runs End-to-End Execution

**Feature Branch**: `004-linkedin-runs-e2e`  
**Created**: 2026-04-30  
**Status**: Draft  
**Input**: User description: "Fechar a execucao end-to-end das runs do bot LinkedIn Job Search."

## Continuity Context

**Roadmap Phase**: Fase 2. Busca de empregos  
**Action Plan Step**: 3. Bot 1 de busca de empregos  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Create the incremental specification that closes the operational local end-to-end LinkedIn Job Search run flow after `003-linkedin-search-provider`: the API creates a run, the separate worker consumes pending runs from the shared local database, executes the existing provider/parser/normalizer pipeline, persists inspected candidates and accepted job opportunities, updates lifecycle metrics, and documents Docker-based validation.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-04-30

- Q: When the worker restarts and finds a run left in `running` after a crash or connectivity loss, what should v1 do? → A: Mark failed/stale and do not reprocess automatically.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Process Pending Runs Automatically (Priority: P1)

As the operator, I want a LinkedIn Job Search run created through the API to be picked up by the worker automatically, so I can validate the bot as an operational local flow instead of manually invoking internal processing.

**Why this priority**: This is the remaining gap between the provider implementation and a usable first automation. Without automatic pending-run processing, the API and worker do not yet prove the intended architecture.

**Independent Test**: Create a job search run through the API, start the local API, worker, and database services, and verify the worker moves the run from pending to a terminal status without any manual internal function call.

**Acceptance Scenarios**:

1. **Given** the API has created a pending LinkedIn Job Search run, **When** the worker is running, **Then** the worker finds the pending run and starts processing it without blocking the API request.
2. **Given** a run is being processed, **When** the worker begins collection, **Then** the run status becomes running and remains inspectable by the operator.
3. **Given** the worker finishes processing a run, **When** the operator reads the run, **Then** the run has a coherent terminal status of completed, completed_no_results, or failed.

---

### User Story 2 - Persist Candidate Outcomes and Accepted Opportunities (Priority: P2)

As the operator, I want every inspected LinkedIn candidate to be persisted with source evidence and outcome, and only contactable candidates to become job opportunities, so I can trust both accepted and rejected results.

**Why this priority**: The provider is only useful when its output becomes auditable data. Accepted opportunities must be actionable, while rejected, duplicate, or failed candidates must explain why they did not become leads.

**Independent Test**: Run the worker against a mixed set of accessible or provided LinkedIn job content and verify all inspected candidates appear through the run candidate view while accepted opportunities appear in both run-scoped and global job opportunity views.

**Acceptance Scenarios**:

1. **Given** candidate content includes source query, source type, provider status, evidence, matched keywords, and contact data, **When** the worker processes it, **Then** those details are visible on the persisted candidate record.
2. **Given** a candidate contains a public email, **When** it has relevant job evidence, **Then** it becomes an accepted `job` opportunity linked to the originating run.
3. **Given** a candidate explicitly invites contact through LinkedIn message, DM, inbox, or equivalent wording and includes the poster profile URL, **When** no public email is available, **Then** it may become an accepted `job` opportunity using that profile as the contact channel.
4. **Given** a candidate lacks a public email or explicit LinkedIn contact invitation with poster profile URL, **When** it is processed, **Then** it is recorded as rejected and no opportunity is created.
5. **Given** a candidate duplicates an already accepted opportunity, **When** it is processed again, **Then** it is recorded as duplicate and does not create another accepted opportunity.

---

### User Story 3 - Make Lifecycle Metrics and Provider Failures Visible (Priority: P3)

As the operator, I want run counters, cap status, provider status, and provider errors to be visible after each run, so I can distinguish useful results from blocked, inaccessible, empty, or failed collection attempts.

**Why this priority**: LinkedIn collection can be blocked, empty, inaccessible, or rate-limited. The system must surface those outcomes honestly and never fabricate opportunities.

**Independent Test**: Execute runs against empty, blocked, inaccessible, malformed, duplicate, and valid supplied sources, then verify terminal status, counters, provider status, errors, candidates, and opportunities remain consistent.

**Acceptance Scenarios**:

1. **Given** LinkedIn is blocked, inaccessible, or returns no usable public content, **When** the worker processes the run, **Then** the run records provider status and error details without creating fabricated opportunities.
2. **Given** no accepted opportunities are found but inspected candidates were recorded, **When** the run completes, **Then** the terminal status and counters clearly indicate no accepted results.
3. **Given** the inspection cap is reached, **When** the run finishes, **Then** the run records the cap state and all counters remain internally consistent.
4. **Given** duplicates are found, **When** the run finishes, **Then** duplicate counts are reflected separately from accepted and rejected counts.

---

### User Story 4 - Validate the Local End-to-End Quickstart (Priority: P4)

As the operator, I want the quickstart, contract, and schema documentation to match the real local behavior, so another person or model can reproduce the flow using the documented commands and expected responses.

**Why this priority**: The feature should close the implementation and handoff gap left by the previous spec, including Docker validation and contract/schema review.

**Independent Test**: Follow the documented local quickstart from a clean environment and verify the API, worker, and database services process a run end-to-end with expected candidate and opportunity responses.

**Acceptance Scenarios**:

1. **Given** the local stack is running, **When** the operator follows the quickstart to create a run, **Then** the documented commands show how to observe worker processing and terminal run status.
2. **Given** accepted opportunities exist for a run, **When** the operator lists run opportunities and global job opportunities, **Then** both documented views show the same accepted job records.
3. **Given** the documented contract and schemas describe run, candidate, provider, and opportunity fields, **When** local responses are compared to the docs, **Then** required fields and examples match the implemented behavior.

---

### Edge Cases

- The worker starts when there are no pending runs.
- Multiple pending runs exist at the same time.
- A run is already marked running when the worker starts after a restart; v1 marks it as failed/stale for operator visibility and does not reprocess it automatically.
- The worker crashes or loses connectivity while a run is in progress.
- Automatic LinkedIn public search is blocked, rate-limited, inaccessible, or empty.
- A provided URL is malformed, inaccessible, non-LinkedIn, duplicated, or irrelevant.
- Pasted public content contains multiple candidate-like entries.
- Candidate content includes hiring-intent terms but no configured or fallback keyword.
- Candidate content includes keywords and contact data but weak job evidence.
- Candidate content includes a poster profile link without explicit contact invitation text.
- Candidate content includes both public email and LinkedIn DM; public email remains preferred.
- Repeated queries or provided sources produce duplicate candidates.
- The inspection cap is reached before all available candidates are processed.
- Candidate persistence succeeds but accepted opportunity creation detects a duplicate.
- Run counters disagree with candidate outcomes due to partial failure or retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a run created through the API to remain pending until the separate worker discovers and processes it.
- **FR-002**: The worker MUST process pending LinkedIn Job Search runs without requiring manual internal invocation after the run is created.
- **FR-003**: The API MUST remain a control and inspection surface; long-running LinkedIn collection MUST NOT execute inside the user-facing request/response path.
- **FR-004**: The worker MUST use the existing LinkedIn provider, parser, and normalizer behavior from the previous provider feature.
- **FR-005**: The worker MUST search or validate with the hiring-intent terms `hiring`, `contratando`, and `contratamos` combined with configured keywords or the fallback keywords `reactjs`, `typescript`, `nextjs`, and `nodejs`.
- **FR-006**: The worker MUST also process user-provided LinkedIn URLs and pasted public content through the same candidate review and persistence rules as automatic collection.
- **FR-007**: The system MUST persist every inspected candidate with source query, source type, provider status, source reference when available, evidence, matched keywords, contact data, outcome, and originating run.
- **FR-008**: The system MUST create accepted `job` opportunities only for candidates with a public email or an explicit LinkedIn contact invitation plus poster profile URL; contact invitation detection MUST cover common English and Portuguese wording such as DM, direct message, inbox, message me, reach out, send CV/resume via LinkedIn, me chame, envie mensagem, and equivalent phrases.
- **FR-009**: The system MUST prefer public email over LinkedIn DM profile contact when both are available for the same candidate.
- **FR-010**: The system MUST reject candidates without public email or explicit LinkedIn contact invitation with poster profile URL, even when they contain relevant keywords.
- **FR-011**: The system MUST record duplicate candidates separately from accepted and rejected candidates and MUST NOT create duplicate accepted opportunities.
- **FR-012**: The system MUST update run lifecycle through pending, running, and a terminal status of completed, completed_no_results, or failed.
- **FR-013**: The system MUST maintain coherent counters for inspected, accepted, rejected, duplicate, cap reached, provider status, and provider error.
- **FR-013a**: The system MUST mark stale running runs found after worker restart as failed/stale and MUST NOT automatically reprocess them in this feature.
- **FR-014**: The system MUST expose inspected candidates through the run candidate view.
- **FR-015**: The system MUST expose accepted opportunities through both the run-scoped opportunity view and the global job opportunity list.
- **FR-016**: The system MUST record blocked, inaccessible, empty, malformed, and failed provider outcomes without fabricating accepted opportunities.
- **FR-017**: The system MUST document the local end-to-end validation path covering API, worker, database, run creation, candidate inspection, accepted opportunity visibility, and failure visibility.
- **FR-018**: The system MUST keep contracts and schemas aligned with the real run, candidate, provider, metric, and opportunity fields.
- **FR-019**: The system MUST include automated coverage for worker loop behavior, persistence, lifecycle transitions, provider failures, deduplication, and contract-visible responses.
- **FR-020**: The system MUST NOT add UI web screens, automated email sending, job application automation, resume parsing, AI scoring, freelance bot behavior, login bypass, rate-limit bypass, or access-control bypass as part of this feature.

### Key Entities *(include if feature involves data)*

- **Job Search Run**: An operator-created LinkedIn Job Search execution request, including inputs, lifecycle status, metrics, provider status, provider errors, cap state, and terminal outcome.
- **Pending Run Queue Item**: A run that has been created and is waiting for worker processing, represented by its status and available inputs rather than a separate product concept.
- **Inspected Candidate**: A LinkedIn job-related source or supplied public content item evaluated during a run, including source metadata, evidence, matched keywords, contact signals, provider status, and processing outcome.
- **Accepted Job Opportunity**: A persisted `job` opportunity created from a candidate with a public email or explicit LinkedIn contact invitation with poster profile URL, linked back to its source run and evidence.
- **Rejected Candidate Outcome**: The recorded reason a candidate did not become an accepted opportunity, including missing contact, weak evidence, blocked source, inaccessible source, empty source, malformed source, parse failure, duplicate, or cap-related exclusion.
- **Run Metrics**: The operator-visible counters and statuses that summarize inspected, accepted, rejected, duplicate, cap reached, provider status, provider error, and terminal run state.
- **Local Validation Stack**: The documented local services and commands used to prove API-created runs are processed by the worker and persisted for inspection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In local validation, an operator can create a LinkedIn Job Search run through the API and observe it reach a terminal status through worker processing without any manual internal processing call.
- **SC-002**: 100% of inspected candidates from a completed local validation run are visible through the run candidate view with source metadata, evidence, contact data when present, provider status, and outcome.
- **SC-003**: 100% of accepted opportunities created by the run are visible through both the run-scoped opportunity view and the global job opportunity list filtered to `job`.
- **SC-004**: 100% of accepted opportunities include either a public email or explicit LinkedIn contact invitation with poster profile URL, plus matched keyword evidence and source reference.
- **SC-005**: Blocked, inaccessible, empty, malformed, or failed provider attempts create zero fabricated opportunities and expose visible failure details on the run or candidates.
- **SC-006**: Duplicate candidates create no duplicate accepted opportunities during repeated local validation runs.
- **SC-007**: Run counters reconcile with persisted outcomes: inspected equals accepted plus rejected plus duplicate plus failed outcome categories, excluding documented cap-skipped candidates.
- **SC-008**: A stale running run encountered after worker restart becomes visibly failed/stale and is not automatically processed again.
- **SC-009**: The documented local quickstart can be followed end-to-end in under 15 minutes after dependencies are available, producing either accepted opportunities from supplied/accessible content or an explicit no-results/failure state.
- **SC-010**: Automated tests cover worker loop behavior, persistence, lifecycle transitions, stale running recovery, provider failures, deduplication, and contract-visible response fields before the feature is considered ready for planning completion.

## Assumptions

- The LinkedIn provider, parser, normalizer, provider metadata, candidate outcome model, and contact acceptance rules from `specs/003-linkedin-search-provider` remain the starting point for this feature.
- The local operator can run the API, worker, and shared database services together for validation.
- If public LinkedIn search is blocked or unavailable locally, supplied LinkedIn URLs or pasted public content remain valid for end-to-end validation as long as the same candidate and opportunity rules apply.
- Pending runs are processed conservatively to avoid duplicate work; any restart or in-progress recovery behavior should favor visible failed/stale state over silent data loss, fabricated success, or automatic retry.
- Contract and schema review may update docs and examples, but should preserve existing accepted behavior unless the implementation and docs currently disagree.
- Email sending, resume attachment, UI review screens, AI scoring, and freelance prospecting remain later roadmap items.
