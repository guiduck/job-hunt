## Command
speckit.specify

## Feature
Full-time Career-Page Search Diagnostics and Reliability

## Objective
Improve the Full-time extension career-page search so operators can trust why a run produced results,
duplicates, no results, or partial provider failures.

## Current Context
- The extension uses `POST /job-search-runs/career-page` and `GET /job-search-runs/career-page/latest`.
- Worker-owned processing queries curated sources through the career-page provider and persists
  accepted external-application jobs.
- A 2026-07-03 hotfix persists selected sources/limits in the popup, polls latest run state until
  terminal, clears stale opportunity cache after completion, and logs terminal source diagnostics.
- A second 2026-07-03 fix applies AI work-mode/region filters before creating career-page
  opportunities and enriches provider queries with remote/location include/exclude terms.
- A third 2026-07-03 operational fix marks career-page sources as `fetching` before provider calls
  and recovers stale `running` career-page runs as failed instead of leaving the extension blocked.
- A 2026-07-03 AI Field Assistant hotfix raised generated-answer question/context limits to 500,000
  characters for long company/job descriptions; future UI/API work must preserve this large-context
  behavior.
- Real runs still vary by provider response quality: some sources return useful results, some return
  duplicates, empty search results, or provider errors.

## Requirements
1. Surface per-source diagnostics in the extension after each career-page run: status, inspected,
   accepted, duplicate/rejected counts where available, and safe provider error summaries.
2. Preserve the operator's selected sources and limits across popup closes, reloads, and authenticated
   refreshes.
3. Make terminal states explicit in UI copy: completed with accepted jobs, completed with only
   duplicates, completed with no provider results, partial provider failure, and failed run.
4. Add explicit career-page location controls or make the existing AI filter region controls clearly
   apply to both LinkedIn capture and external career-page/API search.
5. Show AI-filter rejection counts/reasons for external jobs, including remote-only, hybrid/on-site,
   and excluded-region rejections.
6. Keep the Jobs external-application lane synchronized after terminal completion without stale cache.
7. Add API/worker tests for source diagnostics aggregation and extension tests for polling and
   persisted source selection.

## Guardrails
- Do not add scraping that bypasses ATS or search provider controls.
- Do not expose provider API keys or raw secret-bearing errors.
- Preserve existing Full-time opportunity contracts and owner scoping.
- Keep LinkedIn capture independent from career-page search controls.
