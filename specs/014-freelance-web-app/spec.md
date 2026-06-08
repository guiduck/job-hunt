# Feature Specification: Freelance Web App

**Feature Branch**: `014-freelance-web-app`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: User description: "Create the first Spec Kit feature for the Freelance product from docs/next-spec-prompt.md: a separate internal web app for prospecting local businesses by niche/location, reviewing leads, analyzing websites, and preparing Lovable/demo outreach."

## Continuity Context

**Roadmap Phase**: Fase 4. Prospeccao Freelance  
**Action Plan Step**: 7. App web freelance  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Use `docs/next-spec-prompt.md` to create the first Freelance product spec. The feature starts a separate internal Freelance experience for campaigns by niche/location, realistic local business discovery, website analysis, dense lead review, Lovable prompt generation, and human-approved commercial messaging.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-06-06

- Q: What is the MVP boundary for the first Freelance release? -> A: Full thin slice: campaign creation, one prospecting job path, website analysis, lead list/detail, Lovable prompt, message generation, and minimal settings/templates.
- Q: What depth of website analysis is required in the MVP? -> A: Lightweight analysis is required: homepage fetch, final URL/status, HTTPS, title/meta/headings, CTAs, contacts, social/Linktree/broken detection, and basic SEO/content/performance evidence.
- Q: Which market scope must the first release support? -> A: Both BR and international campaign modes are available in MVP, while first smoke/validation may focus on one chosen market.
- Q: What CSV export scope is required? -> A: No CSV export is required in MVP or planned by default; add export later only if an explicit operational need appears.
- Q: How should generated Lovable prompts and commercial messages be persisted? -> A: Lead data and templates persist; prompts/messages generate on demand and only the latest generated text per lead is saved in MVP, with no version history.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Prospecting Campaign (Priority: P1)

As the operator, I want to create a Freelance campaign by market, country or region, niche, state, city, and optional search settings so that every prospecting run starts with a clear commercial target.

**Why this priority**: Campaign creation is the entry point for the entire Freelance workflow and defines the niche/location context used by discovery, scoring, review, prompts, and messages.

**Independent Test**: Can be fully tested by creating a campaign from the seeded niche catalog, confirming that the campaign appears in the Campaigns view with the selected market, locality, niche, status, and ready-to-prospect action.

**Acceptance Scenarios**:

1. **Given** the operator is in the Freelance area and the niche catalog has enabled niches, **When** the operator creates a campaign with market, location, and niche, **Then** the campaign is saved as a Freelance campaign and shown without any job/curriculum language.
2. **Given** a campaign is missing required market, location, or niche information, **When** the operator tries to save it, **Then** the operator receives clear validation feedback and no incomplete campaign is started.
3. **Given** a campaign uses a seeded niche with a conversion hint, **When** the operator reviews the campaign form or card, **Then** the hint is visible as an estimate for prioritization, not as a guaranteed result.

---

### User Story 2 - Discover and Classify Local Businesses (Priority: P1)

As the operator, I want to start a prospecting job for a campaign so that the system finds local businesses a real user would find by searching for that niche and location, then normalizes, deduplicates, and classifies them for review.

**Why this priority**: The product is only useful if it can produce reviewable Freelance leads with source evidence and website maturity signals, rather than empty campaigns or generic scraped data.

**Independent Test**: Can be tested by starting a prospecting job for one campaign and verifying that resulting leads include business identity, location, contact channels when available, source query, source URL or source identifier, website classification, dedupe behavior, and a review status.

**Acceptance Scenarios**:

1. **Given** a valid campaign in draft or ready status, **When** the operator starts prospecting, **Then** the campaign shows job progress through discovery, normalization, website checks, scoring, and save steps.
2. **Given** two discovered candidates appear to represent the same business, **When** they share strong identity signals such as name plus phone, address, website, or source identifier, **Then** they are merged or skipped as duplicates with a traceable reason.
3. **Given** a discovered business has no website, only a social profile, a Linktree-like destination, a broken page, a weak website, or a usable website, **When** the candidate is saved, **Then** the website status and supporting reasons are recorded for human review.
4. **Given** a discovery provider returns no usable businesses or fails, **When** the job ends, **Then** the campaign shows a terminal empty or failed state that keeps the UI usable and preserves provider/error context.

---

### User Story 3 - Review Freelance Leads in a Dense Operations UI (Priority: P2)

