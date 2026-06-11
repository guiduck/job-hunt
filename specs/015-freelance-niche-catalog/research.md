# Research: Freelance Niche Catalog Governance

## Decision: Keep the 29 `NICHE_OPTIONS` plus documented operator additions as the approved baseline

**Rationale**: `docs/reference-ui.md`, `docs/bot-1-scraper.md`, `apps/web/prisma/seed-data/niches.ts`, and `references/opportunity-desk-pro/src/lib/mockData.ts` all point to the same 29 text-defined entries as the initial approved list. Operator-provided additions such as `Igrejas` may join the governed baseline when they have source evidence and the living docs are updated. This keeps the original reference trail intact while allowing the catalog to evolve.

**Alternatives considered**:

- Promote every screenshot-visible candidate immediately. Rejected because the spec requires auditable expansion and the screenshots include extra candidates not yet approved by text docs.
- Replace the seed with a fresh manually curated list. Rejected because it would break continuity with `014` and obscure the source trail.
- Treat operator-provided additions as ad hoc campaign-only values. Rejected because campaign creation should use the governed catalog and preserve auditability.

## Decision: Detect and normalize encoding issues instead of trusting raw source text

**Rationale**: Current source files include damaged accent encoding in some Portuguese niche names. The operator-facing catalog must show readable names, while the audit must still record which source value was damaged. ASCII-normalized display names are already used in docs and are acceptable for baseline matching.

**Alternatives considered**:

- Store only raw source names. Rejected because campaign creation and audit UI would continue leaking unreadable text.
- Rewrite all references immediately. Rejected for this feature because the implementation should audit and govern the catalog, not bulk-repair every reference file.

## Decision: Preserve campaign snapshots on catalog changes

**Rationale**: `FreelanceCampaign` already stores `nicheNameSnapshot` and `conversionHintSnapshot`. Catalog edits must not rewrite historical campaign meaning, especially if a niche is renamed, disabled, merged, or has a conversion-hint override.

**Alternatives considered**:

- Always dereference live catalog names in old campaigns. Rejected because it would mutate historical context after the fact.
- Duplicate full niche records into every campaign. Rejected because the existing snapshots are sufficient for the current MVP.

## Decision: Model candidates separately from approved catalog entries

**Rationale**: Future reference/image scans should propose niche catalog candidates without automatically approving them. Separate candidate state supports review decisions, source evidence, already-covered matches, and rejection/defer reasons.

**Alternatives considered**:

- Add candidates as disabled catalog entries. Rejected because disabled approved entries and unapproved candidates mean different things.
- Keep candidates as transient UI-only output. Rejected because auditability requires persistent review history.

## Decision: Keep niche candidates separate from real scraper/API leads

**Rationale**: Screenshot/reference-derived candidates are possible business categories for the catalog, not real businesses to contact. Actual leads, opportunities, and business candidates must come from scraper/API/provider flows such as Google Maps or configured APIs and include relevant business context for outreach.

**Alternatives considered**:

- Create leads directly from screenshot/reference candidates. Rejected because screenshots identify category options, not individual businesses with contact evidence.
- Merge niche candidates and lead candidates into one review queue. Rejected because catalog governance and prospect discovery have different validation rules, lifecycle states, and evidence requirements.

## Decision: Add source evidence and alias/query governance to catalog entries

**Rationale**: Discovery quality depends on search terms beyond display names. Source evidence explains why a niche exists or changed, and aliases help prevent duplicate entries like `Dentist` vs `Dentista` where market scope matters.

**Alternatives considered**:

- Keep default terms as a single JSON array only. Acceptable for MVP storage, but validation and UI should still treat aliases/query terms as governed fields.
- Require one table per alias/source. Rejected as too heavy unless implementation finds JSON validation insufficient.

## Decision: Keep CSV import/export out of scope

**Rationale**: The spec explicitly preserves the `014` decision to exclude CSV import/export. Catalog growth should happen through operator-managed forms and candidate review, not bulk file movement.

**Alternatives considered**:

- Add CSV export for audit reports. Rejected because it reopens a deferred scope and can be handled later if explicitly re-approved.

## Decision: Treat the `Imobiliaria` conversion hint mismatch as an operator choice

**Rationale**: Text seed/docs currently show `11.0%`, while visual screenshot review found `6.1%`. The implementation should surface both values in the audit and require the operator to choose the approved value before the catalog can be marked aligned.

**Alternatives considered**:

- Silently change to `6.1%`. Rejected because it changes the baseline seed without an operator decision.
- Ignore the screenshot. Rejected because the spec explicitly records visual reference findings.
- Keep the text seed as the automatic winner. Rejected because the visual source is explicit enough to require a recorded decision.
