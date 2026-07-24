# API Contract: Full-time LinkedIn Jobs External Search

This contract describes owner-scoped backend behavior for the extension-led LinkedIn Jobs external search. Exact paths may follow existing route naming in `apps/api/app/api/routes/job_search_runs.py`, but the semantics below must be preserved.

## Authentication And Ownership

- All endpoints require the existing authenticated extension bearer/session behavior.
- Runs, candidates, and accepted opportunities are scoped to `current_user`.
- Cross-user run ids, candidate ids, and opportunity ids must return the existing unauthorized/not-found behavior.

## Create LinkedIn Jobs External Run

`POST /job-search-runs/linkedin-jobs-external`

Creates a run before the extension opens/navigates LinkedIn Jobs.

### Request

```json
{
  "searchText": "typescript remote backend",
  "searchMode": "classic_keywords",
  "queryTerms": ["typescript", "remote", "backend"],
  "datePosted": "past_week",
  "sort": "most_recent",
  "selectedSourceKeys": ["ashby", "lever", "greenhouse"],
  "maxPages": 15,
  "assistedSearchEnabled": false
}
```

### Response

```json
{
  "id": "run-id",
  "searchKind": "linkedin_jobs_external",
  "status": "pending",
  "maxPages": 15,
  "selectedSourceKeys": ["ashby", "lever", "greenhouse"],
  "createdAt": "2026-07-23T15:00:00Z"
}
```

### Rules

- `maxPages` defaults to 15 and rejects values above 30.
- `selectedSourceKeys` must be known curated sources.
- Date/sort are accepted only for classic mode unless a reliable assisted path is explicitly supported.
- API must not require LinkedIn credentials or cookies.

## Mark Run Running / Progress

`PATCH /job-search-runs/linkedin-jobs-external/{runId}`

Updates progress while the extension navigates LinkedIn.

### Request

```json
{
  "status": "running",
  "navigationMethod": "direct_url",
  "pagesVisited": 3,
  "jobsInspected": 42,
  "externalLinksFound": 8,
  "accepted": 4,
  "skippedEasyApply": 20,
  "unsupportedSource": 3,
  "duplicates": 1,
  "failures": 0,
  "safeMessage": "Inspecting page 3"
}
```

### Rules

- Progress updates must be idempotent and monotonic where practical.
- Safe diagnostics must not include LinkedIn cookies, session data, tokens, or full HTML blobs.
- A run cannot be updated by another user.

## Submit Inspected Candidate

`POST /job-search-runs/linkedin-jobs-external/{runId}/candidates`

Records one inspected LinkedIn Jobs result and optionally creates an external application opportunity when accepted.

### Request

```json
{
  "linkedinJobUrl": "https://www.linkedin.com/jobs/view/123",
  "jobTitle": "Senior Backend Engineer",
  "companyName": "Example Co",
  "locationText": "Brazil Remote",
  "applyButtonKind": "external",
  "rawApplyHref": "https://www.linkedin.com/safety/go?url=https%3A%2F%2Fjobs.ashbyhq.com%2Fexample%2Fabc",
  "decodedApplyUrl": "https://jobs.ashbyhq.com/example/abc",
  "canonicalApplyUrl": "https://jobs.ashbyhq.com/example/abc",
  "sourceKey": "ashby",
  "outcome": "accepted",
  "pageNumber": 2,
  "positionOnPage": 7
}
```

### Response

```json
{
  "candidateId": "candidate-id",
  "outcome": "accepted",
  "opportunityId": "opportunity-id",
  "duplicateOfOpportunityId": null
}
```

### Outcomes

- `accepted`
- `skipped_easy_apply`
- `unsupported_source`
- `duplicate`
- `failed_decode`
- `missing_external_apply`
- `inspection_failed`

### Rules

- `accepted` requires a canonical URL matching a selected curated source.
- Easy Apply outcomes must never create opportunities.
- Duplicate detection uses canonical external apply URL and existing owner-scoped opportunity identity rules.
- Unsupported source outcomes do not create denylist entries.

## Finalize Run

`POST /job-search-runs/linkedin-jobs-external/{runId}/complete`

Marks the run terminal.

### Request

```json
{
  "status": "completed",
  "terminalReason": "max_pages_reached",
  "pagesVisited": 15,
  "jobsInspected": 210,
  "externalLinksFound": 41,
  "accepted": 18,
  "skippedEasyApply": 132,
  "unsupportedSource": 19,
  "duplicates": 4,
  "failures": 2,
  "navigationMethod": "direct_url_with_geo"
}
```

### Rules

- Terminal status must unblock new LinkedIn Jobs external searches for the user.
- `completed_no_results` is valid when no accepted opportunities exist and diagnostics explain why.
- Terminal reason is required for failed or no-result runs.

## Latest/Active Run

`GET /job-search-runs/linkedin-jobs-external/latest`

Returns the most recent LinkedIn Jobs external run for the user, including safe counters and terminal reason.

## Curated Sources

`GET /job-search-runs/external-sources`

Returns the shared curated source registry used by career-page search and LinkedIn Jobs external search.

### Response

```json
{
  "sources": [
    {
      "key": "ashby",
      "label": "Ashby",
      "enabledByDefault": true
    }
  ]
}
```

## Compatibility Requirements

- Existing career-page search contracts continue to work with the same source keys.
- Existing LinkedIn post search/history contracts continue to use their current search kind.
- Existing Jobs `External applications` filters and mark-applied behavior remain unchanged.
- No endpoint in this contract may touch `apps/web` Freelance data.
