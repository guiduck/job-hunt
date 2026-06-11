# Audit Report Contract: Freelance Niche Catalog Governance

## Purpose

The audit report gives the operator a reviewable answer to: "Does the current app catalog match the approved baseline and reference evidence?"

## Inputs

The audit compares:

- current `FreelanceNiche` records in PostgreSQL
- approved baseline seed from `apps/web/prisma/seed-data/niches.ts`
- original `NICHE_OPTIONS` from `references/opportunity-desk-pro/src/lib/mockData.ts` plus operator-approved additions
- documented normalized list in `docs/reference-ui.md`
- documented normalized list in `docs/bot-1-scraper.md`
- approved screenshot-derived candidate list from `specs/015-freelance-niche-catalog/spec.md`
- operator-approved documented additions such as `Igrejas`

The audit does not compare or create real business leads/opportunities; those are produced by scraper/API/provider flows.

## Required Finding Types

### Missing Baseline

A baseline entry is absent from approved catalog records.

Severity:

- `blocking` when an approved seed entry cannot be selected and is not intentionally disabled.

### Extra Approved

An approved catalog entry is not in the approved baseline and has no approved source note.

Severity:

- `warning` when source evidence exists.
- `blocking` when source evidence is missing.

### Duplicate Slug Or Alias

Two active approved entries normalize to the same slug or alias.

Severity:

- `blocking`.

### Encoding Issue

Raw source text appears damaged, but a normalized display name exists or is needed.

Severity:

- `warning` when display name is readable.
- `blocking` when operator-facing name would be damaged.

### Conversion Hint Mismatch

Same normalized niche has different conversion hints across source text, docs, visual reference, or DB.

Severity:

- `warning` when a documented override exists.
- `blocking` when campaign-visible value has no chosen source or override note.

Known initial mismatch:

- `Imobiliaria`: text seed/docs currently use `11.0%`; visual screenshot review found `6.1%`.

Resolution rule:

- The audit must retain both conflicting values and require an operator-selected approved value before the catalog can be marked aligned.

### Source Evidence Missing

Approved niche lacks source path/note.

Severity:

- `blocking` for enabled approved entries.
- `warning` for disabled historical entries.

### Deferred Candidate

Screenshot/reference-derived niche candidate exists but is not approved.

Severity:

- `info` when deferred/rejected with reason.
- `warning` when still proposed without review.

## Status Rules

- `passed`: no blocking findings and no unresolved warnings.
- `warnings`: no blocking findings, but at least one reviewed warning remains.
- `failed`: at least one blocking finding exists.

## Display Rules

- Findings must be grouped by severity and type.
- The report must show both raw source values and normalized display values when encoding is relevant.
- The report must not generate CSV files.
- Candidate findings must be labeled as niche catalog candidates, not prospect leads.
