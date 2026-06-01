# Quickstart: Saved Search Keywords

This quickstart validates the planned feature after implementation.

## 1. Start Local Services

```bash
docker compose up -d
docker compose ps
```

Confirm API health:

```bash
curl http://localhost:8000/health
```

## 2. Run API Validation

```bash
docker compose exec api python -m compileall app alembic
docker compose exec api python -m pytest \
  tests/contract/test_job_search_preferences_contract.py \
  tests/contract/test_job_search_runs_contract.py \
  tests/integration/test_job_search_preferences.py \
  tests/integration/test_job_search_preferences_ownership.py \
  tests/integration/test_linkedin_ai_filters_compatibility.py
```

Expected results:

- last search and saved badges are owner-scoped
- saved badges are capped at 30
- capture-time preference save merges new terms and does not delete old badges
- badge delete removes only the selected saved badge
- run creation still records requested keywords and search query
- AI filter payload compatibility remains intact

## 3. Run Extension Validation

```bash
cd apps/extension
npm run typecheck
npm run build
```

Expected results:

- no TypeScript errors
- production build succeeds
- Search view can render input and badges without layout overflow

## 4. Manual Chrome Smoke

1. Load the extension build in Chrome.
2. Log in as User A.
3. Open Search.
4. Type `react typescript remoto`.
5. Start capture.
6. Confirm the Search input remains or later reloads as `react typescript remoto`.
7. Confirm badges appear for `react`, `typescript`, and `remoto`.
8. Remove `remoto` from the Search input and start capture again.
9. Confirm the new run uses only the current Search field terms, while the `remoto` badge still exists.
10. Click the `remoto` badge body and confirm it can be added back to the Search field.
11. Click the `X` on the `remoto` badge and confirm only that badge disappears.
12. Confirm AI filter values did not change.
13. Log out.
14. Log in as User B.
15. Confirm User A's last search and badges are not visible.

## 5. Safety Checks

- Empty Search input must not create blank badges or wipe a useful last search.
- Repeated input such as `React react REACT` creates one `react` badge.
- Pasted input with more than 30 unique terms stores no more than 30 saved badges.
- Editing badges must not mutate existing opportunities, matched keywords, source evidence, dedupe keys, or historical run requested keywords.
- The discarded external job source remains absent from Search UI and configuration.

## 6. Regression Checks

Validate existing Full-time flows still work:

- LinkedIn capture opens and reports run feedback.
- Jobs list pagination/search still works.
- Dashboard metrics still come from aggregate API metrics.
- AI filters remain optional and disabled by default.
- Google primary auth remains separate from Gmail OAuth/send.
