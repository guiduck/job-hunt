# API Contract: Freelance Niche Catalog Governance

This contract describes internal `apps/web` route handler behavior. Exact route names may follow existing local conventions, but the behavior must remain compatible with these operations.

## List Approved Niches

`GET /api/freelance/niches`

Query:

- `includeDisabled`: optional boolean, default `false`
- `market`: optional `BR`, `INTERNATIONAL`, or `both`

Response item:

- `id`
- `displayName`
- `slug`
- `marketApplicability`
- `conversionHint`
- `conversionHintSource`
- `enabled`
- `lifecycleStatus`
- `aliases`
- `queryTerms`
- `sourcePath`
- `sourceNote`
- `sortOrder`
- `lastAuditedAt`

Rules:

- Campaign creation callers receive only enabled approved entries by default.
- Operator audit/admin callers may request disabled entries.
- Operator-approved additions such as `Igrejas` are returned only after they are saved as governed approved niches with source evidence.

## Create Approved Niche

`POST /api/freelance/niches`

Body:

- `displayName`
- `marketApplicability`
- `conversionHint`
- `conversionHintSource`
- `aliases`
- `queryTerms`
- `sourcePath`
- `sourceNote`
- `enabled`
- `sortOrder`

Responses:

- `201` with created niche
- `409` when normalized slug or alias conflicts with an active approved niche
- `422` when required source/query fields are missing

Rules:

- Must not create job/full-time terminology fields.
- Must require source evidence for approved entries.
- May be used for operator-provided niches that are not in screenshots when documentation/source evidence is updated.

## Update Approved Niche

`PATCH /api/freelance/niches/{nicheId}`

Body supports:

- `displayName`
- `marketApplicability`
- `conversionHint`
- `conversionHintSource`
- `aliases`
- `queryTerms`
- `sourcePath`
- `sourceNote`
- `enabled`
- `sortOrder`
- `lifecycleStatus`
- `mergedIntoNicheId`

Rules:

- Existing campaign snapshots are never rewritten by this operation.
- Disabling a niche removes it from future campaign selection only.
- Merge requires a target approved niche.

## Run or Read Catalog Audit

`GET /api/freelance/niche-audit`

Response:

- `runId`
- `status`
- summary counts
- findings grouped by severity/type

Optional implementation:

- `POST /api/freelance/niche-audit` may create a fresh audit run.

Rules:

- Audit compares DB catalog, approved baseline seed/docs, and approved visual/reference candidates.
- Audit reports missing, extra, duplicate, encoding-damaged, conversion-hint-mismatched, and source-missing entries.
- Audit does not export CSV.
- Audit treats reference/image candidates as niche catalog suggestions only, not as scraped business leads.

## List Candidates

`GET /api/freelance/niche-candidates`

Lists niche catalog candidates from references/images or operator proposal sources. It must not return real business leads/opportunities from scraper/API prospecting.

Query:

- `status`: optional candidate status
- `market`: optional market applicability

Response item:

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

## Decide Candidate

`PATCH /api/freelance/niche-candidates/{candidateId}`

Body:

- `decision`: `approve`, `reject`, `defer`, or `mark_already_covered`
- `matchedNicheId`: required for `mark_already_covered`
- `decisionReason`: required for `reject` and `defer`
- optional approved niche overrides for `approve`

Rules:

- Approval creates or updates an approved niche only after duplicate checks.
- Candidates are never selectable before approval.
- Decision history must be auditable through candidate fields or related events.
- Approving a niche candidate does not create leads or outreach targets; lead/opportunity discovery remains owned by scraper/API flows.
