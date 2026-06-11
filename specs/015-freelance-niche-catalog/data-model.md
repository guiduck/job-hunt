# Data Model: Freelance Niche Catalog Governance

## Overview

This feature extends the existing `apps/web` Prisma/PostgreSQL model. It keeps `FreelanceNiche` as the approved catalog table and adds governance fields plus niche candidate/audit records. Campaign and lead records continue to reference catalog items where useful, while campaigns preserve historical snapshots. Niche candidates are category suggestions only; real business leads/opportunities are discovered later by scraper/API/provider flows and remain separate operational records.

## Enums

### NicheLifecycleStatus

- `approved`
- `disabled`
- `merged`

### NicheCandidateStatus

- `proposed`
- `approved`
- `rejected`
- `deferred`
- `already_covered`

### NicheAuditSeverity

- `info`
- `warning`
- `blocking`

## Entities

### FreelanceNiche

Approved selectable catalog item for Freelance campaigns.

Existing fields to preserve:

- `id`
- `name`
- `slug`
- `market`
- `conversionHint`
- `defaultTerms`
- `enabled`
- `sortOrder`
- `createdAt`
- `updatedAt`

Additive governance fields:

- `displayName`: normalized operator-facing name
- `sourceName`: original source/reference name when different from display name
- `sourcePath`: reference file, screenshot/image note, or operator-entered source
- `sourceNote`: human-readable reason for creation/change
- `conversionHintSource`: `text_seed`, `visual_reference`, `operator_override`, or equivalent string
- `aliases`: JSON string array or related alias rows
- `queryTerms`: JSON string array or related query term rows
- `marketApplicability`: `BR`, `INTERNATIONAL`, or `both`
- `lifecycleStatus`
- `mergedIntoNicheId`: optional self-reference when a duplicate is merged
- `lastAuditedAt`

Validation:

- Active approved entries must have unique normalized slug.
- `displayName`, market applicability, source evidence, and at least one query term are required for enabled entries.
- Disabled entries cannot appear in new campaign creation.
- Merge cannot point to itself.
- Conversion hints are estimates and must include a source or override note when changed from baseline.
- Operator-approved additions such as `Igrejas` require source evidence and documentation updates before becoming selectable.

Relationships:

- One approved niche can have many campaigns and leads.
- One approved niche can be matched by many candidates as already covered.

### NicheCandidate

Reviewable proposed catalog item from references/images or operator input. This is not a scraped business lead.

Fields:

- `id`
- `proposedName`
- `normalizedName`
- `proposedSlug`
- `marketApplicability`
- `proposedConversionHint`
- `proposedQueryTerms`
- `sourcePath`
- `sourceExcerpt`
- `sourceNote`
- `status`
- `matchedNicheId`
- `decisionReason`
- `reviewedAt`
- `createdAt`
- `updatedAt`

Validation:

- Candidates are not selectable for campaigns until approved into `FreelanceNiche`.
- Candidates do not create real leads, opportunities, or outreach targets.
- `already_covered` candidates require `matchedNicheId`.
- `rejected` and `deferred` candidates require a decision reason.
- Approving a candidate must check duplicate slug and aliases before creating/updating an approved niche.

### NicheAuditRun

Snapshot of a catalog audit comparing current app rows with seed/docs/reference expectations.

Fields:

- `id`
- `status`: `passed`, `warnings`, `failed`
- `baselineCount`
- `approvedCount`
- `candidateCount`
- `missingCount`
- `extraCount`
- `duplicateCount`
- `encodingIssueCount`
- `conversionMismatchCount`
- `sourceSummary`
- `createdAt`

Validation:

- A run with blocking findings cannot be marked `passed`.
- The audit stores counts and findings, not CSV files.

### NicheAuditFinding

Individual audit result attached to a run.

Fields:

- `id`
- `runId`
- `severity`
- `findingType`: `missing`, `extra`, `duplicate`, `encoding_issue`, `conversion_hint_mismatch`, `source_missing`, `deferred_candidate`
- `nicheId`
- `candidateId`
- `referenceName`
- `currentName`
- `expectedValue`
- `currentValue`
- `message`
- `createdAt`

Validation:

- Blocking findings include missing baseline entries, duplicate active slugs, and selectable entries without source evidence.
- Encoding findings should include the raw damaged text and normalized display text.

### FreelanceCampaign

Existing historical campaign entity.

Relevant existing snapshot fields:

- `nicheId`
- `nicheNameSnapshot`
- `conversionHintSnapshot`

Rules:

- Do not rewrite snapshots when a niche is renamed, disabled, merged, or has a hint override.
- New campaigns can only select enabled approved niches.
- Old campaigns may still link to disabled or merged niches for history.

### Business Lead / Opportunity Candidate

Real business prospect discovered by scraper/API/provider flows such as Google Maps or configured APIs.

Rules:

- Must not be created from screenshot/reference niche candidates.
- Should include relevant context for contact, including source evidence and business data captured by the provider flow.
- May reference an approved `FreelanceNiche`, but is governed by prospecting/job/lead lifecycle rules rather than niche-catalog candidate decisions.

## State Transitions

### Niche Candidate

```text
proposed -> approved
proposed -> rejected
proposed -> deferred
proposed -> already_covered
deferred -> approved
deferred -> rejected
deferred -> already_covered
```

### Approved Niche

```text
approved -> disabled
approved -> merged
disabled -> approved
```

## Retention and Privacy

- Store public reference/source paths, operator notes, and catalog metadata only.
- Do not store CSV import/export artifacts.
- Do not store secrets in catalog source notes.
- Reference scan evidence should be concise excerpts or file paths, not copied full documents.
- Do not store business contact data on `NicheCandidate`; business contact context belongs to scraper/API lead records.