As the operator, I want to review Freelance leads in a dense table and detail page so that I can quickly prioritize businesses, inspect evidence, update status, and decide the next commercial action.

**Why this priority**: Discovery without review does not create business value; the operator needs a focused desk for evaluating leads and acting on the best ones.

**Independent Test**: Can be tested by opening the Leads view after a campaign has saved prospects, filtering by campaign/niche/status/website status/score, opening a lead detail, and updating commercial status and notes.

**Acceptance Scenarios**:

1. **Given** saved Freelance leads exist, **When** the operator opens the Leads view, **Then** the table shows only business/prospect language and columns such as business name, contact channels, niche, score, temperature, commercial status, and actions.
2. **Given** the operator filters leads by campaign, niche, city, temperature, status, website status, or minimum score, **When** matching leads exist, **Then** only matching Freelance leads are displayed.
3. **Given** the operator opens a lead detail page, **When** the lead has source and website analysis data, **Then** the page shows business info, contact info, Google rating/review metadata when available, source evidence, website analysis, separate content/design/performance/SEO scores, overall opportunity score, demo URL, status controls, and notes.
4. **Given** a lead belongs to the Freelance flow, **When** the operator reviews its detail page, **Then** the page does not show job application status, resume attachment actions, interview status, or job-specific templates.

---

### User Story 4 - Generate Lovable Prompts and Commercial Messages (Priority: P2)

As the operator, I want to generate and copy Lovable prompts and first-contact/follow-up messages from a lead detail page so that I can prepare demos and outreach with human approval.

**Why this priority**: The Freelance product value is not only finding weak-site businesses; it should convert review findings into demo and outreach material quickly.

**Independent Test**: Can be tested from one reviewed lead by saving a demo URL, opening the Lovable prompt modal, switching prompt variants, copying a prompt, generating first-contact and follow-up messages, editing/copying them, and confirming no automatic sending occurs.

**Acceptance Scenarios**:

1. **Given** a Freelance lead detail page is open, **When** the operator opens the Lovable prompt modal, **Then** the modal offers complete, generic, and compact variants using the lead's business, niche, location, contact, source, website signals, score, and commercial context.
2. **Given** a prompt variant is generated, **When** the operator copies it, **Then** the UI confirms the copy action and the generated text remains reviewable.
3. **Given** the operator generates a first-contact or follow-up message, **When** a template is selected, **Then** the message uses Freelance commercial variables such as business name, niche, city, demo URL, offer, price, and seller data.
4. **Given** a message has been generated, **When** the operator chooses an email or WhatsApp action, **Then** the system prepares copy/open/review behavior only and does not automatically send outreach.

---

### User Story 5 - Manage Freelance Templates and Settings (Priority: P3)

As the operator, I want to manage Freelance-specific templates and seller settings so that campaign outputs, prompts, and messages use consistent offer, pricing, contact, and niche preferences.

**Why this priority**: Templates and settings make outreach repeatable, but the first valuable slice can exist with defaults while management screens mature.

**Independent Test**: Can be tested by editing seller data, WhatsApp, offer, price/installments, preferred niches, and commercial templates, then generating a message that reflects the saved settings.

**Acceptance Scenarios**:

1. **Given** the operator opens Freelance Settings, **When** they save seller identity, WhatsApp, offer, price, installments, and preferred niches, **Then** those values are available to lead detail message generation and campaign defaults.
2. **Given** the operator opens Templates, **When** they create, edit, preview, restore, activate, deactivate, or delete a Freelance template, **Then** the template list remains limited to commercial first-contact and follow-up templates.
3. **Given** required seller or offer fields are missing, **When** the operator tries to generate a commercial message that depends on them, **Then** the UI explains what is missing and lets the operator continue only when the message can be reviewed honestly.

### Edge Cases

