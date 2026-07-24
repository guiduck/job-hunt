# Feature Specification: Full-time LinkedIn Jobs External Search

**Feature Branch**: `018-linkedin-jobs-external-search`  
**Created**: 2026-07-23  
**Status**: Draft  
**Input**: User description: "Full-time LinkedIn Jobs External Search from docs/next-spec-prompt.md"

## Continuity Context

**Roadmap Phase**: Fase 2 / Fase 3, Full-time job discovery and external applications  
**Action Plan Step**: Extend the existing Full-time Search page after `017-extension-search-history`  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Specify a Full-time extension feature that adds LinkedIn Jobs as a deterministic source for external application opportunities, reorganizes `/search` into `External jobs` and `LinkedIn posts`, skips LinkedIn Easy Apply, accepts only curated external application sources, and saves accepted URLs into the existing `External applications` lane.

> `docs/handoff.md` currently records this feature as the next Spec Kit step. Some older roadmap text still recommends Freelance as the next broad product area, but the latest prompt and handoff reprioritize this narrower Full-time slice first. History Drilldown remains backlog.

## Clarifications

### Session 2026-07-23

- Q: Which component owns LinkedIn browser navigation and job-card inspection? -> A: Extension owns navigation/inspection; API/worker handle persistence and diagnostics. The extension should simulate normal operator browser behavior in a logged-in LinkedIn tab, first validating direct Jobs URLs/geoId behavior and falling back to clicking/navigating through LinkedIn Jobs manually when needed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run LinkedIn Jobs External Search (Priority: P1)

As the Full-time operator, I want to start a LinkedIn Jobs search from the Search page and collect only official external application URLs, so that I can add more actionable external applications without manually opening every job result.

**Why this priority**: This is the minimum valuable slice: LinkedIn Jobs becomes a deterministic source for the existing external application workflow.

**Independent Test**: Can be tested by logging into LinkedIn, opening Search, running LinkedIn Jobs external search with default settings, and confirming accepted external URLs appear in `External applications`.

**Acceptance Scenarios**:

1. **Given** the operator is logged into the extension and LinkedIn, **When** they start LinkedIn Jobs external search with no keywords, **Then** the system browses LinkedIn Jobs using default/relevant results and reports a terminal run status.
2. **Given** LinkedIn Jobs results contain external apply buttons from curated sources and Easy Apply jobs, **When** the run inspects those results, **Then** only curated external application URLs are saved and Easy Apply jobs are counted as skipped.
3. **Given** an accepted external application URL already exists, **When** the same URL is found again, **Then** the existing opportunity is not duplicated and the run diagnostics count it as a duplicate.

---

### User Story 2 - Search By Operator Keywords (Priority: P2)

As the operator, I want LinkedIn Jobs search to use my search text and saved keyword badges when I provide them, so that the results align with my profile and preferred job terms.

**Why this priority**: Keyword-driven discovery makes the run more useful than default browsing while preserving the existing saved-keywords habit.

**Independent Test**: Can be tested by entering multiple terms, starting LinkedIn Jobs external search, and confirming the run evidence records the exact search intent used for discovery.

**Acceptance Scenarios**:

1. **Given** the operator enters several terms, **When** the LinkedIn Jobs run starts, **Then** the search intent treats the terms as alternatives rather than requiring every term at once.
2. **Given** the operator includes remote or hybrid-style terms, **When** the run starts, **Then** those terms are preserved as part of the search intent and evidence.
3. **Given** no keywords or search text are provided, **When** the run starts, **Then** the UI explains that LinkedIn's default/relevant jobs will be browsed.

---

### User Story 3 - Keep Search Types Clear (Priority: P3)

As the operator, I want Search organized by clear tabs, so that career-page external search, LinkedIn Jobs external search, LinkedIn post capture, and post AI filters do not feel like one confusing form.

**Why this priority**: The new source adds controls; clear separation prevents the operator from applying the wrong filters to the wrong search type.

**Independent Test**: Can be tested by opening Search and verifying `External jobs` contains career-page search and LinkedIn Jobs search, while `LinkedIn posts` contains post capture and post AI filters.

**Acceptance Scenarios**:

1. **Given** the operator opens Search, **When** they view `External jobs`, **Then** they see the existing career-page search and the new LinkedIn Jobs external search together with their relevant controls.
2. **Given** the operator views `LinkedIn posts`, **When** they inspect the tab, **Then** post capture controls and AI post filters remain available there and are not presented as LinkedIn Jobs filters.
3. **Given** a control applies only to one search type, **When** the operator switches tabs, **Then** unrelated controls are hidden, scoped, or clearly disabled with a short explanation.

