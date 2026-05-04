# Base de Prompt para `Lovable`

Este arquivo serve como base para gerar prompts de landing page no `Lovable`.

Ele foi derivado do exemplo real usado no fluxo de leads e deve ser preenchido por lead ou por
campanha. Ajuste apenas o que for necessario para o nicho, localidade e contexto comercial. Quando o
lead vier de Google Maps ou da busca manual por nicho/cidade, use os dados reais capturados: nome do
negocio, nicho, localizacao, telefone, email, nota/reviews, website atual, problema identificado e
concorrente local de referencia quando houver.

## Quando usar

Use esta base quando houver:

- um lead qualificado
- contexto suficiente do negocio
- uma oferta clara
- intencao de gerar uma landing page demo para outreach
- evidencia de oportunidade, como ausencia de site, rede social usada como site ou site fraco

## Regras gerais

- pedir codigo completo e pronto para producao
- manter a pagina enxuta e orientada a conversao
- adaptar trust signals ao mercado e ao nicho
- evitar texto generico sem contexto local
- incluir SEO e acessibilidade sempre que fizer sentido
- preservar um layout unico por cliente quando houver `seed`

## Template base

```text
Create a complete, production-ready landing page for "[BUSINESS_NAME]" — a [NICHE] business in [CITY], [REGION].

=========================================================
BRAND IDENTITY
=========================================================

Business: [BUSINESS_NAME]
Niche: [NICHE]
Location: [CITY], [REGION]
Tagline: "[TAGLINE]"
Primary Color: [PRIMARY_COLOR]
Secondary Color: [SECONDARY_COLOR]
Accent Color: [ACCENT_COLOR]
Contact: Phone: [PHONE_CLICK_TO_CALL] (click-to-call)
Phone: [PHONE_DISPLAY]
Google Rating: [GOOGLE_RATING]
Website Status: [NO_WEBSITE_OR_SOCIAL_ONLY_OR_WEAK_SITE]
Observed Opportunity: [WHY_THIS_BUSINESS_NEEDS_A_SITE]
Competitor Reference: [OPTIONAL_COMPETITOR_WITH_BETTER_SITE]

=========================================================
PAGE GOAL
=========================================================

- Main objective: generate trust and convert visitors into consultation or contact requests
- Offer angle: [FREE_CONSULTATION_OR_ESTIMATE]
- Primary CTA: [PRIMARY_CTA]
- Secondary CTA: [SECONDARY_CTA]

=========================================================
PAGE STRUCTURE
=========================================================

Create a single-page landing page with [NUMBER_OF_SECTIONS] sections:

1. HERO SECTION
   - strong local positioning for [CITY], [REGION]
   - clear trust headline based on "[TAGLINE]"
   - sub-headline with niche + city + trust signal
   - two CTAs side-by-side
   - trust badges below CTAs

2. SERVICES SECTION
   - section title: "[SERVICES_TITLE]"
   - [SERVICES_GRID_LAYOUT]
   - services:
     1. [SERVICE_1]
     2. [SERVICE_2]
     3. [SERVICE_3]
     4. [SERVICE_4]
     5. [SERVICE_5]
     6. [SERVICE_6]
   - each card should include icon, title and short description

3. ABOUT / WHY CHOOSE US
   - section title: "[WHY_CHOOSE_US_TITLE]"
   - feature grid with 3 trust signals
   - short professional paragraph

4. SOCIAL PROOF
   - section title: "[TESTIMONIALS_TITLE]"
   - 3 testimonials
   - rating display
   - badge or link for review platform

5. GALLERY / PORTFOLIO
   - section title: "[GALLERY_TITLE]"
   - visual placeholders or cards
   - optional before/after depending on niche

6. CONTACT / BOOKING FORM
   - section title: "[CONTACT_TITLE]"
   - fields:
     - Full Name
     - Email
     - Phone Number
     - Service Needed
     - Preferred Date
     - Message
   - side panel with hours, phone, address and maps placeholder
   - privacy note near form

7. FOOTER
   - business name
   - address
   - phone
   - service links
   - social links
   - local service statement

=========================================================
DESIGN SYSTEM
=========================================================

Colors:
- Primary: [PRIMARY_COLOR]
- Secondary: [SECONDARY_COLOR]
- Accent: [ACCENT_COLOR]
- Text: [TEXT_COLOR]
- Background: [BACKGROUND_COLOR]

Typography:
- Headings: [HEADING_FONT]
- Body: [BODY_FONT]
- H1 size: [H1_SIZE]
- H2 size: [H2_SIZE]
- Body size: [BODY_SIZE]

Spacing:
- section spacing: [SECTION_SPACING]

Components:
- CTA style: [CTA_STYLE]
- cards: [CARD_STYLE]
- header behavior: [HEADER_BEHAVIOR]

Animations:
- use lightweight motion only
- mobile should favor simpler effects
- avoid heavy animation that harms performance

=========================================================
MOBILE REQUIREMENTS
=========================================================

- sticky header with click-to-call
- floating CTA button
- full-width form inputs
- touch-friendly controls
- mobile-friendly gallery behavior
- avoid complex navigation patterns

=========================================================
SEO
=========================================================

<title>[SEO_TITLE]</title>
<meta name="description" content="[SEO_DESCRIPTION]">

Include Schema.org markup appropriate for the niche, using:
- business name
- address
- telephone
- rating
- opening hours
- service area

Keywords:
- [KEYWORD_1]
- [KEYWORD_2]
- [KEYWORD_3]

=========================================================
TECH STACK
=========================================================

Use:
- React 18
- TypeScript
- Vite
- Tailwind CSS 3
- Framer Motion only when useful and lightweight
- Lucide icons

Ensure:
- accessible contrast
- focus states
- alt text strategy
- responsive layout

=========================================================
BEHAVIORAL PSYCHOLOGY
=========================================================

Target market: [TARGET_MARKET]
Purchase style: [PURCHASE_STYLE]

Trust signals to emphasize:
- [TRUST_SIGNAL_1]
- [TRUST_SIGNAL_2]
- [TRUST_SIGNAL_3]

Conversion expectations:
- [SCHEDULING_EXPECTATION]
- [PRIVACY_EXPECTATION]
- [PROOF_EXPECTATION]

=========================================================
UNIQUE DESIGN RULES
=========================================================

Seed: [UNIQUE_SEED]

Hero layout:
- [HERO_LAYOUT]

Section order after hero:
1. [SECTION_AFTER_HERO_1]
2. [SECTION_AFTER_HERO_2]
3. [SECTION_AFTER_HERO_3]
4. [SECTION_AFTER_HERO_4]
5. [SECTION_AFTER_HERO_5]
6. [SECTION_AFTER_HERO_6]
7. [SECTION_AFTER_HERO_7]
8. [SECTION_AFTER_HERO_8]
9. [SECTION_AFTER_HERO_9]
10. [SECTION_AFTER_HERO_10]

Important:
- do not copy layouts from other projects
- keep this design unique to the client
- use the seed and visual rules consistently

COMPLETE, PRODUCTION-READY CODE.
```

## Campos minimos para preencher

Antes de gerar o prompt, tente ter pelo menos:

- nome do negocio
- nicho
- cidade e regiao
- telefone
- oferta principal
- CTA principal
- 4 a 6 servicos
- 3 sinais de confianca
- seed ou orientacao visual unica

## Variantes recomendadas

### `completo`

Use quando:

- o lead esta quente
- ja existe contexto suficiente
- a demo precisa ficar mais convincente

### `compacto`

Use quando:

- voce quer iterar rapido
- o prompt sera refinado depois
- ainda faltam alguns dados

### `generico`

Use quando:

- o objetivo e produzir uma primeira versao neutra
- o negocio ainda nao tem identidade clara definida

## Mapeamento com o fluxo de leads

O ideal e preencher este prompt com dados vindos de:

- `business_name`
- `category` ou nicho
- `city`, `region`, `country`
- `phone`
- `lead_score`
- `source_evidence`
- `operator_notes`
- `demo_url`, se ja existir alguma iteracao anterior
