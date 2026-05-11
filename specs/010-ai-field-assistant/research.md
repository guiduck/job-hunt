# Phase 0 Research: AI Field Assistant

## Decision: Assistant activation is owner-scoped and disabled by default

**Rationale**: External-page injection has privacy and UX risk. A default-off model keeps the assistant from appearing unexpectedly and aligns with the user's request for a button that enables the feature for the current tab/domain. Base-domain activation covers normal application subpaths, while exact-page activation handles sites where the operator wants narrower scope.

**Alternatives considered**:

- Broad activation on all normal web pages after login: simpler but asks for too much trust and risks invasive UI.
- Fixed allowlist of known job sites: safer but too rigid for real application flows and manual job forms.
- Exact-page only: safest but tedious and likely to frustrate repeated applications.

## Decision: Replace authenticated `Keep open` with a persistent injected shell

**Rationale**: Native extension popups close on focus loss, and the current `Keep open` window is detached from the page fields. The reference project demonstrated the useful pattern: page-injected extension-owned UI controlled by background/content messaging. For this product, that shell should be the primary authenticated keep-open path, because the assistant needs to live near fields on the active page.

**Alternatives considered**:

- Keep both `Keep open` and persistent shell: more fallback options but confusing for users and extra QA surface.
- Hide `Keep open` and defer shell: cleaner UI but leaves the field assistant without the persistent UX it needs.

## Decision: Field detection is conservative and denylist-driven

**Rationale**: It is better for v1 to miss some fields than to appear on sensitive or irrelevant fields. The detector should combine visibility, editability, size/length hints, labels/question text, and known application categories, while blocking password, payment, OTP, card, document, phone, short email, search, readonly, disabled, hidden, and unsupported contexts.

**Alternatives considered**:

- Show on every editable field: maximizes coverage but creates privacy and annoyance risks.
- Show only on textareas: safer but misses rich editors and long-answer inputs used by many forms.

## Decision: Generate answers through trusted server-side services

**Rationale**: The extension must not receive model keys, provider secrets, prompt internals, OAuth tokens, full resume files, or arbitrary resume bytes. The browser-visible request should carry only sanitized field context. The backend can combine that with owner-scoped settings, resume/profile context, portfolio URL, LinkedIn URL, and template hints.

**Alternatives considered**:

- Generate directly in the extension: violates the project's secret and model-access boundaries.
- Send full page DOM for better context: too much privacy risk and unnecessary for the expected field-answer use case.

## Decision: Save reusable responses only by explicit operator action

**Rationale**: Generated answers may be too specific, low quality, or sensitive. Explicit save gives the operator control and keeps the response bank useful. The cap of 3 per owner+keyword prevents unbounded storage and keeps the dropdown compact.

**Alternatives considered**:

- Save every inserted answer automatically: convenient but risks retaining unwanted content.
- Ask after every insertion: safer than autosave but interrupts a high-frequency workflow.

## Decision: Start with synchronous generation plus clear loading/errors

**Rationale**: Field-answer generation is one item at a time and success criteria target a reviewable result within 10 seconds. The current architecture already has AI generation services that can be adapted for this. Durable job modeling remains valuable for bulk generation, but adding it here would inflate the first assistant slice.

**Alternatives considered**:

- Worker-owned durable generation from day one: more resilient but likely over-scoped for single-field answers.
- Pure client-side cached templates: fast but loses resume/profile grounding and undermines the AI assistant value.

## Decision: Store activation scopes in server-backed owner settings, with local mirror allowed for responsiveness

**Rationale**: The user may use the extension across sessions and eventually across machines. Server-backed owner settings preserve choices and support Settings management. A local mirror can reduce latency and keep the content script responsive, but server state remains authoritative.

**Alternatives considered**:

- Only browser storage: quicker but device-local and harder to reason about owner scoping.
- Only server lookup on every page: simpler source of truth but can slow injection decisions and add unnecessary traffic.