---

### User Story 4 - Use LinkedIn Assisted Jobs Mode (Priority: P4)

As the operator, I want an optional LinkedIn AI-assisted jobs mode, so that I can let LinkedIn use my account/profile preferences when that experience is available.

**Why this priority**: Assisted mode may improve results for some accounts, but it is account-dependent and less controllable than classic search.

**Independent Test**: Can be tested by enabling assisted mode and confirming the run navigates to an assisted jobs experience or gracefully reports that it could not be reached.

**Acceptance Scenarios**:

1. **Given** assisted mode is enabled, **When** the run starts, **Then** the UI explains that LinkedIn may use profile/preferences and date/sort controls may not apply.
2. **Given** assisted navigation is unavailable or unreliable, **When** the system cannot reach it, **Then** the run ends gracefully with diagnostics instead of silently falling back without explanation.
3. **Given** assisted mode is enabled, **When** results are inspected, **Then** the same deterministic external-URL acceptance rules apply.

### Edge Cases

- LinkedIn is not logged in, blocks navigation, changes its layout, or returns no renderable job results.
- A LinkedIn job has only Easy Apply or no visible external application button.
- A LinkedIn safety redirect wraps the official application URL.
- An external apply URL points to an unrecognized ATS/career source.
- The same job appears across pages, sort modes, or repeated runs.
- The selected curated sources exclude every found external link.
- LinkedIn pagination stops before the configured page limit.
- Assisted jobs mode is unavailable for the account or cannot preserve date/sort controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Search page MUST provide separate `External jobs` and `LinkedIn posts` tabs.
- **FR-002**: `External jobs` MUST include the existing career-page external search and the new LinkedIn Jobs external search.
- **FR-003**: `LinkedIn posts` MUST retain the existing LinkedIn post capture and AI post filtering controls.
- **FR-004**: Controls MUST be scoped to the search type that uses them, so unrelated filters are not visibly active for the wrong run type.
- **FR-005**: LinkedIn Jobs external search MUST support starting with no keywords, with operator-provided search text, and with optional LinkedIn assisted jobs mode.
- **FR-006**: When no keywords are provided, the UI MUST explain that the run will browse LinkedIn Jobs using LinkedIn default/relevant results.
- **FR-007**: When keywords are provided, the search intent MUST treat terms as alternatives and preserve remote/hybrid-style terms entered by the operator.
- **FR-008**: Classic LinkedIn Jobs search MUST allow the operator to choose date posted: any time, last month, last week, or last 24 hours.
- **FR-009**: Classic LinkedIn Jobs search MUST allow the operator to choose sort order: relevant or most recent.
- **FR-010**: Assisted LinkedIn Jobs mode MUST disable or clearly explain unavailable date and sort controls unless the implementation can reliably preserve those choices.
- **FR-011**: LinkedIn Jobs capture MUST skip Easy Apply / candidatura simplificada jobs and count them separately in diagnostics.
- **FR-012**: LinkedIn Jobs capture MUST save only external application URLs from the curated source list already used by the external career-page search.
- **FR-013**: The curated external source list MUST be shared across career-page search and LinkedIn Jobs external search, with the same selected source checkboxes applying to both.
- **FR-014**: Unrecognized sources MUST be ignored as unsupported sources rather than saved or maintained in a separate LinkedIn Jobs denylist.
- **FR-015**: The curated source list MUST start from the current active career-page sources: InHire, Ashby, Lever, Greenhouse, SmartRecruiters, Trampos, Catho, and any already represented active source. Teamtailor MAY be added only as an accepted curated source.
- **FR-016**: LinkedIn Jobs capture MUST decode LinkedIn safety redirects when needed to persist the official external application URL.
- **FR-017**: Accepted LinkedIn Jobs opportunities MUST appear in the existing `External applications` lane and follow the existing manual applied/status flow.
- **FR-018**: Accepted opportunities MUST record source evidence showing LinkedIn Jobs as the discovery source, the LinkedIn job URL when available, and the decoded external application URL.
- **FR-019**: The system MUST deduplicate accepted jobs against existing external applications using canonical external application URL and existing opportunity identity rules.
- **FR-020**: LinkedIn Jobs capture MUST continue through pages until the configured page limit is reached or LinkedIn has no next page.
- **FR-021**: The LinkedIn Jobs page limit MUST default to 15 pages and allow a maximum of 30 pages.
- **FR-022**: LinkedIn Jobs capture MUST NOT require a maximum accepted-opportunities cap.
- **FR-023**: LinkedIn Jobs capture MUST NOT stop early only because several inspected jobs are unsupported, duplicates, failures, or Easy Apply.
- **FR-024**: LinkedIn Jobs capture MUST be deterministic and MUST NOT apply the existing AI quality filters before saving accepted LinkedIn Jobs external opportunities.
- **FR-025**: Existing AI filtering MUST remain available only where already valid: LinkedIn post capture and existing career-page/external source search.
- **FR-026**: Each run MUST provide safe diagnostics including pages visited, jobs inspected, external links found, accepted, skipped Easy Apply, unsupported source, duplicates, failures, navigation method, and terminal reason.
- **FR-027**: The feature MUST NOT change Freelance app schema, Freelance leads, outreach, Email, WhatsApp, provider settings, or Freelance migrations.
- **FR-028**: The feature MUST NOT introduce automated cleanup, deletion, destructive retention behavior, or new email outreach behavior.
- **FR-029**: Existing LinkedIn post capture, History tab, career-page search, Jobs lane, Gmail sending, Field Assistant, and Freelance app behavior MUST remain intact.

