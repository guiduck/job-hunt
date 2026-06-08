# Web UI Contract: Freelance Web App

## Global Shell

The `apps/web` MVP is the internal Freelance app. It may show a mode indicator, but it must not behave like a mixed Full-time/Freelance CRM.

Required navigation:

- Dashboard
- Campanhas
- Leads
- Templates
- Configuracoes

Visual contract:

- dark, dense operational UI
- fixed sidebar on desktop
- top status/context bar
- compact filters
- dense tables
- detail layout with main column plus right-side action/score column
- no marketing landing page as the first screen

Forbidden in Freelance screens:

- resume/curriculum actions
- job application status
- interview status
- job template labels
- bulk email send for applications
- ATS score/resume generation

## Dashboard

Must display Freelance-only metrics:

- total leads
- contacted leads
- converted/won leads
- hot leads
- demos with URL
- generated prompts/messages count or latest-generated count
- potential revenue when settings allow calculation

Dashboard cards must link to:

- create campaign
- prospect from a ready campaign
- review hot/new leads
- open templates/settings when required data is missing

## Campaigns

### Create Campaign Modal/Form

Required fields:

- market scope: BR or International
- country/region
- state/region
- city
- niche from seeded catalog
- generated campaign name, editable
- optional max results/search settings

Validation:

- cannot start prospecting without required locality and niche
- disabled niches cannot be selected for new campaigns
- conversion hint is displayed as an estimate only

### Campaign Card

Must show:

- name
- niche
- market/location
- status
- lead count
- hot/contacted counters when available
- latest run/progress
- actions: View Leads, Prospect, Pause/Stop when supported, Archive/Delete where safe

## Leads

Required filters:

- text search
- campaign
- niche
- city/region
- temperature
- commercial status
- website status
- minimum score

CSV export:

- not present in MVP

Table columns:

- checkbox
- business name
- phone/contact channel
- email/contact channel
- niche
- website status
- score
- temperature
- commercial status
- actions

Per-row actions:

- View
- Generate prompt
- Generate message
- Open demo when demo URL exists

## Lead Detail

Must include:

- back action
- business name
- status/temperature badges
- phone, email, WhatsApp, website
- address/city/region/country
- niche
- Google rating/reviews when available
- source query and source URL/identifier
- source evidence
- website status
- lightweight website analysis evidence
- content/design/performance/SEO scores
- overall score
- classification reasons
- commercial status controls
- operator notes
- demo URL edit/save
- Lovable prompt action
- commercial message generator

Must not include:

- resume selection
- job application stages
- interview/rejection statuses
- job application templates

## Lovable Prompt Modal

Entry point:

- Lead Detail only

Required behavior:

- generate on demand from persisted lead data, website analysis, seller settings, and prompt variant
- variants: complete, generic, compact
- display character count
- large reviewable text area
- copy action with feedback
- save only latest generated prompt text for the lead
- no version history in MVP

## Commercial Message Generator

Entry point:

- Lead Detail only

Required behavior:

- stages: first contact, follow-up
- template selector
- generate from lead data, selected template, latest demo URL, seller settings, and website evidence
- review/edit generated text before copy/open
- save only latest generated message text for the lead/stage
- email/WhatsApp actions are copy/open/review only; no automatic send

## Templates

Required behavior:

- list commercial templates only
- filter or segment by all, first contact, follow-up
- create/edit/preview/deactivate/delete custom templates
- restore default templates if implementation includes default seed reset

Template variables:

- `business_name`
- `niche`
- `city`
- `demo_url`
- `offer_price`
- `installments`
- `website_score`
- `seller_name`
- `seller_whatsapp`
- `classification_reason`

## Settings

Required fields:

- default market/country
- seller name
- seller title
- seller email
- WhatsApp
- offer title/description
- price
- installments
- delivery time
- preferred niches
- extra context

Behavior:

- show missing-data alert when prompt/message generation would be incomplete
- omit empty WhatsApp from generated text
- save settings owner-scoped

## Empty and Failure States

Campaigns empty:

- prompt operator to create first Freelance campaign

Leads empty:

- prompt operator to create/start a campaign

Job failed:

- show provider/status reason and allow retry when campaign is no longer running

Website analysis failed:

- keep lead reviewable with failure evidence
