# Feature Specification: Saved Search Keywords

**Feature Branch**: `011-saved-search-keywords`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "O app esta bom como esta agora; fazer apenas uma atualizacao para salvar os filtros de busca que o usuario adicionou. Salvar as keywords usadas melhora a experiencia sem precisar preencher novamente. Sempre que ele adicionar uma palavra separada por espaco, criar outra keyword e usar na parte de busca."

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time LinkedIn MVP with post-capture AI filters  
**Action Plan Step**: Polish the Full-time local operator workflow without changing the LinkedIn-first discovery source  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: User-requested `/speckit-specify` for saved search keywords on 2026-05-29

This feature is a small Full-time search experience improvement. It preserves the current LinkedIn search flow, Search UI split between simple search text and optional AI filters, authenticated ownership, popup state behavior, run feedback, dedupe, and the discarded-source decision. It only adds reusable owner-scoped search keywords so the operator does not need to type the same search terms every time.

## Clarifications

### Session 2026-05-29

- Q: When should the app persist the current search words as saved keywords? -> A: Save keywords when the operator starts a LinkedIn capture.
- Q: What maximum number of saved search keywords should the MVP allow per operator? -> A: Cap saved keywords at 30 per operator.
- Q: Should a capture replace the saved keyword list or only add new words? -> A: Capture uses the current Search field and saves it as the last search, but only adds new words to saved keyword badges; old saved keywords are removed only when the operator clicks a badge delete control.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save search words as reusable keywords (Priority: P1)

As an authenticated Full-time operator, I want the app to remember my last search text and keep my reusable keywords nearby as badges so future searches start from my own recent context instead of a generic default.

**Why this priority**: This is the direct user value: reducing repeated typing while improving the quality and consistency of LinkedIn search runs.

**Independent Test**: Can be tested by entering a space-separated search such as "react typescript remoto", starting capture, reopening the extension, and confirming that the input is prefilled with the last search while normalized keyword badges are available below the input.

**Acceptance Scenarios**:

1. **Given** the operator is authenticated and types "react typescript remoto" in the Full-time search field, **When** they start a LinkedIn capture, **Then** the system saves that phrase as the last search and stores `react`, `typescript`, and `remoto` as separate reusable job keyword badges for that operator.
2. **Given** the operator has a last search, **When** the Search view opens later in the same or a new session, **Then** the search field is prefilled with the last search text instead of all saved keyword badges.
3. **Given** the operator has saved job keyword badges below the input, **When** they choose a badge, **Then** that keyword can be added to the current Search field for the next capture.
4. **Given** the operator starts a LinkedIn capture, **When** the run is created, **Then** the run uses the current Search field as the requested search input and records the combined search text for traceability.

---

### User Story 2 - Edit saved keyword badges safely (Priority: P2)

As an operator, I want saved keywords rendered as removable badges below the Search input so I can quickly reuse useful terms and manually delete stale ones.

**Why this priority**: Saved keywords only stay useful if the operator can correct them without leaving stale or accidental terms in every run.

**Independent Test**: Can be tested by adding a new word through capture, removing an existing badge with its `X` control, reopening the extension, and confirming the badge list changed while the input still reflects the last search.

**Acceptance Scenarios**:

1. **Given** saved keyword badges already include `typescript`, **When** the operator adds "node" to the Search field and starts capture, **Then** the saved badges include `node` once without duplicating existing terms.
2. **Given** saved keyword badges include an outdated term, **When** the operator clicks the badge `X`, **Then** the badge is removed from the saved keyword library and no longer appears as a quick-access option.
3. **Given** the operator removes a word from the Search field before capture, **When** they start capture, **Then** that word is omitted from the run but remains available as a saved badge unless explicitly deleted.
4. **Given** the operator enters repeated or differently cased words such as "React react REACT", **When** the terms are saved, **Then** the saved badges contain one normalized keyword for `react`.

---

### User Story 3 - Keep search history owner-scoped and compatible (Priority: P3)

As a logged-in user, I want my saved search keywords to belong only to me and not disturb existing captured jobs, filters, AI filter settings, or another user's search setup.

**Why this priority**: The app already depends on owner-scoped operational data; saved search preferences must follow the same boundary before wider use.

**Independent Test**: Can be tested by logging in as two different users, saving different keyword lists for each, and confirming each user sees and uses only their own list while existing job results remain unchanged.

**Acceptance Scenarios**:

1. **Given** User A saved `react typescript` and User B saved `python django`, **When** each user opens Search, **Then** each sees only their own saved keywords.
2. **Given** a user updates their last search or saved keyword badges, **When** existing job opportunities and prior runs are viewed, **Then** their original matched keywords and source query evidence remain unchanged.
3. **Given** no last search or saved keyword badges exist for a user, **When** they open Search, **Then** the app still offers a usable starter search state and can create a run.

### Edge Cases

