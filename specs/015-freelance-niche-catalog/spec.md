# Feature Specification: Freelance Niche Catalog Governance

**Feature Branch**: `[015-freelance-niche-catalog]`  
**Created**: 2026-06-08  
**Status**: Draft  
**Input**: User description: "Confirm the current Freelance mock result is expected, verify all niches exist in documentation and references, and prepare the next spec so the app can predictably add all planned niches from references rather than being limited to the current hard-coded seed."

## Continuity Context

**Roadmap Phase**: Fase 4. Prospeccao Freelance  
**Action Plan Step**: Post-review refinement after `014-freelance-web-app`  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Create a focused post-review spec for Freelance niche catalog completeness, documentation alignment, and predictable catalog expansion from `references/`.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-06-09

- Q: When text seed/docs and screenshot evidence disagree on a niche conversion hint, which value should be treated as authoritative? -> A: Keep both values and require the operator to choose before marking the audit aligned.
- Q: How should screenshot/reference-derived candidates enter the system before provider-real scanning exists? -> A: Images and references are source-of-truth inputs for possible niche catalog candidates, operator-provided niches such as `Igrejas` may be added when documentation/source evidence is updated, and real leads/opportunities must still come only from scraper/API flows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify Catalog Completeness (Priority: P1)

As the operator, I want the app to show exactly which niche catalog entries came from the project references so that I can trust campaign creation is using the planned source list rather than ad hoc mock data.

**Why this priority**: Campaign quality depends on the niche catalog. The current app is usable, but the operator needs confidence that the visible entries are intentional and traceable to documented references.

**Independent Test**: Can be tested by opening a catalog audit view or report and confirming that every initial niche from the documented reference list is present with its conversion hint, market grouping, enabled state, and source reference.

**Acceptance Scenarios**:

1. **Given** the initial reference list contains 29 `NICHE_OPTIONS`, **When** the operator opens the catalog audit, **Then** all 29 entries are shown as present with matching conversion hints and source attribution.
2. **Given** an entry has accents or localized spelling, **When** it is displayed in the app, **Then** the operator sees a human-readable normalized name, not mojibake or terminal encoding artifacts.
3. **Given** documentation and seed data disagree, **When** the audit runs, **Then** the mismatch is visible and blocks marking the catalog as fully aligned.

---

### User Story 2 - Manage Planned Niches (Priority: P2)

As the operator, I want to add, disable, edit, and classify niches without code changes so that the catalog can grow beyond the initial 29 items as new reference examples or markets are discovered.

**Why this priority**: The initial catalog is intentionally a seed, not a permanent ceiling. The business needs a predictable path for adding more niches while preserving existing campaign snapshots.

**Independent Test**: Can be tested by adding a new niche from a reference note, disabling an older niche, and confirming existing campaigns keep their historical niche label while new campaigns only show enabled items.

**Acceptance Scenarios**:

1. **Given** the operator adds a new niche with name, market, search terms, conversion hint, and source note, **When** they create a campaign, **Then** the new enabled niche is selectable without a code deploy.
2. **Given** a niche is disabled after being used, **When** old campaigns are viewed, **Then** their historical niche snapshot remains visible.
3. **Given** two niche names normalize to the same slug, **When** the operator tries to save the second one, **Then** the system prevents accidental duplicates and explains the conflict.

---

### User Story 3 - Reference-Driven Expansion (Priority: P3)

As the operator, I want the system to compare the app catalog against approved reference files so that future prompt templates, image references, or business examples can propose candidate niches in a controlled review flow.

**Why this priority**: The `references/` folder contains more product examples than the current seed list. Those examples should inform expansion, but not automatically pollute the catalog without review.

**Independent Test**: Can be tested by running a reference scan that proposes candidate niche names, separates already-known items from new candidates, and requires operator approval before adding anything to campaign selection.

**Acceptance Scenarios**:

