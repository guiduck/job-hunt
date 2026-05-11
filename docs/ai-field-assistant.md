# AI Field Assistant

The AI Field Assistant is the first browser productivity layer for the Full-time flow. It helps the
operator answer long-form job application questions on external pages while preserving the same safety
rules as outreach: AI drafts are reviewed by a human, secrets stay backend-only, and forms are never
submitted automatically.

## Current Behavior

- The assistant is disabled by default on external sites.
- Authenticated users can enable the current base domain from the popup header with `Enable site`.
- Settings also supports enabling the current base domain or the exact current page, then disabling or
  removing those activations later.
- A Plasmo content script runs on `http/https` pages, but only injects controls when the user is logged
  in and the page matches an enabled owner-scoped activation.
- Eligible text fields receive a small magic-wand button. Sensitive fields such as password, token,
  OTP, card, CPF/CNPJ, hidden, disabled, or readonly fields are ignored.
- The content script now rescans dynamic pages periodically, on focus/pointer activity, on DOM
  mutations, and after SPA URL changes so LinkedIn/application modals do not require a manual refresh
  before new fields receive the wand.
- Clicking the wand opens a compact answer menu with AI generation, saved suggestions, replace,
  append, and save controls.
- If the field already has a value, the answer menu starts with that value so the operator can save a
  manually typed response for future autofill without generating with AI.
- The answer menu includes an editable `Question or instruction` field. It starts from the detected
  label/placeholder/surrounding text, but the operator can correct what the AI should answer before
  generating or saving a reusable response.
- The answer menu is constrained to the visible viewport using `visualViewport`/window dimensions and
  clamps its top/left/max-height so action buttons remain reachable near the bottom of the screen.
- Saved suggestions are owner-scoped by keyword and capped at 3 per user + keyword.
- The persistent shell includes `Fill saved` and `Fill with AI`: saved suggestions are applied to
  empty matching fields first; the AI option generates only for remaining fields without saved answers.
- Generic field keywords fall back to normalized meaningful terms from the question text instead of
  collapsing everything to one broad bucket.
- Search inputs (`input[type="search"]`) are ignored so site navigation/search boxes do not receive
  AI autocomplete controls.
- Each uploaded resume has a Settings checkbox for `Use as AI assistant context`. Selected available
  resumes are owner-scoped and sent to backend generation as extracted PDF text excerpts; if none are
  selected, the assistant falls back to the default/newest available resume.
- The authenticated `Keep open` window flow was replaced by `Pin assistant`, which opens a persistent
  content-script shell in the active tab.
- Unauthenticated users see only auth views; app title, tabs, logout, and operational actions are
  hidden until a valid session exists.

## Data Flow

1. Content script detects an eligible field and derives safe metadata: label, name, placeholder, field
   type, nearby question text, keyword, and sanitized page URL.
2. Background restores the local app session and checks whether the page is enabled.
3. API receives the sanitized field context and assembles generation context from owner-scoped settings,
   sender profile, portfolio URL, LinkedIn URL, and selected resume text excerpts.
4. AI generation happens in backend code using configured model credentials.
5. The content script receives only the answer text and optional rationale/missing-context metadata for
   review.
6. The operator explicitly replaces/appends the field value or saves the edited answer as a reusable
   suggestion.
7. From the shell, the operator can autofill visible empty fields using saved suggestions only, or use
   saved suggestions first and AI for the remaining fields.

## Boundaries

- No OpenAI key, OAuth secret, refresh token, prompt secret, or full resume bytes are exposed to the
  extension page context.
- No generated response is auto-submitted.
- Generating a response does not auto-save it as a suggestion.
- Activations are per owner; enabling a domain for one user does not enable it globally.
- The first implementation uses direct content-script DOM UI. If real sites conflict with injected CSS
  or layout, the next hardening step is isolating the shell/menu in an iframe or shadow root.

## Validation

Latest focused validation:

```bash
docker compose exec api python -m compileall app alembic
docker compose exec api python -m pytest tests/contract/test_field_assistant_contract.py tests/unit/test_field_assistant_service.py tests/integration/test_field_assistant_activation.py tests/integration/test_field_response_suggestions.py tests/integration/test_field_assistant_ownership.py tests/integration/test_field_answer_generation.py tests/integration/test_field_assistant_migration.py
docker compose exec api python -m pytest tests/contract/test_resume_attachments.py tests/contract/test_field_assistant_contract.py tests/integration/test_field_assistant_migration.py
cd apps/extension && npm run typecheck
cd apps/extension && npm run build
```

Remaining manual smoke:

- Enable a real application domain.
- Confirm the wand appears only on relevant long-answer fields.
- Generate, review, replace, append, save, and reuse one answer.
- Type a manual answer in a field, open the wand, save it, clear the field, then confirm `Fill saved`
  restores it without AI generation.
- Edit the detected question/instruction in the wand menu and confirm generation/saving follows the
  edited prompt.
- Confirm `Fill with AI` uses saved suggestions first and only generates for fields without matches.
- Open the menu near the bottom of the visible page and confirm Replace/Append/Save remain clickable.
- Toggle resume context checkboxes in Settings and confirm generated answers use concrete resume
  evidence when the question asks about experience/projects.
- Confirm sensitive fields do not receive controls.
- Confirm logout removes or disables injected UI.