- A campaign is created for a city/location that returns no local businesses.
- A discovery result has a business name but no phone, email, website, or usable source URL.
- A business website redirects to a social network, marketplace, booking platform, or Linktree-like page.
- A website fetch succeeds but the HTML has little text, broken metadata, or language that does not match the campaign market.
- A website fetch fails because of timeout, TLS/HTTPS errors, blocking, or non-HTML content.
- A result has a high Google rating and usable website but weak conversion reasons; it should remain reviewable rather than be hidden.
- A duplicate business appears across two campaigns or two nearby locations.
- A seeded niche is disabled after older campaigns already used it.
- Seller settings are incomplete when the operator tries to generate messages.
- The operator switches from Full-time to Freelance and should never see mixed job and business prospects in the same operational list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a separate Freelance operational experience with Dashboard, Campaigns, Leads, Lead Detail, Templates, and Settings views.
- **FR-002**: The Freelance experience MUST NOT mix job opportunities, job application statuses, resumes, interviews, or job templates into Freelance tables, details, templates, or actions.
- **FR-002a**: The first release MUST deliver a full thin vertical slice that includes campaign creation, one prospecting job path, website analysis, lead list/detail review, Lovable prompt generation, message generation, and minimal settings/templates.
- **FR-003**: The system MUST allow the operator to create, edit, view, start, pause or stop where supported, and archive Freelance campaigns by market, country or region, niche, state, city, status, and optional search settings.
- **FR-003a**: The MVP MUST support both BR and international market modes in campaign setup, niche selection, location fields, settings defaults, and message context, but acceptance validation MAY use one representative market sample first.
- **FR-004**: Campaign creation MUST select niches from a configurable niche catalog seeded from the existing project reference list and MUST preserve conversion hints where available as editable estimates.
- **FR-005**: The niche catalog MUST allow enabled/disabled/editable niches without requiring older campaigns to lose their historical niche context.
- **FR-006**: The system MUST start a prospecting job from a Freelance campaign and expose progress states for discovery, normalization, deduplication, website analysis, scoring, saving, completion, failure, and cancellation or stop where supported.
- **FR-007**: Discovery results MUST represent businesses found from realistic local niche/location search behavior and MUST include source query plus source URL, source identifier, or equivalent evidence whenever available.
- **FR-008**: The system MUST normalize discovered businesses into reviewable leads with business name, niche, location, address when available, phone, email, website URL, source metadata, rating/review metadata when available, and capture timestamp.
- **FR-009**: The system MUST deduplicate discovered businesses using available identity signals and MUST preserve a reason when a candidate is skipped or merged as a duplicate.
- **FR-010**: The system MUST classify each lead's website situation as no site, social-only, Linktree-like, aggregator/marketplace, broken/inaccessible, weak site, usable site, or uncertain.
- **FR-011**: When a discovered business has a website URL, the MVP MUST run lightweight website analysis and store reviewable evidence including homepage fetch result, final URL, reachability/status, HTTPS, title, meta description, headings, calls to action, contact signals, forms when detected, social/Linktree/broken-page detection, basic SEO/content/performance evidence, and classification reasons.
- **FR-012**: Website analysis MUST produce separate content, design, performance, SEO, and overall commercial opportunity scores with human-readable reasons.
- **FR-012a**: Deep browser-based responsive checks, visual design inspection, mobile/desktop rendering scores, detailed page-weight audits, and script/image diagnostics SHOULD be deferred beyond the first release unless they are needed to resolve an uncertain lead manually.
- **FR-013**: The Leads view MUST support dense review with search, campaign filter, niche filter, city/region filter, temperature filter, commercial status filter, website status filter, minimum score filter, row selection, and per-row actions.
- **FR-013a**: CSV export is NOT required in the MVP and SHOULD NOT be planned by default unless a future explicit operational need is identified.
- **FR-014**: The Lead Detail view MUST show business information, contact information, source evidence, Google Maps or equivalent local search evidence when available, website analysis, score breakdown, commercial status, operator notes, demo URL, Lovable prompt action, and message generation action.
- **FR-015**: The operator MUST be able to update commercial status, lead temperature, notes, and demo URL from the Freelance lead review flow.
- **FR-016**: The system MUST provide a Lovable prompt modal from the Freelance Lead Detail view with complete, generic, and compact variants, character count, reviewable text, and copy feedback.
- **FR-017**: Lovable prompts MUST be generated from saved lead context and MUST use Freelance/demo language, not job application language.
- **FR-018**: The system MUST provide first-contact and follow-up message generation from the Freelance Lead Detail view using selected commercial templates and saved seller settings.
- **FR-019**: Generated messages MUST remain human-reviewable and editable before any copy, email, or WhatsApp action.
- **FR-019a**: Lovable prompts and commercial messages MUST be generated on demand from persisted lead data, templates, and seller settings; the MVP MUST save only the latest generated prompt/message text per lead and MUST NOT require version history.
- **FR-020**: The first release MUST NOT automatically send WhatsApp or email outreach; it may prepare, copy, or open reviewable messages for human action.
- **FR-021**: Templates in the Freelance experience MUST be scoped to commercial first-contact and follow-up use cases and MUST NOT show job application templates.
- **FR-022**: Settings in the Freelance experience MUST support seller data, WhatsApp, offer, price, installments, preferred niches, and default commercial message context.
- **FR-023**: Dashboard metrics MUST summarize only Freelance data, including total leads, contacted leads, converted leads, hot leads, demos, generated prompts, and potential revenue where enough data exists.
- **FR-024**: Empty, loading, failure, and terminal job states MUST be specific to the Freelance workflow and must leave the operator with a clear next action.
- **FR-025**: Every saved Freelance lead MUST preserve enough evidence to explain why it was captured and how its website/opportunity classification was reached.

