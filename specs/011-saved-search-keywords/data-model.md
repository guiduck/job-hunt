# Data Model: Saved Search Keywords

## Entity: JobSearchPreference

Owner-scoped Full-time search preference that stores the last Search input confirmed by capture.

**Fields**:

- `id`: unique identifier
- `user_id`: owner user identifier
- `opportunity_type`: fixed to `job` for this feature
- `last_search_text`: the most recent Search field text confirmed when the operator started capture
- `last_search_keywords`: normalized keywords parsed from `last_search_text` for display/debug parity
- `created_at`: creation timestamp
- `updated_at`: update timestamp

**Validation Rules**:

- `user_id + opportunity_type` must be unique.
- `last_search_text` must be trimmed and must not be replaced by blank/whitespace-only input.
- `last_search_keywords` must contain normalized, deduped terms parsed from `last_search_text`.
- Queries and mutations must always be owner-scoped.
- This entity does not control AI filter settings.

**Lifecycle**:

1. User opens Search.
2. System loads the owner's `job` preference.
3. If `last_search_text` exists, the Search input is prefilled from it.
4. When the operator starts capture with non-empty input, the input becomes the new `last_search_text`.
5. Historical runs keep their original requested keywords and source query even when this preference changes.

## Entity: SavedSearchKeywordLibrary

Owner-scoped reusable keyword badge library for the Full-time Search view. This may reuse the existing keyword-set concept as long as it preserves the rules below.

**Fields**:

- `id`: unique identifier
- `user_id`: owner user identifier
- `opportunity_type`: fixed to `job` for this feature
- `source`: `manual`
- `terms`: ordered list of normalized saved keyword badges
- `is_active`: boolean
- `is_default`: boolean for the active/default Full-time library
- `created_at`: creation timestamp
- `updated_at`: update timestamp

**Validation Rules**:

- `user_id + opportunity_type + source + is_default active library` must resolve to one active library for the MVP.
- `terms` must be trimmed, non-empty, case-insensitively deduped, and limited to 30 values.
- Saved badge terms must not be deleted by capture persistence.
- Saved badge terms can be removed only by explicit badge delete behavior.
- Saved badge terms must remain owner-scoped and must not cross into `freelance`.

**Lifecycle**:

1. User opens Search.
2. System loads the owner's saved badge terms.
3. Badges render below the Search input.
4. Clicking a badge adds that term to the current input if not already present.
5. Starting capture parses the current input and appends newly normalized terms into `terms`, up to 30 saved badges.
6. Clicking a badge `X` removes that term from `terms`.
7. Removing a word from the current input changes the next run input but does not remove the saved badge.

## Entity: SearchInputState

Extension-side transient state for the current Search field.

**Fields**:

- `text`: current operator-visible Search input value
- `normalized_keywords`: normalized terms parsed from `text`
- `source`: `last_search`, `starter_default`, or `operator_edit`
- `dirty`: whether the operator has changed the hydrated value during this popup session

**Validation Rules**:

- Capture must use this current state, not all saved badges.
- Empty text should not create blank saved badges.
- The extension may keep transient text locally for UX, but authenticated server state is the source after login/session validation.

## Entity: JobSearchRun

Existing run entity used by capture and worker processing.

**Fields Used By This Feature**:

- `requested_keywords`: normalized keywords from current Search field at capture time
- `search_query`: combined Search field text/source query recorded for traceability
- `keyword_set_id`: optional link to the saved keyword library active when the run was created
- `user_id`: owner user identifier

**Validation Rules**:

- Run requested keywords and search query are immutable evidence after creation.
- Later edits to last search or saved badges must not mutate historical runs.
- Existing lifecycle, counters, AI filters, provider status, and worker behavior remain unchanged.

## Existing Entities Used

### User

All preference records belong to one authenticated user. No team/workspace behavior is introduced.

### Opportunity and JobOpportunityDetail

Existing opportunity records keep their matched keywords, source query, source evidence, and dedupe data. Saved keyword preference edits must not rewrite them.
