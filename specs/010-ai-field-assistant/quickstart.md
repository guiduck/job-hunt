# Quickstart: AI Field Assistant

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
docker compose exec api python -m compileall app
docker compose exec api python -m pytest \
  tests/contract/test_field_assistant_contract.py \
  tests/integration/test_field_assistant_activation.py \
  tests/integration/test_field_response_suggestions.py \
  tests/integration/test_field_answer_generation.py \
  tests/integration/test_field_assistant_ownership.py
```

Expected results:

- activation scopes are owner-scoped
- base-domain and exact-page activation rules are enforced
- generated answers use sanitized field context only
- suggestions save only after explicit request
- at most 3 suggestions remain per owner+keyword

## 3. Run Extension Validation

```bash
cd apps/extension
npm run typecheck
npm run build
```

Expected results:

- no TypeScript errors
- production build succeeds
- no secret values are bundled into extension-visible code

## 4. Manual Chrome Smoke

1. Load the extension build in Chrome.
2. Open the extension while logged out.
3. Confirm only login/register/reset UI is visible; title/nav/operational tabs are hidden.
4. Log in with an existing app account.
5. Open a local or external test page with:
   - one textarea asking "Why do you want this role?"
   - one contenteditable long-answer field
   - one password field
   - one search input
   - one short email field
6. Confirm no field assistant appears before enabling the domain/page.
7. Open the extension and enable assistant for the base domain.
8. Confirm magic-wand actions appear only on eligible long-answer fields.
9. Generate an answer for the motivation field.
10. Confirm the answer is reviewable before insertion.
11. Insert the answer and confirm the form is not submitted.
12. Choose not to save; reopen the same keyword and confirm the answer is not listed as reusable.
13. Generate or edit another answer and explicitly save it.
14. Reopen the same keyword and confirm the saved response appears.
15. Save more than 3 responses for the same keyword and confirm only 3 remain.
16. Minimize, restore, and close the persistent shell.
17. Confirm the old authenticated `Keep open` primary action is gone or replaced by the shell path.
18. Sign out and confirm injected controls disappear or become inactive.

## 5. Safety Checks

- Password, OTP, payment, phone, card, document, search, and short email fields must not show assistant controls.
- Generated-answer requests must contain only sanitized label/question/page context.
- Gmail OAuth/send status must not change after using Google app auth or the field assistant.
- No generated text may be inserted without explicit operator action.
- No external form may be submitted by the assistant.

## 6. Regression Checks

Validate existing Full-time flows still work:

- LinkedIn Search capture starts and reports run feedback.
- Jobs list pagination/search still works.
- Templates and Settings still load for authenticated users.
- Sender profile LinkedIn URL remains available for AI context.
- Gmail OAuth/send remains separate from app login.
