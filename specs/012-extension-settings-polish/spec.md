# Feature Specification: Extension Settings Polish

**Feature Branch**: `codex/012-extension-settings-polish`  
**Created**: 2026-06-02  
**Status**: Draft  
**Input**: User description: "Remove the broken Pin assistant action, simplify Full-time labels, and clean up AI field assistant settings site cards."

## Continuity Context

**Roadmap Phase**: Fase 3 / 3.5 - Full-time LinkedIn MVP with operational polish before production readiness  
**Action Plan Step**: Polish the current Full-time extension flow before opening broader product fronts  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Polish the Plasmo extension UI by removing the non-working Pin assistant button, renaming Full-time templates/settings to Templates/Settings, spacing AI field assistant settings cards, and simplifying active site entries to one domain or URL with a remove action only.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Broken Assistant Action (Priority: P1)

As an authenticated operator, I need the extension header to show only working actions so the product feels production-ready and does not invite me into a dead workflow.

**Why this priority**: A broken top-level button damages trust and blocks production polish more than a cosmetic label issue.

**Independent Test**: Log in to the extension and verify the header no longer shows the broken assistant pinning action while the working site enablement action remains available.

**Acceptance Scenarios**:

1. **Given** an authenticated operator opens the extension, **When** the header renders, **Then** the Pin assistant action is absent.
2. **Given** an authenticated operator is on a supported page, **When** the header renders, **Then** the working Enable site action remains visible and usable.

---

### User Story 2 - Simplify Full-time Labels (Priority: P2)

As an operator already inside the Full-time extension context, I need the Templates and Settings headings to avoid repeating "Full-time" so the navigation reads cleaner in the compact popup.

**Why this priority**: The product mode is already established in the shell, so repeated page headings add noise in a limited viewport.

**Independent Test**: Open the Templates and Settings tabs and confirm their headings read "Templates" and "Settings".

**Acceptance Scenarios**:

1. **Given** the operator opens the templates tab, **When** the page heading appears, **Then** it reads "Templates".
2. **Given** the operator opens the settings tab, **When** the page heading appears, **Then** it reads "Settings".

---

### User Story 3 - Simplify Authorized Site Management (Priority: P3)

As an operator configuring the AI field assistant, I need authorized sites to appear as a compact, readable list with one domain or URL per row and a direct remove action, without repeated labels or disabled states.

**Why this priority**: The field assistant is enabled through explicit additions, so the current repeated domain, Active badge, Domain badge, and Disable action add clutter without helping the operator decide.

**Independent Test**: Add at least one current site and one exact page, then verify each entry displays a single readable domain or URL and only a remove action.

**Acceptance Scenarios**:

1. **Given** authorized sites exist, **When** the AI field assistant settings list renders, **Then** each entry displays the site value once.
2. **Given** authorized sites exist, **When** the list renders, **Then** entries do not show Active/Paused status badges or Domain/Exact page badges.
3. **Given** an operator wants to stop using the assistant on a site, **When** they activate the remove control, **Then** the entry is removed from the list after the existing removal flow completes.

### Edge Cases

- Existing disabled site records should still be removable if they appear from older data.
- Long exact page URLs should not overflow the compact popup layout.
- Empty authorized site lists should continue to show the existing empty-state guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authenticated extension header MUST remove the non-working Pin assistant action.
- **FR-002**: The authenticated extension header MUST preserve the working action for enabling the current site.
- **FR-003**: The templates tab heading MUST read "Templates".
- **FR-004**: The settings tab heading MUST read "Settings".
- **FR-005**: The AI field assistant settings area MUST provide more visible spacing between settings cards and authorized site entries.
- **FR-006**: Authorized site entries MUST show each domain or exact page value only once.
- **FR-007**: Authorized site entries MUST omit Domain, Exact page, Active, Paused, Enable, and Disable controls from the visible row.
- **FR-008**: Authorized site entries MUST provide a clear remove action for deleting an entry.
- **FR-009**: Existing assistant activation ownership and authenticated-only behavior MUST remain unchanged.
- **FR-010**: The changes MUST preserve the existing templates, Gmail sender, resume, sender profile, and assistant add-site workflows.

### Key Entities

- **Assistant Activation**: A user-owned permission for allowing the AI field assistant on a base domain or exact page.
- **Popup Section**: A compact extension view such as Templates or Settings shown to an authenticated operator.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A logged-in operator sees zero non-working assistant pinning actions in the header.
- **SC-002**: The Templates and Settings page headings each fit within one line in the popup viewport.
- **SC-003**: Every authorized site row displays one primary site value and one remove action, with no duplicated site text.
- **SC-004**: The operator can remove an authorized site in one direct action from the site list.
- **SC-005**: The extension passes its existing quality checks without new errors.

## Assumptions

- The current popup remains the operator surface for this polish pass.
- Removing Pin assistant is preferable to repairing it in this small correction because the user said it never worked and should be removed.
- Assistant activations remain active-by-addition for the UI; disabling can be revisited only if a later workflow needs pause/resume semantics.
- The next product evolution, a generic ATS-oriented resume generator based on contacted jobs, is outside this polish scope and should be specified separately.