1. **Given** approved reference files contain repeated niche-like phrases, **When** the operator runs a catalog scan, **Then** the system groups them into candidates with source evidence.
2. **Given** a candidate is already represented by an existing niche or synonym, **When** the scan result is reviewed, **Then** it is marked as already covered rather than added as a duplicate.
3. **Given** a candidate lacks enough evidence or is too generic, **When** the operator reviews it, **Then** it can be rejected or deferred with a reason.
4. **Given** the operator identifies a valid niche outside the screenshot list, such as `Igrejas`, **When** the niche is documented with source evidence, **Then** it can be added to the governed catalog without removing or replacing screenshot-derived candidates.

---

### Edge Cases

- The reference file stores text with broken encoding, but documentation contains a normalized ASCII or accent-correct version.
- A niche applies to both BR and international campaigns.
- A niche should have multiple search terms or aliases, not just the display name.
- A conversion hint is missing, stale, or clearly copied from an unrelated example.
- Existing campaigns reference a niche that is later renamed, merged, or disabled.
- Operator-provided niches may be added before they appear in screenshots, but they still require source evidence and living documentation updates.
- Niche candidates are catalog suggestions only; real leads, opportunities, and business candidates are collected through the scraper/API flow.

## Requirements *(mandatory)*

### Visual Reference Findings

Manual review of `references/images` found that the original text seed is not the full visual
catalog shown in the reference dropdowns. The currently implemented seed covers the documented
`NICHE_OPTIONS`, but the screenshots show additional planned candidates.

Visible BR candidates in screenshots:

- Clínica de Estética — 18.5%
- Clínica Odontológica — 17.2%
- Dentista — 16.8%
- Salão de Beleza — 15.4%
- Psicólogo — 15.2%
- Terapeuta — 15%
- Nutricionista — 14.8%
- Barbearia — 14.7%
- Fotógrafo — 14.2%
- Personal Trainer — 13.5%
- Clínica de Fisioterapia — 13.2%
- Arquiteto — 13%
- Designer de Interiores — 12.9%
- Academia — 12.8%
- Clínica Veterinária — 12.3%
- Cerimonialista — 10.5%
- Pet Shop — 9.5%
- Escola de Idiomas — 9.2%
- Escola de Natação — 9%
- Escola de Música — 8.8%
- Escola de Dança — 8.7%
- Loja de Roupas — 8.6%
- Marcenaria — 8.1%
- Floricultura — 7.9%
- Corretor de Seguros — 7.5%
- Auto Escola — 7.2%
- Lavanderia — 6.8%
- Ótica — 6.5%
- Imobiliária — 6.1%
- Despachante — 6%
- Restaurante — 5.8%
- Pizzaria — 5.5%
- Hamburgueria — 5.3%
- Oficina Mecânica — 5%
- Escritório de Advocacia — 4.7%
- Escritório de Contabilidade — 3.5%

Visible international candidates in screenshots:

- Dentist — 17.5%
- Med Spa — 18%
- HVAC — 15.8%
- Plumber — 16.2%
- Lawyer — 15%
- Real Estate Agent — 14.5%
- Chiropractor — 14%
- Personal Trainer — 13.5%
- Photographer — 12%
- Veterinarian — 13.8%
- Auto Repair — 14.2%
- Electrician — 15.5%
- Roofing — 14.8%
- Restaurant — 10.5%
- Gym — 11%
- Salon — 12.5%
- Barbershop — 11.8%
- Landscaping — 13%
- Cleaning Service — 14%
- Pet Grooming — 11.5%

Operator-added planned niches not currently treated as screenshot-derived:

- Igrejas

Important mismatch to resolve: the current code seed/reference text has `Imobiliária — 11.0%`, while
the visual dropdown shows `Imobiliária — 6.1%`. The audit must retain both values, require the
operator to choose the approved value, and block marking the catalog as aligned until that choice is
recorded with source evidence or an override note.

### Functional Requirements

