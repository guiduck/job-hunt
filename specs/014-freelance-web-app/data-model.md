# Data Model: Freelance Web App

## Overview

The Freelance web app uses Prisma-managed tables in PostgreSQL. Records are owner-scoped for the internal operator and deliberately separate from `job`/Full-time concepts. The model preserves source evidence, website analysis snapshots, review state, templates, seller settings, and latest generated text for prompt/message continuity.

## Enums

### MarketScope

- `BR`
- `INTERNATIONAL`

### CampaignStatus

- `draft`
- `ready`
- `collecting`
- `paused`
- `completed`
- `failed`
- `archived`

### ProspectingJobStatus

- `pending`
- `running`
- `completed`
- `completed_no_results`
- `failed`
- `cancelled`

### ProspectingJobStep

- `queued`
- `discovering_businesses`
- `normalizing_results`
- `deduplicating`
- `fetching_websites`
- `analyzing_websites`
- `scoring_leads`
- `saving_leads`
- `done`

### WebsiteStatus

- `no_site`
- `social_only`
- `linktree`
- `aggregator`
- `broken`
- `weak_site`
- `usable_site`
- `uncertain`

### LeadTemperature

- `cold`
- `warm`
- `hot`

### CommercialStatus

- `new`
- `contacted`
- `interested`
- `proposal_requested`
- `proposal_sent`
- `won`
- `lost`
- `ignored`

### TemplateStage

- `first_contact`
- `follow_up`

### GeneratedTextKind

- `lovable_prompt`
- `commercial_message`

### GeneratedVariant

- `complete`
- `generic`
- `compact`
- `first_contact`
- `follow_up`

## Entities

### User Reference

The MVP may reuse or mirror the existing individual-user identity concept. All operational Freelance rows must include `userId` even if local development seeds a default operator.

Fields:

- `id`
- `email`
- `displayName`

Rules:

- No team/workspace model in this feature.
- Queries must filter by `userId`.

### FreelanceNiche

Configurable catalog seeded from `references/opportunity-desk-pro/src/lib/mockData.ts` (`NICHE_OPTIONS`).

Fields:

- `id`
- `name`
- `slug`
- `market`: `BR`, `INTERNATIONAL`, or `both`-style equivalent
- `conversionHint`: decimal nullable
- `defaultQueryTerms`: string array or JSON
- `enabled`
- `sortOrder`
- `createdAt`
- `updatedAt`

Relationships:

- One niche can be referenced by many campaigns.

Validation:

- `slug` unique.
- Disabled niches cannot be selected for new campaigns.
- Existing campaigns retain niche display fields even if the catalog item is disabled later.

Seed rules:

- Preserve the initial `NICHE_OPTIONS` names and conversion hints, plus operator-approved seed additions such as `Igrejas`.
- Conversion hints are estimates, not conversion promises.

### FreelanceCampaign

Prospecting initiative for a niche and locality.

Fields:

- `id`
- `userId`
- `name`
- `marketScope`
- `country`
- `region`
- `state`
- `city`
- `nicheId`
- `nicheNameSnapshot`
- `conversionHintSnapshot`
- `status`
- `searchSettings`: JSON for optional max results/provider settings
- `leadCount`
- `hotLeadCount`
- `contactedCount`
- `notes`
- `lastRunAt`
- `createdAt`
- `updatedAt`
- `archivedAt`

Relationships:

- Belongs to `User`.
- Belongs to `FreelanceNiche`.
- Has many `ProspectingJob`.
- Has many `FreelanceLead`.

Validation:

- Market, country/region, city, and niche are required before starting prospecting.
- Campaigns must be `draft` or `ready` before a new job can be started.
- Campaign names may be generated from niche and city but remain editable.

### ProspectingJob

Durable background job for campaign discovery and analysis.

Fields:

