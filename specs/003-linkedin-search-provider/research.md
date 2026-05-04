# Research: LinkedIn Search Provider

## Decision: Worker-side provider boundary

Use a dedicated worker-side LinkedIn provider/fetcher boundary that returns raw candidate dictionaries to the existing parser and normalizer.

**Rationale**: The current worker already has `inspect_candidates`, `parse_candidate`, and `normalize_candidate`. A provider boundary keeps external collection isolated from candidate interpretation, makes blocked/empty provider behavior testable, and preserves the API/worker split.

**Alternatives considered**:

- Put collection in the API route: rejected because long-running collection must not run in request handlers.
- Merge fetching into the parser: rejected because parsing already has a clear responsibility and tests are simpler when fetching is separate.
- Replace parser/normalizer entirely: rejected because the existing skeleton is the intended base for this incremental feature.

## Decision: Automatic publication search query shape

Generate automatic search queries from hiring-intent terms plus job keywords. Initial hiring-intent terms are `hiring`, `contratando`, and `contratamos`; job keywords come from configured keywords or fallback `reactjs`, `typescript`, `nextjs`, and `nodejs`.

**Rationale**: The product goal is to find LinkedIn publications where people explicitly post job opportunities. Hiring-intent terms reduce generic technology posts, while keyword matching keeps results tied to the operator profile.

**Alternatives considered**:

- Search only by technology keywords: rejected because it would collect too many non-job posts.
- Search only by hiring terms: rejected because it would not stay specialized to the user's stack.
- Add many hiring terms immediately: deferred to avoid overfitting and to keep the first run explainable.

## Decision: Local validation sources

Support automatic public LinkedIn publication search plus user-provided LinkedIn URLs and pasted public content as validation/fallback sources.

**Rationale**: LinkedIn may block, limit, or hide public content in local environments. User-provided sources make the end-to-end flow testable without fabricating opportunities, while automatic search remains the primary target behavior.

**Alternatives considered**:

- Require live public LinkedIn search only: rejected because local validation could become impossible when LinkedIn blocks access.
- Use user-provided content only: rejected because it would not satisfy the "true scraper" direction.
- Add authenticated scraping: rejected because the feature is restricted to public or user-provided data and must not bypass access controls.

## Decision: Contact channel acceptance priority

Accept public email as the preferred contact channel. Also accept explicit LinkedIn DM contact when the publication text says the poster can be contacted by DM and the poster profile link is available.

**Rationale**: Public email is the strongest signal for the planned manual application workflow. Explicit LinkedIn DM with a profile link is still actionable when the post itself invites it, but it should not override email when both exist.

**Alternatives considered**:

- Accept only email: rejected because the user wants explicit LinkedIn DM instructions to count.
- Accept any recruiter profile link: rejected because a profile link alone is not the same as a contact invitation.
- Accept generic contact forms: deferred until the product defines how to review and use them.

## Decision: Provider failure outcomes

Represent blocked, inaccessible, empty, malformed, and parse-failed collection attempts as visible run or candidate outcomes, creating zero accepted opportunities for those cases.

**Rationale**: The constitution requires evidence-backed discovery and platform-boundary awareness. Visible failures keep the operator from confusing "nothing found" with "system did not run" and prevent fabricated data.

**Alternatives considered**:

- Treat all provider failures as run failure: rejected because some runs may have partial candidate successes and individual failed sources.
- Ignore inaccessible sources silently: rejected because it hides quality and compliance signals.
- Retry aggressively: deferred because retry/rate-limit policy should be conservative until real behavior is observed.

## Decision: Additive data model changes

Extend existing run/candidate records with source type, hiring-intent term, provider status, and richer contact metadata instead of replacing the `002` foundation.

**Rationale**: The current branch already created job-search runs, candidate outcomes, opportunities, job details, and deduplication. Additive fields preserve compatibility and keep task scope focused on collection.

**Alternatives considered**:

- Create a separate LinkedIn scrape table detached from runs: rejected because it would duplicate candidate outcome tracking.
- Store raw HTML only: rejected because accepted opportunities need structured review fields.
- Split job opportunities into a separate root table: rejected because the project requires shared opportunity infrastructure for `job` and `freelance`.
