# Extension Contract: Saved Search Keywords

## Search Hydration

When an authenticated session is validated:

1. Extension requests `GET /job-search-preferences?opportunity_type=job`.
2. If `last_search_text` is present, Search input is set to that value.
3. `saved_keywords` render as badges below the Search input.
4. AI filter state is not changed by this hydration.

When no preference exists:

- Search input falls back to the existing starter state.
- Badge list is empty or seeded only by server-provided defaults.

## Badge Interactions

### Add Badge To Search Input

Trigger: operator clicks a saved keyword badge body.

Expected behavior:

- If the term is not present in the current Search input, append it as a space-separated word.
- If the term is already present case-insensitively, do not duplicate it.
- Do not start capture automatically.
- Do not change AI filters.

### Delete Badge

Trigger: operator clicks a badge `X`.

Expected behavior:

- Call `DELETE /job-search-preferences/keywords/{keyword}`.
- Remove the badge from UI after success.
- Do not remove the same word from current Search input automatically.
- Do not mutate historical runs or opportunities.

## Capture Start

Trigger: operator clicks `Open LinkedIn and capture`.

Expected behavior:

1. Normalize current Search input into requested keywords.
2. Persist the current Search input via `PUT /job-search-preferences`.
3. Merge new normalized terms into saved badge list up to 30 terms.
4. Start capture with current Search input and normalized keywords only.
5. Keep optional AI filter settings exactly as selected by the operator.

Failure behavior:

- If preference persistence fails but capture can still proceed, show a recoverable warning and use current typed input for capture.
- If run creation/capture fails, show the existing capture error path.
- Never delete old saved badges during capture.

## Logout/User Switch

When the operator logs out:

- Clear owner-scoped Search preference state from the popup store.
- Do not show previous user's badges to the next user.
- On next login, hydrate from the authenticated owner's server state.
