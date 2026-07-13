# Feature Specification: Extension Search History

**Feature Branch**: `017-extension-search-history`
**Created**: 2026-07-13
**Status**: Draft
**Input**: User description: "Adicionar na extensao, nao no app web, um historico das buscas da aba /search mostrando keywords usadas e resultados encontrados no LinkedIn. Nao descontar duplicatas dos resultados porque keywords pesquisadas mais vezes pareceriam piores. Queremos o valor resultante achado no LinkedIn."

## Continuity Context *(mandatory)*

- Roadmap Phase: Full-time fine tuning and feedback loop, running alongside the already completed Freelance bulk outreach lane.
- Action Plan Step: Step 6, tracking and feedback loop for employment search quality.
- Latest Working Prompt: Create a Spec Kit feature for an extension-only Search History tab that records LinkedIn Search keywords/queries and raw LinkedIn result counts before dedupe, while keeping the Freelance web app roadmap separate.

## Clarifications

### Session 2026-07-13

- Q: What default history scope should the extension show? -> A: Show only the 20 most recent LinkedIn Search runs, with an all-time keyword ranking below it; dates are mainly diagnostic context for interpreting possible duplicates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Recent Search Runs (Priority: P1)

As the operator, I can open a History tab in the Full-time extension and see the 20 most recent LinkedIn Search runs with the exact search text/keywords used, when it ran, its terminal status, and the result counters from that run.

**Why this priority**: Without a run history, the operator loses the evidence needed to compare what was searched and what actually came back from LinkedIn.

**Independent Test**: Run two LinkedIn searches from the extension Search tab using different text, then open History and verify both runs appear within the recent 20-run list with their query text, timestamp, status, raw LinkedIn result count, accepted count, rejected count, and duplicate count.

**Acceptance Scenarios**:

1. **Given** a completed LinkedIn Search run with captured posts, **When** the operator opens History, **Then** the run appears with its search text, keyword tokens, raw LinkedIn results found, accepted, rejected, duplicate, and completion time.
2. **Given** a failed or timed-out LinkedIn Search run, **When** the operator opens History, **Then** the run still appears with status and a safe diagnostic message instead of disappearing.

---

### User Story 2 - Compare Keyword and Query Productivity (Priority: P1)

As the operator, I can compare full search queries and individual keywords/tags by frequency and raw LinkedIn results found so I can learn which searches produce more vacancies, with a keyword ranking visible below the recent-run list regardless of run date.

**Why this priority**: The user explicitly needs the original LinkedIn result volume, even when repeated searches produce duplicates, because subtracting duplicates would bias the comparison against frequently searched keywords.

**Independent Test**: Run the same keyword twice where the second run produces duplicate opportunities. Verify the keyword aggregate increments search frequency and total raw LinkedIn results for both runs while keeping duplicates in a separate diagnostic counter.

**Acceptance Scenarios**:

1. **Given** two runs for the same keyword with overlapping posts, **When** History shows keyword aggregates, **Then** total raw results equals the raw count from run A plus the raw count from run B and does not subtract duplicate outcomes, regardless of when each run occurred.
2. **Given** a query containing multiple keyword tokens, **When** aggregates are shown, **Then** the full-query aggregate and keyword-token aggregate are visually distinct so the operator can compare exact searches and reusable tags without confusing them.

---

### User Story 3 - Inspect a Search Run's Evidence (Priority: P2)

As the operator, I can open a history entry and inspect enough run detail to understand whether the search produced useful opportunities, duplicates, rejects, AI-filter rejects, or provider/capture issues.

**Why this priority**: Search history is only useful if it explains what happened, not just a single total number.

**Independent Test**: Open a completed history entry and verify the detail view links to its run, candidates, and saved opportunities and shows status, counters, stop reason/diagnostics, and AI-filter counters when present.

**Acceptance Scenarios**:

1. **Given** a completed run with AI filters enabled, **When** the operator opens the history detail, **Then** AI passed/rejected/fallback/failed/skipped counters are visible as secondary diagnostics.
2. **Given** an old run created before raw LinkedIn result tracking exists, **When** it appears in History, **Then** raw result count is shown as unavailable/unknown, never as zero.

---

### User Story 4 - Keep Freelance Web Separate (Priority: P3)

As the operator, I can use the new Search History without changing the Freelance web app, its leads, templates, outreach batches, or WhatsApp/email settings.

**Why this priority**: The project has two active lanes, and this feature is explicitly for the Full-time extension only.

**Independent Test**: Navigate the Freelance web app after the feature is implemented and verify no new Search History UI, schema dependency, or changed outreach behavior was introduced there.

**Acceptance Scenarios**:

1. **Given** existing Freelance leads and outreach settings, **When** the extension Search History feature is used, **Then** no Freelance lead, campaign, outreach batch, template, email, or WhatsApp state changes.

### Edge Cases

