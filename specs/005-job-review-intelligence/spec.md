# Feature Specification: Job Review Intelligence

**Feature Branch**: `005-job-review-intelligence`  
**Created**: 2026-05-01  
**Status**: Draft  
**Input**: User description: "Make captured LinkedIn job opportunities review-ready for the Full-time operating flow, with optional AI-assisted candidate analysis and scoring over already-collected public text."

## Continuity Context

**Roadmap Phase**: Fase 2. Busca de empregos  
**Action Plan Step**: 3. Bot 1 de busca de empregos, moving toward 4. Revisao operacional  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-specify @next-spec-prompt.md (8-57)` to define the next incremental feature after `004-linkedin-runs-e2e`.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-05-01

- Q: What scale should the match score use? → A: 0-100 integer score, where 0 is no fit and 100 is strongest fit; scoring should combine current matched/missing keywords with past responses, success, or acceptance from similar job posts when such history exists.
- Q: How strongly should historical outcomes affect scoring? → A: Current match is primary; historical outcomes adjust the score when comparable history exists.
- Q: Which review status values should the first version support? → A: `unreviewed`, `reviewing`, `saved`, `ignored`, tracked separately from `job_stage`.
- Q: Which historical outcomes should influence score adjustment? → A: Use review outcomes plus later `job_stage` outcomes like `responded`, `interview`, `rejected`, and `ignored` when available.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Prioritized Job Opportunities (Priority: P1)

As the operator in the `Full-time` flow, I want each accepted job opportunity to show an explainable match score, normalized job context, evidence, and review state so I can decide which vacancies deserve human attention before preparing any application.

**Why this priority**: The prototype becomes useful only when captured jobs can be reviewed as operational records instead of raw scraper output.

**Independent Test**: Can be fully tested by completing a LinkedIn job search run, opening the accepted `job` opportunities, and confirming that each review-ready opportunity includes score, explanation, source evidence, review status, and preserved contact/source data.

**Acceptance Scenarios**:

1. **Given** a captured job opportunity with public source text and matched keywords, **When** the opportunity is displayed for review, **Then** the operator sees a 0-100 match score, score explanation, normalized role/company, detected seniority/modality/location when available, matched keywords, missing keywords, source evidence, contact channel, review status, and notes.
2. **Given** a captured job opportunity with weak keyword coverage but a usable contact channel, **When** the opportunity is reviewed, **Then** the opportunity remains visible with a low or uncertain score and an explanation of the weak match instead of being silently discarded.
3. **Given** the operator edits notes or review status, **When** the record is viewed again, **Then** the human review decision remains separate from the original provider evidence and analysis result.

---

### User Story 2 - Filter Review-Ready Full-time Leads (Priority: P2)

As the operator, I want to filter `Full-time` job opportunities by score, keywords, contact availability, stage, provider status, and source/run context so I can quickly focus on the most actionable vacancies.

**Why this priority**: Filtering is the bridge between completed collection runs and the future list/detail review experience shown in the reference UI.

**Independent Test**: Can be fully tested by creating a mixed set of accepted job opportunities and verifying that the review list can isolate high-score, contactable, pending-review opportunities without showing `Freelance` records.

**Acceptance Scenarios**:

1. **Given** accepted job opportunities with different scores, keywords, contact channels, stages, provider statuses, and run origins, **When** the operator applies review filters, **Then** only matching `job` opportunities are returned.
2. **Given** a `Freelance` opportunity exists in the shared opportunity store, **When** the operator uses `Full-time` filters, **Then** the `Freelance` record is excluded and its data is unchanged.
3. **Given** an opportunity came from a known source query, run, or campaign context, **When** the operator filters or opens the record, **Then** the source linkage remains visible where it was available at capture time.

---

### User Story 3 - Understand Analysis and Fallback Status (Priority: P3)

As the operator, I want every run and candidate to show whether it was deterministic-only, AI-assisted, or processed with fallback after an analysis problem so I can trust the score appropriately.

**Why this priority**: AI can improve review quality only if its status, failures, and confidence are visible rather than hidden behind a single score.

**Independent Test**: Can be fully tested by running the same collection flow with analysis available, unavailable, and returning invalid structured output, then confirming visible status and fallback behavior for runs, candidates, and accepted opportunities.

**Acceptance Scenarios**:

1. **Given** optional AI analysis is not available or not enabled, **When** a run completes, **Then** accepted candidates are still normalized deterministically and marked as deterministic-only.
2. **Given** optional AI analysis returns invalid or incomplete structured output, **When** the candidate is processed, **Then** the invalid result is not persisted as truth, fallback analysis is used, and the analysis error is visible.
3. **Given** optional AI analysis completes successfully, **When** the operator reviews the candidate or opportunity, **Then** the record shows that AI assisted the analysis and explains the score using traceable source evidence.

---

### Edge Cases

- AI analysis is unavailable, disabled, times out, or cannot produce valid structured output.
- AI analysis produces a high score without enough source evidence to justify it.
- Deterministic parsing finds contact information but the role/company or seniority remains unclear.
- A provider failure or blocked public source creates candidate/run status without accepted opportunities.
- Duplicate candidates appear across runs or source inputs.
- A candidate has contact availability but weak match quality.
- A candidate has strong match quality but no usable contact channel.
- A run contains both high-confidence and low-confidence candidates.
- Existing `Freelance` opportunities share the same storage layer but must not receive job-specific review behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Accepted `job` opportunities MUST include a review profile with a 0-100 integer match score, score explanation, normalized role, normalized company, matched keywords, missing keywords, contact channel, review status, and operator notes.
- **FR-002**: The review profile MUST include seniority, modality, and location when those values can be detected with reasonable confidence from collected text or source metadata.
- **FR-003**: Match scores MUST be explainable using captured evidence, matched keywords, missing keywords, role fit, contact availability, source context, and past response/success/acceptance outcomes from similar descriptions or keywords when that history exists; unexplained scores MUST be treated as low-confidence.
- **FR-004**: Optional AI-assisted analysis MUST operate only on public or user-provided collected text and related source metadata already available from the collection flow.
- **FR-005**: Optional AI-assisted analysis MUST return structured results that are validated before they affect stored review fields.
- **FR-006**: If optional AI-assisted analysis is unavailable, disabled, invalid, or incomplete, the system MUST preserve deterministic parser/normalizer behavior and mark the fallback status visibly.
- **FR-007**: The system MUST preserve `source_query`, `source_url`, `source_evidence`, provider status, matched keywords, contact channel, run linkage, and deduplication behavior for all reviewed job opportunities.
- **FR-008**: Operators MUST be able to filter `Full-time` job opportunities by minimum score, keyword, contact availability, job stage or review status, provider status, source context, campaign context where available, and run linkage where available.
- **FR-009**: Runs and candidates MUST expose analysis status, analysis error summary when present, confidence level, and whether the final review fields came from deterministic-only processing, AI-assisted processing, or fallback processing.
- **FR-010**: Duplicate candidates MUST continue to avoid creating duplicate accepted opportunities while preserving enough source/run context for operators to understand where the opportunity was seen.
- **FR-011**: Provider failures, blocked sources, and empty results MUST remain visible at run/candidate level and MUST NOT fabricate review-ready opportunities.
- **FR-012**: Review notes and review status changes MUST be editable by the operator without overwriting captured evidence or original analysis output.
- **FR-013**: Review status MUST use the initial values `unreviewed`, `reviewing`, `saved`, and `ignored`, and MUST remain separate from `job_stage`.
- **FR-014**: When historical feedback is available, the system MUST use comparable past job descriptions or keywords as score adjustment signals while keeping the current opportunity evidence as the primary scoring source. Historical feedback MUST include review outcomes such as `saved` or `ignored` and later `job_stage` outcomes such as `responded`, `interview`, `rejected`, or `ignored` when available.
- **FR-015**: `Freelance` opportunities MUST remain unaffected except for continued compatibility with shared `opportunity_type` filtering and storage.
- **FR-016**: The feature MUST NOT send emails, submit job applications, automate LinkedIn actions, parse full resumes, implement the full web UI, or replace deterministic collection with autonomous browsing.

### Key Entities

- **Review-Ready Job Opportunity**: An accepted `job` opportunity enriched for operator review with score, explanation, review status, notes, source evidence, contact information, and normalized job context.
- **Candidate Analysis Result**: The structured interpretation of a collected candidate, including extracted job attributes, 0-100 score factors, confidence, missing keywords, historical similarity signals from review and application outcomes when available, analysis status, and fallback/error information.
- **Search Run Analysis Summary**: Run-level visibility into how many candidates were deterministic-only, AI-assisted, fallback-processed, failed analysis, accepted, rejected, or duplicated.
- **Operator Review State**: Human-maintained fields such as review status (`unreviewed`, `reviewing`, `saved`, `ignored`), notes, saved/ignored decision, and later application progress tracked separately through `job_stage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can identify the top 10 review candidates from a completed 50-candidate run in under 5 minutes using score, contact, keyword, and status filters.
- **SC-002**: 100% of accepted `job` opportunities show whether their review profile is deterministic-only, AI-assisted, or fallback-processed.
- **SC-003**: At least 95% of accepted `job` opportunities contain a 0-100 score, score explanation, preserved source evidence, review status, and contact/source context; the remaining records must show a visible reason for incomplete review data.
- **SC-004**: Invalid or unavailable AI analysis results in zero corrupted review records; affected candidates remain reviewable through deterministic fallback or visible failure status.
- **SC-005**: Filtering by minimum score, keyword, contact availability, job stage/review status, provider status, and run/source context returns only matching `Full-time` job opportunities in validation scenarios.
- **SC-006**: Existing accepted `job` opportunities from prior runs remain readable and filterable after the feature is introduced.
- **SC-007**: `Freelance` records are not modified by job review analysis and do not appear in `Full-time` review result sets.

## Assumptions

- The primary actor is the project operator using the `Full-time` lane to review captured LinkedIn job opportunities before any outreach or application step.
- Optional AI-assisted analysis is an enrichment layer after deterministic collection, not a replacement for provider collection, source tracking, or deduplication.
- Deterministic parser/normalizer output remains the minimum acceptable fallback when AI analysis is not configured or fails validation.
- Score values are intended for prioritization and review, not for automatic acceptance, rejection, or sending.
- Historical scoring signals may be absent during early use; in that case, scoring relies on current opportunity evidence and keyword fit until enough outcome history exists. Once comparable review or application history exists, it adjusts rather than replaces the current match score.
- Campaign linkage may be absent for older records or runs that were not created from a campaign; filters should expose it only where available.
- Existing records may lack new review fields until migrated or viewed through defaults, but they must remain readable.