### Key Entities *(include if feature involves data)*

- **LinkedIn Jobs External Search Run**: A Full-time search operation started by the operator from the extension, including search mode, date/sort choices when applicable, selected curated sources, page limit, progress counters, terminal status, and diagnostics. Browser navigation and job-card inspection belong to the extension because they rely on the operator's active LinkedIn browser session; backend components handle persistence, dedupe, validation, and diagnostics.
- **Curated External Job Source**: An allowed ATS/career source shared by career-page search and LinkedIn Jobs external search. The operator can select which curated sources are active for external job discovery.
- **LinkedIn Job Evidence**: The evidence captured from LinkedIn Jobs for an inspected result, including discovery source, LinkedIn job URL when available, external application URL when accepted, and skip reason when rejected.
- **External Application Opportunity**: The existing Full-time opportunity type for jobs that require manual application through an official external URL instead of Gmail outreach.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a representative LinkedIn Jobs run with mixed Easy Apply and external jobs, 100% of saved opportunities have an external application URL from a curated source.
- **SC-002**: In a representative run with Easy Apply jobs, 100% of Easy Apply-only jobs are skipped and counted in diagnostics.
- **SC-003**: A default run can inspect up to 15 LinkedIn Jobs pages without requiring the operator to manually advance pages.
- **SC-004**: The operator can raise the page limit up to 30 pages and cannot configure a value above 30.
- **SC-005**: Re-running a search that finds already saved external application URLs creates no duplicate opportunities for those URLs.
- **SC-006**: At least 90% of terminal runs provide enough diagnostics for the operator to understand whether few/no accepted jobs came from no results, Easy Apply-only jobs, unsupported sources, duplicates, LinkedIn navigation failure, or another terminal reason.
- **SC-007**: The Search page clearly separates external jobs from LinkedIn posts such that a tester can identify which controls affect each search type without opening documentation.
- **SC-008**: Existing LinkedIn post capture and career-page external search still complete their primary workflows after the tabs are introduced.

## Assumptions

- The operator is responsible for being logged into LinkedIn in the browser and for operational rate/compliance judgment.
- LinkedIn Jobs layout, assisted mode, redirects, and pagination may change; graceful terminal states and diagnostics are required because full stability cannot be guaranteed.
- Classic LinkedIn Jobs search can preserve date and sort choices through stable navigation or equivalent user-visible controls.
- Assisted LinkedIn Jobs search is account/profile dependent; if direct assisted navigation is unreliable, navigation from LinkedIn home/feed to Jobs is acceptable. The implementation plan should validate whether direct Jobs links and any required geography parameters work reliably before relying on them; otherwise the extension should navigate by simulating normal user clicks into Jobs.
- Brazil/profile-driven LinkedIn defaults are acceptable when no explicit location is set; no hardcoded location should be treated as a product guarantee without validation.
- The existing external application lane already supports manual open/apply/status behavior and remains the destination for accepted URLs.
- The source allowlist is the quality gate for this MVP; no AI quality review is required before saving LinkedIn Jobs external opportunities.

