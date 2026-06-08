# Provider Payload Contract: Freelance Maps and Website Analysis

## Freelance Maps Provider Interface

Provider abstraction name:

```text
freelance_maps_provider
```

MVP providers:

- `mock` for local deterministic tests
- one real provider adapter planned first: `apify_google_maps` or `serpapi_google_maps`

Non-MVP provider:

- Playwright browser automation as primary Maps scraper

## Search Input

```json
{
  "jobId": "job_123",
  "campaignId": "campaign_123",
  "marketScope": "BR",
  "country": "Brasil",
  "region": "SC",
  "city": "Indaial",
  "nicheName": "Imobiliaria",
  "queryTerms": ["imobiliaria", "Indaial", "SC"],
  "maxResults": 50
}
```

Validation:

- `campaignId`, `marketScope`, `city`, and `nicheName` are required.
- `maxResults` must use configured product caps.
- Provider keys must not be present in request payloads stored for UI.

## Normalized Business Candidate

Every provider adapter must normalize raw results into this shape before dedupe:

```json
{
  "providerName": "serpapi_google_maps",
  "sourceQuery": "imobiliaria Indaial SC",
  "sourceName": "Google Maps",
  "sourceUrl": "https://www.google.com/maps/place/example",
  "sourceIdentifier": "place_id_or_data_id",
  "businessName": "Example Imobiliaria",
  "category": "Imobiliaria",
  "address": "Rua Example, 123 - Indaial, SC",
  "country": "Brasil",
  "region": "SC",
  "city": "Indaial",
  "phone": "+5547999999999",
  "websiteUrl": "https://example.com",
  "rating": 4.8,
  "reviewCount": 71,
  "rawEvidence": "Result had website, phone, rating, address and maps URL",
  "rawProviderPayload": {}
}
```

Required for save consideration:

- `businessName`
- `sourceQuery`
- at least one of `sourceUrl`, `sourceIdentifier`, or `rawEvidence`
- at least one contact or website signal

## Candidate Outcomes

Allowed outcomes:

- `accepted`
- `duplicate`
- `rejected_missing_identity`
- `rejected_missing_evidence`
- `rejected_no_reviewable_signal`
- `provider_failed`

Duplicate reason examples:

- `same_source_identifier`
- `same_normalized_website`
- `same_phone_city`
- `same_name_address`

## Website Analysis Input

```json
{
  "leadId": "lead_123",
  "websiteUrl": "https://example.com",
  "businessName": "Example Imobiliaria",
  "city": "Indaial",
  "nicheName": "Imobiliaria"
}
```

## Website Analysis Output

```json
{
  "requestedUrl": "https://example.com",
  "finalUrl": "https://www.example.com/",
  "httpStatus": 200,
  "reachable": true,
  "httpsEnabled": true,
  "redirected": true,
  "detectedStatus": "weak_site",
  "title": "Example Imobiliaria",
  "metaDescription": "Casas e apartamentos em Indaial",
  "headings": ["Imoveis em Indaial"],
  "ctaTexts": ["Fale conosco", "Ver imoveis"],
  "phoneSignals": ["+55 47 99999-9999"],
  "whatsappSignals": [],
  "emailSignals": ["contato@example.com"],
  "formDetected": true,
  "localServiceTextDetected": true,
  "socialOnlyDetected": false,
  "linktreeDetected": false,
  "aggregatorDetected": false,
  "brokenReason": null,
  "basicPerformanceEvidence": {
    "htmlBytes": 128000,
    "scriptCount": 24,
    "imageCount": 18
  },
  "basicSeoEvidence": {
    "hasTitle": true,
    "hasMetaDescription": true,
    "headingCount": 8,
    "hasLocalCityText": true
  },
  "scores": {
    "content": 67,
    "design": 58,
    "performance": 55,
    "seo": 62,
    "overallOpportunity": 71
  },
  "evidencePoints": [
    "Homepage has CTA but weak local service detail",
    "Meta description exists",
    "Many scripts/images for a simple local business site"
  ]
}
```

Validation:

- The MVP does not require browser screenshot, Lighthouse, or viewport rendering.
- Failed fetch must still return `reachable=false`, `httpStatus` when available, `brokenReason`, and evidence suitable for review.

## Website Status Mapping

- Missing `websiteUrl`: `no_site`
- Website is Facebook/Instagram/social profile: `social_only`
- Website is Linktree or equivalent link hub: `linktree`
- Website is marketplace/aggregator/booking profile: `aggregator`
- Fetch fails or page is inaccessible: `broken`
- Fetch succeeds with weak content/SEO/performance evidence: `weak_site`
- Fetch succeeds with adequate signals: `usable_site`
- Conflicting or insufficient evidence: `uncertain`

## Provider Diagnostics

Each `ProspectingJob` stores diagnostics:

```json
{
  "providerName": "serpapi_google_maps",
  "providerStatus": "partial",
  "requestedMaxResults": 50,
  "rawResultCount": 47,
  "normalizedCount": 43,
  "acceptedCount": 19,
  "duplicateCount": 8,
  "rejectedCount": 16,
  "errorCode": null,
  "errorMessage": null
}
```

Diagnostics must be visible enough for troubleshooting but must not expose provider secrets.