### Key Entities *(include if feature involves data)*

- **Freelance Campaign**: A prospecting initiative scoped to the Freelance flow. It includes market, country or region, state/city, niche, status, search settings, progress, counters, and links to discovered leads.
- **Niche Catalog Item**: A configurable niche option used to seed and create campaigns. It includes name, market applicability, conversion hint, default query terms, enabled state, and ordering.
- **Prospecting Job**: A long-running discovery and analysis run for a campaign. It includes lifecycle status, progress step, provider/source diagnostics, counters, failure reasons, and timing.
- **Freelance Lead**: A business/prospect discovered for commercial review. It includes identity, niche, locality, contact channels, source evidence, website classification, scores, temperature, status, notes, and demo URL.
- **Source Evidence**: The traceable query, URL, identifier, raw summary, or extracted signals that justify why a business was captured.
- **Website Analysis**: A stored assessment of a lead's website or website-like destination, including reachability, final URL, extracted content/contact signals, classification, score breakdown, and reasons.
- **Commercial Template**: A reusable first-contact or follow-up message pattern scoped to the Freelance flow.
- **Latest Generated Prompt/Message**: The most recent on-demand Lovable prompt and commercial message generated for a lead. It preserves the latest reviewable text and variant/stage context only; historical versions are out of scope for the MVP.
- **Seller Settings**: Operator-owned commercial context such as name, WhatsApp, offer, price, installments, preferred niches, and default message details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The operator can create a valid Freelance campaign from the seeded niche catalog in under 2 minutes without entering free-form niche data.
- **SC-001a**: The operator can create at least one BR campaign and one international campaign from the same flow without job-specific language or manual code/config changes.
- **SC-002**: At least 90% of saved leads from a completed prospecting job include source query, source evidence, business name, niche, location, and at least one reviewable contact or website signal.
- **SC-003**: At least 95% of duplicate candidates in a repeated run for the same campaign are skipped or merged rather than creating duplicate lead rows.
- **SC-004**: For leads with website URLs, at least 90% of completed MVP analyses produce a website classification, score breakdown, homepage status/final URL, and at least three human-readable evidence points from lightweight analysis.
- **SC-005**: The operator can filter a list of 500 Freelance leads by campaign, niche, website status, commercial status, and minimum score without losing selected filter context.
- **SC-006**: The operator can open a lead, inspect source evidence and website analysis, update status/notes/demo URL, generate a Lovable prompt, and copy a first-contact message in under 5 minutes.
- **SC-007**: Zero job-specific labels or actions appear in Freelance Campaigns, Leads, Lead Detail, Templates, or Settings during acceptance testing.
- **SC-008**: No generated outreach is sent automatically in the first release; 100% of email/WhatsApp actions require explicit human copy/open/review behavior.

## Assumptions

- The primary operator is a single internal user using the product for personal Freelance prospecting, not a public SaaS audience.
- The Full-time extension remains a separate product surface; this feature does not modify or rebuild it.
- Campaign discovery is allowed to use realistic local search provider results as long as saved records preserve source evidence and provider constraints are reviewed before scale.
- Google Places official data is not assumed to be the first discovery source for this MVP because the product needs reviewable local search behavior similar to what a user sees in search/maps.
- Playwright-style browser automation may be useful for future audit/fallback comparisons but is not treated as the primary discovery dependency for the first product slice.
- Conversion hints from the existing niche reference are estimates for prioritization and display, not promised conversion rates.
- Website analysis is best-effort and reviewable; uncertain classifications remain visible instead of being hidden.
- Outreach remains human-gated in this feature. Automatic sending, campaign sequencing, and compliance/rate-limit automation are future work.
- The first release optimizes for desktop operational review; small-screen support should remain usable but is not the core workflow.
- The next Spec Kit command should clarify any remaining scope decisions before implementation planning.
