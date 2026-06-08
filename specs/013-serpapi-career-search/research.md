# Research: Curated Career Page Search

## Decision: Use a worker-owned curated web search provider adapter

**Decision**: Add a worker-side provider adapter for curated career-page search using the configured search provider key. The API creates an owner-scoped run; the worker performs provider calls, normalization, AI evaluation, dedupe, and opportunity creation.

**Rationale**: External provider calls can be slow, costly, and failure-prone. Keeping them in the worker preserves the architecture rule that long-running search work stays outside HTTP request handlers and keeps provider secrets out of the Plasmo extension.

**Alternatives considered**:

- API performs provider calls synchronously: rejected because searches can take time and would make the HTTP process own retries/costly work.
- Extension calls provider directly: rejected because it would expose the search provider key and duplicate backend ownership logic.
- Reuse LinkedIn content capture code: rejected because career-page search is provider-based and does not use browser scroll/capture settings.

## Decision: Reuse existing run/candidate/opportunity concepts with additive schema

**Decision**: Extend `job_search_runs`, `job_search_candidates`, `opportunities`, and `job_opportunity_details` with additive fields/enums/JSON metadata for external source selection, application kind, provider diagnostics, apply URLs, and stop reasons.

**Rationale**: The existing LinkedIn path already tracks owner scope, status, counters, candidates, outcomes, AI diagnostics, dedupe, and opportunities. Reusing the shape avoids a parallel job-search domain while preserving existing contracts.

**Alternatives considered**:

- Separate `external_search_runs` and `external_job_candidates` tables: rejected for this first slice because it duplicates lifecycle/counter concepts already present.
- Store external results only as opportunities: rejected because rejected/noisy candidates need diagnostics and source-level counters.
- Store everything in raw JSON only: rejected because lists, metrics, dedupe, and future ATS resume generation need structured fields.

## Decision: Classify email-bearing jobs into `With email`

**Decision**: If a career-page result contains any usable captured email in the description or reliable captured context, classify it as a `With email` job and keep it eligible for the same Gmail/bulk email flow as LinkedIn jobs. Preserve apply URL in detail as supporting context.

**Rationale**: The highest-value current flow is email outreach with reviewed templates and resume attachment. The apply URL remains useful for manual fallback, but should not remove the job from email operations.

**Alternatives considered**:

- Always route career-page jobs to `External applications`: rejected because it would hide email-ready jobs from the current send workflow.
- Create a `Hybrid` lane: rejected because it adds UI complexity before there is evidence that a third lane improves daily operation.

## Decision: No-email jobs become external applications

**Decision**: A career-page job without usable email but with a usable official job/apply URL becomes an external application job. It appears under `External applications`, supports one-at-a-time URL opening, deletion, and manual `job_stage=applied`.

**Rationale**: These jobs are useful, but they require manual application through an external site. The AI field assistant can help after the operator opens the page, without automating form submission.

**Alternatives considered**:

- Reject all jobs without email: rejected because the new product direction is explicitly to support official application URLs.
- Bulk-open URLs: rejected because it is noisy, hard to track, and likely to produce a poor operator experience.

## Decision: Use existing `job_stage=applied` for manual external applications

**Decision**: Manual external application updates the existing `job_stage` to `applied` and does not create Gmail send requests or outreach events.

**Rationale**: The existing job-stage enum already captures the operator state. A separate status would add schema/UI complexity without adding new meaning.

**Alternatives considered**:

- Add `external_applied`: rejected because it fragments status semantics.
- Store external application only as a note/interaction: rejected because dashboard metrics and filters need a direct status.

## Decision: Fresh provider search on every `/search` button click

**Decision**: Every career-page button click creates a fresh provider search run. Accepted jobs remain persisted as opportunities and are subject to a roughly 1-month lifecycle planning rule.

**Rationale**: The operator expects the button to search now, not silently reuse old provider results. Persistence belongs in the database as opportunities and diagnostics, not as invisible provider cache behavior.

**Alternatives considered**:

- 24-hour provider result cache: rejected for product clarity; it could make repeated button clicks feel stale or confusing.
- Cross-user cache: rejected because the product is owner-scoped and future billing/cost policy should be explicit.

## Decision: Use both accepted-opportunity max and inspected-candidate cap

**Decision**: A run stops when it reaches the operator-requested accepted opportunity maximum, when no more fresh supported results are available, or when a configurable cost-based inspected-candidate cap is reached. The initial cap value should be tuned during implementation/testing.

**Rationale**: Some sources may produce stale or irrelevant results. A candidate cap prevents unbounded provider/AI spend and prepares the app for published usage where cost controls matter.

**Alternatives considered**:

- Accepted max only: rejected because a low acceptance rate can cause long and costly runs.
- Fixed small per-source cap: rejected because source quality varies and the operator already provides a global target.
- User max means candidates, not accepted opportunities: rejected because the operator cares about usable jobs.

## Decision: Initial active sources selected by default

**Decision**: InHire, Ashby, Lever, Greenhouse, SmartRecruiters, Trampos, and Catho are all active and checked by default, while the operator can uncheck any source before starting the run.

**Rationale**: Default selection reduces friction for testing and daily operation, while still making the source set visible and controllable.

**Alternatives considered**:

- No sources checked by default: rejected because it adds an unnecessary first-use hurdle.
- Only international sources checked: rejected because the curated list is intentionally active for the first test slice.

## Decision: External run UI shows latest search time and disables duplicate starts

**Decision**: The Search tab shows the latest career-page search timestamp or short relative time next to the career-page button, and disables the button while an owner-scoped career-page run is pending/running.

**Rationale**: Provider searches may be slow. Clear state prevents accidental duplicate cost and helps the operator understand whether the displayed progress is current.

**Alternatives considered**:

- Let duplicate runs start freely: rejected due to cost and confusion.
- Hide long-running state in diagnostics only: rejected because the button itself is the operator's control point.

