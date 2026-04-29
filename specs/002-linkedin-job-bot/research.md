# Research: LinkedIn Job Bot Foundation

## Decision: Backend-triggered runs with worker execution

**Decision**: The API will expose operations to start a LinkedIn job-search run and inspect run status/results, while the actual search, parsing, filtering, and persistence execute through the worker boundary.

**Rationale**: This preserves the project rule that long-running search jobs stay outside request handlers while still giving the operator a backend-controlled workflow.

**Alternatives considered**:

- Local command only: simpler, but does not satisfy the clarified requirement for backend-triggered status/result inspection.
- API request performs search inline: rejected because it violates the architecture boundary and would make timeouts/retries harder to manage.

## Decision: Search run lifecycle and observability

**Decision**: Each run will store status, requested keywords, inspected candidate count, accepted opportunity count, rejected/incomplete counts, whether the 50-candidate cap was reached, timestamps, and a visible error message when failed.

**Rationale**: The operator needs to distinguish pending/running/completed/no-results/failed states and understand why a run produced or skipped opportunities.

**Alternatives considered**:

- Store only accepted opportunities: rejected because failed, blocked, and no-result runs would be invisible.
- Log-only run tracking: rejected because task validation and API status inspection require durable run state.

## Decision: Accepted opportunities require public contact

**Decision**: Only candidates with a public email or public contact channel become accepted review opportunities.

**Rationale**: The user's first value target is seeing companies with emails/contact channels. This keeps the first skeleton focused on actionable `Full-time` opportunities.

**Alternatives considered**:

- Store all relevant matches: rejected for this feature because it would create review noise before contact discovery is reliable.
- Store no-contact matches as leads: rejected because the spec requires accepted review opportunities to be contactable.

## Decision: 50-candidate validation cap

**Decision**: Each automated LinkedIn job-search run inspects at most 50 candidates and records when the cap is reached.

**Rationale**: This is large enough to validate matching, extraction, deduplication, and run metrics while keeping the first automated scraper bounded.

**Alternatives considered**:

- 10-candidate smoke run: too small to validate dedupe and filtering quality.
- 200+ candidate batch: too broad for a first local validation skeleton.
- No fixed cap: rejected because it increases platform-boundary, rate-limit, and operational risk.

## Decision: Deduplication identity

**Decision**: Deduplicate accepted opportunities by company, job title/headline, matched keyword set, and public contact channel.

**Rationale**: The operator wants to see companies with emails/contact channels, and LinkedIn URLs can vary or be unavailable. This identity keeps company/contact visibility central while avoiding obvious repeats.

**Alternatives considered**:

- Source URL first: useful for traceability, but less aligned with the user's company/email review goal.
- Contact channel only: rejected because one recruiter or email may publish multiple jobs.
- Always store repeats: rejected because it creates avoidable review noise.

## Decision: Structured job details over raw text only

**Decision**: Accepted opportunities must expose structured fields for company, title/headline, full job description when available, contact channel, source, query, matched keywords, evidence, and job stage. Raw text may be retained as supporting context but cannot be the only representation.

**Rationale**: Structured review fields are required for later CRM filtering, email preparation, and quality validation.

**Alternatives considered**:

- Store raw post content only: rejected because it blocks filtering and testable acceptance criteria.
- Require every field to be present: rejected because public posts may omit some fields; contact channel and evidence remain mandatory for acceptance.

## Decision: LinkedIn access and compliance boundary

**Decision**: The first skeleton may attempt automated LinkedIn search, but it must use only public or user-provided data, record inaccessible/rate-limited states as run failures or partial outcomes, and avoid fabricated opportunities.

**Rationale**: The spec requires automation, while the constitution requires platform-specific constraints to be reviewed before scale.

**Alternatives considered**:

- Fully authenticated/aggressive scraping: rejected as too risky for this feature.
- Fixtures only: rejected because the clarified source mode requires automated LinkedIn search in the first skeleton.
