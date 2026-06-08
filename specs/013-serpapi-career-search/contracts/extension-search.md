# Extension Contract: Curated Career Page Search

## Search Tab Behavior

The Plasmo `SearchView` adds a career-page search control below the existing LinkedIn search action.

Inputs reused:

- keyword/search query input
- maximum opportunity count

Inputs specific to career-page search:

- source checkboxes for:
  - InHire
  - Ashby
  - Lever
  - Greenhouse
  - SmartRecruiters
  - Trampos
  - Catho

Default state:

- all active sources checked
- career-page button enabled only when the user is authenticated, at least one source is selected, keywords are present, and no career-page run is currently pending/running
- latest career-page search timestamp or relative time displayed next to the button

LinkedIn-specific settings:

- LinkedIn sort remains relevant only to LinkedIn if supported.
- LinkedIn max scrolls/max posts do not affect career-page search behavior.

## Button State

Idle:

- Label: `Search career pages` or equivalent compact label.
- Shows latest run time nearby, e.g. `Last: 4:12 PM` or `Last: 18m ago`.

Running:

- Button disabled.
- Label indicates running/searching state.
- UI shows run status/counters from API polling.

Error:

- Button re-enabled when run reaches terminal failure.
- Error copy must identify provider/search failure without affecting LinkedIn search availability.

## Jobs View Behavior

Jobs list provides segmented views:

- `With email`
- `External applications`

`With email` includes:

- LinkedIn jobs with usable email.
- Career-page jobs with usable email, even when they also have an apply URL.

`External applications` includes:

- Career-page jobs without usable email and with usable apply URL.

External application bulk actions:

- delete selected
- no bulk open
- no bulk email

## Card Behavior

Shared card fields where available:

- title/role
- company
- source name
- source evidence/description excerpt
- matched keywords
- match score/explanation
- status

Email job cards:

- existing email actions stay available
- apply URL may be available from detail/supporting action

External application cards:

- primary action opens one job/apply URL
- no send email action
- manual `Mark applied` action sets `job_stage=applied`

## Dashboard Behavior

Dashboard displays separate Full-time counts:

- email jobs
- email jobs not sent
- external applications
- external applications not applied

Counts must come from API metrics and not from current Jobs pagination state.

