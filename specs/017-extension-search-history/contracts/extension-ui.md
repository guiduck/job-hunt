# Extension UI Contract: Search History

## Navigation

Add `history` as a first-class tab in the authenticated popup navigation:

```ts
type PopupTab = "dashboard" | "search" | "history" | "jobs" | "templates" | "settings"
```

The tab is hidden when no authenticated user exists, following current popup behavior.

## History View

The History view contains three operational sections:

- 20 most recent LinkedIn Search runs
- Exact query aggregates
- Date-independent keyword/token ranking

The view must use compact, scan-friendly rows suitable for the popup. It should not introduce a landing page or marketing copy.

## Recent Run Row

Each row shows:

- Query text
- Keyword tokens
- Status
- Run time
- Raw LinkedIn results, or `Unknown` when unavailable
- Accepted
- Rejected
- Duplicate
- AI passed/rejected/fallback/failed/skipped counters when non-zero or when details are expanded
- Safe diagnostic message for failed/partial runs

Actions:

- Open run detail or existing diagnostics
- Open candidates for the run
- Open opportunities accepted from the run

## Aggregate Rows

Each aggregate row shows:

- Query/token value
- Run frequency
- Total raw LinkedIn results
- Average raw LinkedIn results
- Unknown raw-count run count when greater than zero
- Accepted count
- Duplicate count
- Latest run time

Rules:

- Unknown raw counts are labeled and excluded from averages.
- Duplicate count is displayed separately and never subtracted from raw results.
- Exact query and keyword/token aggregates are visually distinct.
- The best-keyword ranking is date-independent by default and appears below the 20-run list.
- Dates/latest-run values are diagnostic context for possible duplicates, not the default ranking scope.

## Filters And Sorting

Minimum controls:

- Text filter across query and keyword/token
- Status filter for 20 recent runs
- Sort the 20-run list by latest run, total raw results, average raw results, accepted count, or duplicate count; keyword ranking remains date-independent

## Empty / Loading / Error States

- Loading: show a compact loading state without resizing the tab nav.
- Empty: say there are no LinkedIn Search runs yet.
- Error: show a safe retry affordance and sanitized error text.

## Non-Goals

- No changes to Freelance web app navigation or UI.
- No Email/WhatsApp/outreach controls in History.
- No career-page/ATS aggregate in the first release.
