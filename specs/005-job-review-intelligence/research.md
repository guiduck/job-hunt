# Research: Job Review Intelligence

## Decision: Keep analysis in the worker after deterministic collection

**Rationale**: Existing architecture requires long-running search and enrichment work to stay outside HTTP request handlers. Candidate analysis can be slow, optional, or dependent on credentials, so it belongs in the worker immediately after provider/parser/normalizer output and before final persistence of accepted opportunities.

**Alternatives considered**:

- Run analysis in API request handlers: rejected because it violates the API/worker boundary and would make run creation depend on slow enrichment.
- Run analysis as a separate service: rejected for v1 because the current single worker is enough for tens of local runs and one extra service would add operational complexity.

## Decision: Use deterministic scoring as the baseline

**Rationale**: The spec requires deterministic fallback whenever AI is disabled, invalid, or unavailable. A baseline scorer can combine matched keywords, missing keywords, role/company extraction, contact availability, source evidence, provider status, and historical adjustment signals into a 0-100 score. This gives useful review fields even without AI credentials.

**Alternatives considered**:

- AI-only scoring: rejected because it could make records opaque and unavailable without AI configuration.
- Keyword-count-only scoring: rejected because it cannot explain contact/evidence quality, provider failures, or historical outcome feedback.

## Decision: Store review-ready fields on accepted job details and candidate rows

**Rationale**: Operators need the same analysis visibility from run candidates and accepted opportunities. Candidate rows explain how the worker processed each source item; accepted job detail rows power the `Full-time` review list/detail filters. Additive fields on both existing tables avoid a broad data model split and keep API responses simple.

**Alternatives considered**:

- Store review profile only on candidates: rejected because global opportunity filters would require joins back through run candidates and would not cover older accepted opportunities cleanly.
- Store review profile only on opportunities: rejected because failed/fallback candidate analysis would not be visible at run/candidate level.
- Add a separate review profile table: deferred because one-to-one profile fields are narrow enough for additive columns in v1.

## Decision: Represent analysis status explicitly

**Rationale**: Operators must distinguish deterministic-only records from AI-assisted records and fallback cases. An explicit enum avoids guessing from error strings or score factors.

**Chosen statuses**:

- `deterministic_only`: AI was disabled or not configured; deterministic analysis produced review fields.
- `ai_assisted`: AI returned valid structured output and it contributed to review fields.
- `fallback`: AI was attempted but invalid, unavailable, or incomplete; deterministic analysis produced review fields.
- `failed`: neither AI nor deterministic analysis produced a complete review profile.
- `skipped`: analysis was intentionally skipped for a provider failure, duplicate, or non-reviewable candidate.

**Alternatives considered**:

- Boolean `ai_assisted`: rejected because it cannot distinguish fallback, skipped, and failed states.
- Free-text status: rejected because filters/tests need stable values.

## Decision: Keep `review_status` separate from `job_stage`

**Rationale**: Review status tracks inspection work before application. `job_stage` tracks the later application lifecycle. Keeping them separate allows an opportunity to be `saved` for review while still having `job_stage=new`, or to be `ignored` for review without implying an application outcome.

**Chosen review statuses**:

- `unreviewed`
- `reviewing`
- `saved`
- `ignored`

**Alternatives considered**:

- Reuse `job_stage`: rejected because it would mix review decisions with application outcomes.
- Add a larger CRM stage set: rejected for v1 because the prototype needs only initial review readiness.

## Decision: Historical outcomes adjust, but do not replace, current match score

**Rationale**: Early history will be sparse and noisy. Current opportunity evidence should remain the primary score source. Comparable past review outcomes (`saved`, `ignored`) and later application outcomes (`responded`, `interview`, `rejected`, `ignored`) can adjust the score when enough similar keywords or descriptions exist.

**Alternatives considered**:

- Ignore historical outcomes in v1: rejected because the user explicitly wants score to learn from past responses/success/acceptance.
- Let historical outcomes dominate after one similar record: rejected because it overfits and can hide current evidence quality.

## Decision: Validate AI output as structured analysis, not raw text

**Rationale**: The AI step must receive only already-collected public or user-provided text plus metadata, and it must return structured fields that match project schemas before persistence. Invalid or incomplete output is recorded as fallback/failed analysis and never replaces deterministic fields as trusted data.

**Alternatives considered**:

- Persist raw AI JSON without validation: rejected because it creates opaque and fragile records.
- Let AI browse or fetch sources: rejected because provider collection must remain deterministic and traceable.

## Decision: Extend existing API contracts additively

**Rationale**: Existing `/job-search-runs`, `/job-search-runs/{id}/candidates`, `/job-search-runs/{id}/opportunities`, and `/opportunities?opportunity_type=job` contracts are already implemented and tested. The safest path is adding response fields, filters, and update fields without changing existing required request behavior.

**Alternatives considered**:

- Create a new `/job-review` API surface: rejected because it would duplicate opportunity list/detail behavior before the future web exists.
- Rename existing fields: rejected as a breaking change.
