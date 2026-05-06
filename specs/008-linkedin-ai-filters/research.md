# Research: LinkedIn AI Filters

## Decision: Keep LinkedIn Search Broad

**Decision**: LinkedIn search input is limited to free-text query plus recent/relevant sort order. Region, remote-only, onsite/hybrid exclusion, and negative keywords are not added to the LinkedIn search URL or used to drop posts before capture.

**Rationale**: The project docs state that LinkedIn Boolean Search and advanced filtering are unreliable in the current flow. Capturing broadly preserves evidence and gives the app enough context to evaluate posts after collection. It also aligns with the constitution requirement for evidence-backed discovery.

**Alternatives considered**:

- Keep local pre-capture/post-DOM filtering in the extension: rejected because it can hide useful posts before the worker can inspect full evidence.
- Encode filters into the LinkedIn query text: rejected because it depends on unreliable provider behavior and makes debugging harder.

## Decision: AI Filters Are Explicitly Opt-In

**Decision**: New searches default to AI filters disabled. The user must explicitly enable the AI filters section before filter settings affect candidate evaluation.

**Rationale**: This avoids surprise AI usage, cost, latency, and behavior changes. It also preserves compatibility with current deterministic/local behavior and keeps AI an optional quality layer.

**Alternatives considered**:

- Remember the user's last AI filter setting: deferred because this could surprise users after testing strict filters once.
- Enable AI filters automatically when backend AI config is available: rejected because configuration availability does not imply operator intent.

## Decision: Store Filter State Separately From Review Analysis

**Decision**: Add AI filter settings and outcome fields separate from existing review intelligence fields such as `analysis_status`, `match_score`, and `review_status`.

**Rationale**: Filtering answers "should this captured candidate become an accepted opportunity?", while review analysis answers "how good is this accepted opportunity for the operator?". Keeping statuses separate avoids conflating AI filter fallback with review analyzer fallback.

**Alternatives considered**:

- Reuse `analysis_status`: rejected because current review intelligence already uses it for deterministic/AI-assisted scoring.
- Only store filter output inside existing `score_factors`: rejected because run diagnostics and candidate filters need first-class fields.

## Decision: Filter After Parsing/Normalization, Before Opportunity Creation

**Decision**: The worker evaluates AI filters after capture, parsing, and deterministic normalization determine the candidate is otherwise acceptable, but before creating an accepted opportunity.

**Rationale**: The filter needs normalized title, description, source, contact, and evidence context. Running before opportunity creation prevents rejected candidates from entering the review/outreach list while still preserving candidate evidence.

**Alternatives considered**:

- Filter raw captured posts before parsing: rejected because raw text lacks normalized context and makes deterministic fallback weaker.
- Create opportunities first and mark rejected later: rejected because it pollutes the Jobs list and bulk send surfaces with candidates the operator intended to filter out.

## Decision: Deterministic Fallback Is The Compatibility Baseline

**Decision**: Missing AI config, disabled AI filters, invalid structured output, unavailable provider, rate limit, and confidence below 0.70 all fall back to current deterministic/local rules. Otherwise valid candidates continue when they pass those existing rules.

**Rationale**: Capture must not crash or become useless when AI is unavailable. This matches the clarified spec and protects current local operation while still recording fallback status and reason for diagnostics.

**Alternatives considered**:

- Hold candidates for diagnostics only when AI cannot decide: rejected because it would reduce current capture usefulness.
- Fail the whole run if AI is enabled but unavailable: rejected because AI is optional and should not become a hard dependency.
- Reject all low-confidence AI decisions: rejected because low confidence means the AI should not be trusted.

## Decision: Use Structured AI Output With Validated Signals

**Decision**: AI filter output must validate to a structured shape containing pass/reject, status, reason, confidence, and normalized signals for work mode, accepted/rejected regions, countries/time zones, and matched exclusion keywords.

**Rationale**: Structured output supports contracts, tests, fallback, and diagnostics. It also prevents raw model prose from silently controlling candidate acceptance.

**Alternatives considered**:

- Use free-text AI explanations only: rejected because counters and filtering cannot reliably consume prose.
- Store only pass/reject: rejected because the operator needs reasons and signals to debug false positives/negatives.

## Decision: Counters Distinguish Filter Rejections From Existing Rejections

**Decision**: Run diagnostics add AI-filter-specific counters while preserving existing inspected, accepted, rejected, duplicate, and provider/analysis counters.

**Rationale**: The operator needs to know whether a run is noisy because LinkedIn returned poor matches, because deterministic contact/evidence rules rejected candidates, because AI filters rejected them, or because duplicates/failed evaluation dominated.

**Alternatives considered**:

- Fold AI filter rejections into existing `rejected_count`: rejected because it hides whether the new filter is helping or over-filtering.
- Replace existing counters with a new aggregate: rejected because it would break existing UI and tests.