- `id`
- `userId`
- `campaignId`
- `status`
- `currentStep`
- `providerName`
- `providerRunId`
- `sourceQuery`
- `requestedMaxResults`
- `inspectedCount`
- `acceptedCount`
- `duplicateCount`
- `rejectedCount`
- `failedCount`
- `providerStatus`
- `providerErrorCode`
- `providerErrorMessage`
- `diagnostics`: JSON
- `startedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.
- Belongs to `FreelanceCampaign`.
- Has many discovered candidates if candidate storage is implemented.
- Produces many `FreelanceLead` records.

Validation:

- Only one active job per campaign in MVP.
- Job creation returns quickly; worker performs provider and website work.
- Terminal statuses must preserve diagnostics.

### FreelanceLead

Saved business/prospect for review.

Fields:

- `id`
- `userId`
- `campaignId`
- `jobId`
- `nicheId`
- `businessName`
- `category`
- `country`
- `region`
- `state`
- `city`
- `address`
- `phone`
- `whatsapp`
- `email`
- `websiteUrl`
- `websiteStatus`
- `sourceName`
- `sourceUrl`
- `sourceQuery`
- `sourceIdentifier`: place id/data id/CID or provider equivalent
- `sourceEvidence`
- `googleRating`
- `googleReviewCount`
- `leadScore`
- `contentScore`
- `designScore`
- `performanceScore`
- `seoScore`
- `temperature`
- `commercialStatus`
- `classificationReasons`: string array or JSON
- `demoUrl`
- `operatorNotes`
- `lastGeneratedPromptId`
- `lastGeneratedMessageId`
- `capturedAt`
- `updatedAt`

Relationships:

- Belongs to `User`, `FreelanceCampaign`, optional `ProspectingJob`, and optional `FreelanceNiche`.
- Has one latest `WebsiteAnalysis`.
- Has many `LatestGeneratedText` rows, but only one latest row per kind is active in MVP.

Validation:

- Must have business name, source query, source evidence/source URL or identifier, and at least one reviewable contact or website signal to be saved.
- Dedupe uses combinations of name, phone, address, website URL, and source identifier.
- Job-specific fields such as resume, job stage, or application URL are not part of this UI contract.

### WebsiteAnalysis

Stored lightweight analysis snapshot for a lead.

Fields:

- `id`
- `userId`
- `leadId`
- `requestedUrl`
- `finalUrl`
- `httpStatus`
- `reachable`
- `httpsEnabled`
- `redirected`
- `detectedStatus`
- `title`
- `metaDescription`
- `headings`: JSON
- `ctaTexts`: JSON
- `phoneSignals`: JSON
- `whatsappSignals`: JSON
- `emailSignals`: JSON
- `formDetected`
- `localServiceTextDetected`
- `socialOnlyDetected`
- `linktreeDetected`
- `aggregatorDetected`
- `brokenReason`
- `basicPerformanceEvidence`: JSON
- `basicSeoEvidence`: JSON
- `contentScore`
- `designScore`
- `performanceScore`
- `seoScore`
- `overallOpportunityScore`
- `evidencePoints`: string array or JSON
- `analyzedAt`
- `createdAt`

Relationships:

- Belongs to `User`.
- Belongs to `FreelanceLead`.

Validation:

- MVP analysis is lightweight and does not require browser screenshots.
- Failed fetches still create a snapshot with status/reason when enough lead evidence exists.

### CommercialTemplate

Freelance first-contact and follow-up template.

Fields:

- `id`
- `userId`: nullable for system defaults
- `name`
- `stage`
- `category`
- `channel`: `email`, `whatsapp`, or `any`
- `bodyTemplate`
- `variablesSchema`: JSON
- `isDefault`
- `isActive`
- `createdAt`
- `updatedAt`

Validation:

- Only Freelance variables are allowed in this feature: business name, niche, city, demo URL, offer price, installments, website score, seller name, seller WhatsApp, and classification reasons.
- Job application variables are invalid.

### SellerSettings

Operator-owned commercial defaults.

Fields:

- `id`
- `userId`
- `defaultMarketScope`
- `sellerName`
- `sellerTitle`
- `sellerEmail`
- `sellerWhatsapp`
- `portfolioUrl`
- `defaultCountry`
- `defaultCurrency`
- `offerTitle`
- `offerDescription`
- `landingPagePrice`
- `installments`
- `deliveryTime`
- `preferredNicheIds`
- `extraContext`
- `createdAt`
- `updatedAt`

Validation:

- WhatsApp accepts a light phone/WhatsApp format.
- Empty WhatsApp must be omitted from generated message output.
- Price/installments are optional for prompt generation but required for templates that reference them.

### LatestGeneratedText

Latest generated Lovable prompt or commercial message for a lead.

Fields:

- `id`
- `userId`
- `leadId`
- `kind`
- `variant`
- `templateId`
- `stage`
- `text`
- `inputContext`: JSON summary
- `copiedAt`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.
- Belongs to `FreelanceLead`.
- May belong to `CommercialTemplate`.

Validation:

- MVP saves only latest generated text per `leadId + kind + variant/stage` or equivalent replacement policy.
- No version history is required.
- Generated text must be reviewable/editable before copy/open action.

## State Transitions

### Campaign

```text
draft -> ready -> collecting -> completed
draft -> archived
ready -> archived
collecting -> paused -> collecting
collecting -> failed
completed -> archived
failed -> ready
```

### Prospecting Job

```text
pending -> running -> completed
pending -> running -> completed_no_results
pending -> running -> failed
pending -> cancelled
running -> cancelled
```

### Lead Commercial Status

```text
new -> contacted -> interested -> proposal_requested -> proposal_sent -> won
new -> ignored
contacted -> lost
interested -> lost
proposal_requested -> lost
proposal_sent -> lost
```

## Dedupe Rules

- Strong duplicate: same source identifier.
- Strong duplicate: same normalized website URL.
- Strong duplicate: same normalized phone plus city.
- Probable duplicate: same normalized business name plus city/address.
- Cross-campaign duplicates may be shown as already known instead of silently deleted if the campaign context differs.

## Retention and Privacy

- Store public business/source data and operator-provided settings only.
- Provider keys and AI keys remain in server/worker environment variables.
- Do not persist generated outreach send events in MVP because sending is not implemented.
- Do not store CSV/import artifacts because export/import is out of scope.