- **FR-001**: The system MUST expose an operator-readable catalog audit showing every current niche, market, conversion hint, enabled state, display name, slug, default search terms, and source reference.
- **FR-002**: The audit MUST compare the current app catalog against the documented initial list of 29 `NICHE_OPTIONS`.
- **FR-003**: The system MUST report missing, extra, duplicate, encoding-damaged, or conversion-hint-mismatched entries.
- **FR-004**: The system MUST preserve the existing initial niches and operator-approved additions as the baseline seed unless the operator explicitly disables or edits them.
- **FR-005**: The system MUST add the visually confirmed reference/image-derived niche candidates to the approved catalog or explicitly mark them as deferred with a reason.
- **FR-005a**: The system MUST treat screenshot/reference-derived names as possible niche catalog candidates, not as business leads or opportunities.
- **FR-006**: The system MUST allow authorized internal operators to create a new niche with display name, market applicability, default query terms, conversion hint, source note, enabled state, and sort order.
- **FR-007**: The system MUST allow authorized internal operators to edit display metadata and default search terms for a niche without changing older campaign snapshots.
- **FR-008**: The system MUST allow authorized internal operators to disable a niche so it no longer appears for new campaigns while remaining visible in historical campaigns.
- **FR-009**: The system MUST prevent duplicate active catalog entries based on normalized slug and reviewed aliases.
- **FR-010**: The system MUST support aliases or alternate search terms for a niche so discovery can search beyond the display name.
- **FR-011**: The system MUST distinguish approved catalog entries from candidate entries discovered in reference scans.
- **FR-012**: The system MUST require operator approval before a candidate niche becomes selectable in campaign creation.
- **FR-013**: The system MUST store source evidence for each added or changed niche, such as a reference file path, operator note, or documented reason.
- **FR-014**: The system MUST keep campaign creation using only enabled approved niches.
- **FR-015**: The system MUST keep CSV import/export out of scope unless explicitly re-approved in a later spec.
- **FR-016**: The system MUST avoid mixing job, resume, or candidature terminology into the Freelance catalog.
- **FR-017**: The system MUST keep conflicting conversion-hint values visible and require an operator-selected approved value before an audit with that conflict can be marked aligned.
- **FR-018**: The system MUST allow operator-provided niches, such as `Igrejas`, to be added when source evidence and documentation are updated, while preserving all existing screenshot-derived candidates for later review.
- **FR-019**: The system MUST keep real lead/opportunity discovery scoped to scraper/provider flows such as Google Maps or configured APIs, with relevant business data captured for outreach context.

### Key Entities *(include if feature involves data)*

- **Niche Catalog Item**: An approved selectable business category for Freelance campaigns, including name, market, conversion hint, query terms, aliases, enabled state, sort order, and source evidence.
- **Niche Candidate**: A proposed category discovered from references or operator input that is not selectable until approved.
- **Business Lead/Opportunity Candidate**: A real business discovered by scraper/provider flows, separate from niche catalog candidates and expected to include context useful for contact.
- **Catalog Audit Result**: A comparison snapshot between approved catalog entries, seed expectations, documentation, and reference sources.
- **Niche Source Evidence**: The human-readable reason or reference path explaining why a niche exists or changed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The operator can verify whether the current catalog matches the approved documented niches in under 1 minute.
- **SC-002**: 100% of initial baseline niches have source attribution and matching conversion hints or an operator-selected approved value for documented conflicts.
- **SC-003**: Adding a new approved niche requires no code change and can be completed by an internal operator in under 2 minutes.
- **SC-004**: Disabled or renamed niches do not break existing campaign cards, lead details, or generated prompt/message context.
- **SC-005**: Reference scanning separates already-covered entries from new candidates with no more than one duplicate suggestion per existing niche in a reviewed sample.

## Assumptions

- The current `014-freelance-web-app` MVP is the baseline implementation to refine.
- The initial authoritative niche seed started from `NICHE_OPTIONS` reflected in `docs/reference-ui.md` and `docs/bot-1-scraper.md`, with operator-approved additions allowed in the governed seed.
- The `references/` folder can suggest future candidates, but only approved internal sources should influence the catalog.
- Screenshot/reference-derived niche candidates remain planned even when an operator adds another niche manually.
- Real businesses for outreach are not created from screenshots; they come from the scraper/API and should include relevant context for contact.
- The first implementation can remain internal-only and single-operator, matching the current app posture.
- Provider-real integration and visual polish can be separate specs unless catalog changes require small supporting UI adjustments.