- Empty or whitespace-only input should not replace a useful last search or create blank saved keyword badges.
- Very long input should be bounded to 30 saved keywords so accidental pasted text does not create an unusable keyword list.
- Punctuation, commas, line breaks, and repeated spaces should not create blank keywords.
- Common hiring intent words already used to shape LinkedIn search, such as "hiring" or "job", should not pollute the saved professional keyword list unless they are intentionally preserved as search text.
- Accented and non-English terms such as "remoto", "hibrido", or "contratando" should remain usable after normalization.
- Saved keywords must not cross from `job`/Full-time into the future `freelance` lane.
- Updating the last search or saved keyword badges must not change the optional AI filters for remote, onsite/hybrid, accepted regions, or excluded regions.
- If saving fails because the backend is unavailable, the operator should keep their typed search text locally and see a recoverable error.
- If two browser surfaces update keywords close together, the last confirmed saved list should be the one shown on next load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide saved search keywords for the authenticated Full-time operator.
- **FR-002**: The system MUST parse space-separated words in the Search input into separate keywords.
- **FR-003**: The system MUST normalize saved keywords by trimming whitespace, removing empty values, and deduplicating case-insensitively.
- **FR-004**: The system MUST preserve meaningful non-English and accented search terms that the operator enters.
- **FR-005**: The system MUST associate saved search keywords with the authenticated owner and the `job` opportunity lane.
- **FR-006**: The system MUST remember the authenticated operator's last Full-time search text separately from the saved keyword badge list.
- **FR-007**: The system MUST prefill the Full-time Search input from the authenticated operator's last search text when available.
- **FR-008**: The system MUST render saved keywords as quick-access badges below the Search input.
- **FR-009**: The operator MUST be able to add a saved keyword badge into the current Search field for the next capture.
- **FR-010**: The operator MUST be able to delete a saved keyword badge with an explicit badge-level delete control.
- **FR-011**: Removing a word from the Search field MUST remove it from the next capture input but MUST NOT delete the saved keyword badge unless the operator explicitly deletes the badge.
- **FR-012**: Starting a LinkedIn capture MUST use the current Search field as the run's requested search input.
- **FR-013**: Each run MUST continue recording the search text or source query used for traceability.
- **FR-014**: Updating the last search or saved keyword badges MUST NOT mutate existing opportunities, historical run requested keywords, matched keyword records, source evidence, or dedupe keys.
- **FR-015**: Saved search keywords MUST remain separate from optional AI filter settings such as remote-only, onsite/hybrid exclusion, accepted regions, and excluded regions.
- **FR-016**: The feature MUST keep the current Search UI responsibility split: LinkedIn opens with simple search text and sort order; AI filters remain optional post-capture review.
- **FR-017**: If no last search or saved keyword badge list exists, the system MUST retain a usable starter state so the operator can still run a search.
- **FR-018**: The system MUST persist the current Search field as the last search when the operator starts a LinkedIn capture.
- **FR-019**: The system MUST add newly normalized words from the current Search field into the saved keyword badge list when the operator starts a LinkedIn capture.
- **FR-020**: The system MUST NOT remove old saved keyword badges during capture.
- **FR-021**: The system MUST show a recoverable error or retry path when saving the last search or keyword badges fails, without blocking manual use of the current typed search text.
- **FR-022**: The system MUST enforce a maximum of 30 saved search keywords per operator for the initial release.
- **FR-023**: The feature MUST NOT reintroduce the discarded external job source, automatic company-email discovery provider, or source-specific UI/configuration.
- **FR-024**: The feature MUST NOT grant Gmail send permission, submit applications, or generate outreach content.
- **FR-025**: The feature MUST preserve existing login, ownership, dashboard metrics, Jobs filters, capture feedback, run counters, Google primary auth, Gmail OAuth separation, and field assistant behavior.

### Key Entities

- **Saved Search Keyword Library**: The active owner-scoped collection of reusable keyword badges for the `job` lane, including display name, source, opportunity lane, active/default flags, and normalized terms.
- **Search Keyword**: A single normalized word or term produced from the operator's search input and used to build capture requests and run metadata.
- **Last Search Text**: The most recent owner-scoped Full-time Search field text confirmed when the operator started capture.
- **Search Input State**: The current operator-visible text prefilled from the last search and editable before capture.
- **Job Search Run**: A recorded search execution that keeps its requested keywords and source query evidence independent from later saved keyword edits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated operator can save up to 30 keyword badges and see the last search text prefilled after closing and reopening the extension.
- **SC-002**: 100% of saved keyword updates are owner-scoped in a two-user validation: each user sees only their own keywords.
- **SC-003**: Starting a capture with "react typescript remoto" records exactly those three normalized professional keywords from the current Search field as requested keywords, excluding duplicates and blanks.
- **SC-004**: Existing opportunities and prior runs retain their original matched keywords and source query values after the saved keyword badges are edited.
- **SC-005**: The operator can add a saved badge to the Search field or delete a saved badge in under 15 seconds.
- **SC-006**: Optional AI filter settings remain unchanged in 100% of keyword save/edit flows.
- **SC-007**: If keyword persistence fails, the operator receives visible feedback and can still proceed with or retry the current search text.

## Non-Goals

- Changing the LinkedIn capture provider or adding a new job discovery source.
- Reintroducing the discarded external job source or automated company-email discovery.
- Building a full campaign management screen for saved searches.
- Extracting keywords from resumes in this feature.
- Generating ATS-friendly resumes or cover letters in this feature.
- Changing scoring, dedupe, AI filter evaluation, Gmail OAuth, sending, or post-send feedback behavior.
- Sharing keyword lists between users, teams, `job`, and `freelance` lanes.

## Assumptions

- The first version targets the authenticated Full-time operator using the existing extension Search view.
- Space-separated words are intentionally treated as separate keywords, matching the user's requested behavior.
- The app should prefill the Search input from the last captured search text while showing reusable saved keywords as badges below the input.
- A single active saved keyword library per user and `job` lane is sufficient for this update.
- Existing `KeywordSet`-style data remains the right product concept for saved keywords, but the specification does not require a particular implementation path.
- Search keywords are professional search preferences, not sensitive secrets.
- Resume-derived keyword extraction and ATS-friendly resume generation are valuable future AI features, but they deserve separate specification and planning.