- LinkedIn returns repeated posts already seen in prior runs: raw LinkedIn result count remains the discovered/captured count for this run; duplicate outcomes are separate.
- LinkedIn Search run fails before capture starts: history records the attempted query, status, and diagnostic, with raw result count unavailable.
- A run is still pending/running: history can show it with provisional counters and clear non-terminal status.
- Old records lack raw count fields: display "unknown" or equivalent, not `0`.
- Query text contains repeated tokens or saved badges already present in the input: token aggregates dedupe tokens within that run, while the run's raw result count is counted once for the full query.
- Career-page/ATS search runs exist in the same underlying run table: the first release of this history filters to LinkedIn Search runs only unless the operator explicitly switches scope in a future spec.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST persist a history-visible record for every user-started LinkedIn Search capture from the Full-time extension, including query text, normalized keyword tokens, sort/date options where available, owner/user scope, start time, terminal status, and safe diagnostics.
- **FR-002**: The system MUST persist or expose the raw LinkedIn result count discovered by the extension before deduplication, rejection, AI filtering, or opportunity creation changes the outcome.
- **FR-003**: The system MUST NOT compute raw LinkedIn result totals by subtracting duplicate, rejected, skipped, or AI-filtered outcomes from another counter.
- **FR-004**: The system MUST keep duplicate count, accepted count, rejected count, AI-filter counters, and saved opportunity count as separate diagnostics from raw LinkedIn results.
- **FR-005**: The extension MUST add a History tab or equivalent first-class view reachable from the existing Full-time popup navigation.
- **FR-006**: The History view MUST show recent LinkedIn Search runs with query, keyword tokens, run date/time, status, raw LinkedIn results found, accepted, rejected, duplicate, and safe error/status message when relevant.
- **FR-007**: The History view MUST show the 20 most recent LinkedIn Search runs by default.
- **FR-008**: The History view MUST include aggregate comparison by exact full query and by keyword token, including search frequency, total raw LinkedIn results, average raw results per run, accepted count, duplicate count, and latest run time.
- **FR-009**: The History view MUST show a date-independent ranking of best keyword tokens below the recent-run list, using raw LinkedIn results as the primary productivity signal and keeping run dates available only as diagnostic context for duplicate interpretation.
- **FR-010**: Aggregates MUST count every run attempt/result occurrence in the selected aggregate scope, even when later runs produce duplicate opportunities already known from prior runs.
- **FR-011**: The operator MUST be able to sort or filter the recent-run list by status, query/keyword, and at least one productivity metric such as total raw results or average raw results; dates MUST remain visible as diagnostic context rather than ranking scope.
- **FR-012**: A run detail affordance MUST expose existing run/candidate/opportunity diagnostics without leaking secrets, raw auth tokens, or provider errors that contain sensitive data.
- **FR-013**: Existing Full-time Search behavior, saved keyword badges, AI filters, career-page search controls, Jobs list, Gmail sending, and AI Field Assistant behavior MUST remain backward compatible.
- **FR-014**: The feature MUST NOT add, remove, or change Freelance web app data, outreach settings, WhatsApp/email provider settings, or lead workflows.
- **FR-015**: The implementation MUST handle historical runs missing raw result counts as unknown/unavailable and exclude them from raw-count averages unless the UI clearly labels the estimate.
- **FR-016**: The feature MUST preserve owner scoping so one user's search history and aggregates are not visible to another user.

### Key Entities *(include if feature involves data)*

- **Search History Entry**: A user-scoped LinkedIn Search run attempt with query, tokens, options, timestamps, status, raw LinkedIn result count, outcome counters, and diagnostics.
- **Search Aggregate**: A derived comparison row for either an exact query or a keyword token, including run frequency, raw result totals/averages, outcome counters, and latest activity.
- **Search Outcome Counters**: Separate counts for accepted, rejected, duplicate, AI-filter outcomes, saved opportunities, and raw LinkedIn results, with raw count explicitly independent from dedupe math.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new user-started LinkedIn Search runs appear in History with query text, timestamp, status, and owner scope.
- **SC-002**: In validation runs with duplicate-heavy results, History raw result totals match the LinkedIn/capture result count observed before dedupe and do not decrease because duplicates were detected.
- **SC-003**: The operator can identify the 20 most recent LinkedIn Search runs and the top five keyword tokens by total raw LinkedIn results in under 30 seconds from the extension.
- **SC-004**: Runs created before raw result tracking show raw results as unknown/unavailable and are not silently counted as zero in aggregates.
- **SC-005**: Existing Freelance web app tests and Full-time extension Search tests continue passing without changed Freelance behavior.

## Assumptions

- The first release focuses on LinkedIn Search captures initiated from the extension Search tab, not career-page/ATS search analytics.
- "Raw LinkedIn results" means the number of LinkedIn posts/results the extension discovered/captured for that run before downstream dedupe and filtering.
- Keyword-token aggregates are derived from the query used at run start and should be stable even if saved badges are later edited.
- The UI can use existing run/candidate/opportunity links for detail drilldown rather than inventing a separate full analytics workspace in this release.
