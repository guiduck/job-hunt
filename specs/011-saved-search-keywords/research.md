# Research: Saved Search Keywords

## Decision: Store last search text separately from saved keyword badges

**Rationale**: Clarification established that the input should be prefilled with the user's last search, while saved keywords appear below as reusable badges. Combining both into one field would bloat the next search and make it unclear whether every saved badge is used on capture.

**Alternatives considered**:

- Prefill the input with all saved badges: rejected because capture would unintentionally use the entire saved library.
- Store only badges and no last search: rejected because the user explicitly wants the prefilled input to be the last search.
- Browser-only local storage: rejected because preferences must be owner-scoped and survive authenticated sessions consistently.

## Decision: Persist preferences when capture starts

**Rationale**: The operator's meaningful commit point is starting LinkedIn capture. Saving at that moment avoids noisy updates while typing and keeps the capture payload, last search text, and newly added badges aligned.

**Alternatives considered**:

- Save on every keystroke: rejected because it adds unnecessary churn and makes accidental edits persistent.
- Explicit Save button only: rejected because it adds friction to a small polish update.
- Save on blur: rejected because popup focus changes are common and can be accidental.

## Decision: Merge new badges without deleting old badges during capture

**Rationale**: The user wants old saved keywords to remain available as quick-access badges unless explicitly deleted. Capture should use the input as source of truth for the run, but should not treat the input as a replacement for the saved library.

**Alternatives considered**:

- Replace saved library with current input: rejected because removing a word from the next run would also destroy useful quick-access history.
- Merge and require a separate Settings screen for deletion: rejected for MVP; badge-level delete is faster and matches the requested UX.
- Ask for confirmation before deletion: rejected because capture never deletes old badges.

## Decision: Cap saved keyword badges at 30 per owner

**Rationale**: Thirty terms is enough for stack, roles, seniority, and modality terms without turning the popup into an unbounded tag manager. It also gives tests and API validation a concrete limit.

**Alternatives considered**:

- 10 terms: rejected as too tight for mixed stack/location searches.
- 25 terms: reasonable but the user chose 30.
- No fixed cap: rejected because accidental pasted text could create noisy UI and large payloads.

## Decision: Keep the worker and historical run data unchanged

**Rationale**: The worker already consumes requested keywords and source query from `JobSearchRun`. This feature only changes how the extension/API prepare those values before run creation. Existing runs and opportunities must remain immutable evidence.

**Alternatives considered**:

- Recompute old run requested keywords from current preferences: rejected because it would corrupt traceability.
- Add worker-side keyword preference lookup: rejected because it would couple long-running processing to mutable UI preferences.

## Decision: Add a small API contract for Full-time search preferences

**Rationale**: The extension needs to load last search and badge library on authenticated Search view open, persist at capture start, and delete badges explicitly. A focused owner-scoped API contract keeps the behavior reusable for future web UI without coupling it to popup local storage.

**Alternatives considered**:

- Piggyback only on `/job-search-runs`: rejected because badge deletion and initial hydration are not run creation.
- Store everything in user settings free-form JSON: rejected because keywords already have product meaning and need validation/ownership tests.
- Extension-only storage: rejected because it breaks multi-device/session consistency and owner boundaries.
