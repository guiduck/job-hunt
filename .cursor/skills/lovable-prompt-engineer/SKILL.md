---
name: lovable-prompt-engineer
description: Generate Lovable-ready super prompts for this project using the existing Lovable templates, docs, and visual references. Use when the user asks for a Lovable prompt, super prompt, landing page prompt, UI prompt, or wants to adapt references/lovable-template and docs/ into a high-conversion Lovable build prompt.
---

# Lovable Prompt Engineer

Generate project-aware Lovable super prompts that follow the same structure and conversion logic as the existing Lovable templates while adapting the output to this repository's product, documentation, and visual references.

## When to Use

- The user asks for a prompt for Lovable, Lovable AI, or a "super prompt".
- The user wants to create or improve a landing page, dashboard, UI, web app, MVP, or product demo in Lovable.
- The user references `references/lovable-template`, `docs/lovable-prompt-base.md`, `docs/`, or `references/images`.
- The user wants a prompt in the same model/style as the available Lovable templates.

## Required Context

Before producing the final prompt, gather the relevant context from:

- `docs/` - read all Markdown docs that describe the product, architecture, roadmap, data model, bots, UI direction, handoff, and action plan.
- `docs/lovable-prompt-base.md` - use it as the baseline output structure.
- `references/lovable-template/prompt-template-1.md`
- `references/lovable-template/prompt-template-2.md`
- `references/lovable-template/prompt-template-3.md`
- `references/guia/Guia completo - Ganhe dolar na gringa por Harlley Bastos (1).pdf` when the prompt is for freelance prospecting, Google Maps leads, local businesses, email outreach, or demo creation.
- `references/images/` - inspect all available reference images, including `image.png`, `image-2.png` through `image-26.png`, and `image.-16png.png`.
- `README.md` when product context, setup, or positioning is needed.

If some referenced files are missing, say which context was unavailable and proceed with explicit assumptions.

## Core Goal

Do not simply summarize the docs. Produce a complete Lovable-ready prompt that tells Lovable exactly what to build, why it matters, what visual direction to follow, and how the implementation should behave.

The generated prompt should:

1. Match the structure and level of specificity of the Lovable templates.
2. Adapt the content to this project rather than generic local-business landing pages.
3. Use the product language, domain model, workflows, roadmap, and UI intentions from `docs/`.
4. Incorporate the visual direction from `references/images/`.
5. Preserve Lovable-friendly specificity: sections, components, states, data, interactions, CTAs, responsive behavior, and implementation requirements.
6. Ask Lovable for complete, production-ready code unless the user requests a planning-only prompt.

For `Freelance` lead prompts generated from Google Maps or manual prospecting, the prompt should also
use the lead's business name, niche, city, Google rating/review count, phone/email, website status,
observed weakness, competitor reference when available, and the outreach/demo goal from the guide.
Treat "no website", "Facebook/Instagram as website", and "weak website" as different conversion
angles.

## Visual Reference Handling

Always account for `references/images/` in the prompt. The generated Lovable prompt must explicitly tell Lovable to use the attached/reference images as visual inspiration.

When analyzing the images, extract:

- Layout patterns: hero structure, navigation, sidebars, cards, tables, panels, forms, empty states, charts, modals, dashboards, mobile layouts.
- Visual style: color palette, contrast, spacing, border radius, shadows, density, typography, icons, gradients, and illustration/photo usage.
- Interaction cues: filters, search, sorting, pagination, tabs, accordions, drawers, hover states, sticky elements, multi-step flows.
- Product implications: which images look like the closest target UI for this project.

Do not invent that the app owns those images. Treat them as reference material unless the user says they are assets to use directly.

## Lovable Prompt Shape

Use this structure by default:

```text
Create a complete, production-ready [APP_OR_PAGE_TYPE] for "[PROJECT_OR_FEATURE_NAME]".

=========================================================
PROJECT CONTEXT
=========================================================

[Summarize the project using docs/: what it does, who it serves, core workflow, current phase, and main business goal.]

=========================================================
PRODUCT GOAL
=========================================================

- Main objective: [conversion, lead triage, scraping workflow, CRM workflow, local opportunity discovery, etc.]
- Primary user: [operator, freelancer, sales user, admin, prospect, etc.]
- Success outcome: [clear measurable or observable result]
- Primary CTA/action: [main action]
- Secondary actions: [supporting actions]

=========================================================
REFERENCE MATERIAL TO FOLLOW
=========================================================

- Follow the structure and specificity of the Lovable templates in references/lovable-template.
- Use docs/lovable-prompt-base.md as the base prompt model.
- Use the attached images from references/images as visual inspiration for layout, spacing, UI density, cards, tables, panels, navigation, and responsive behavior.
- Do not copy unrelated business content from the templates. Adapt the model to this project.

=========================================================
INFORMATION ARCHITECTURE / PAGE STRUCTURE
=========================================================

[List sections or screens with detailed requirements. Include purpose, content, components, interactions, empty/loading/error states where relevant.]

=========================================================
CORE FEATURES
=========================================================

[List feature requirements grounded in docs/. Include workflows, data entities, filters, actions, status transitions, and user feedback.]
For freelance local-business demos, include Google Maps/source context, website weakness, review
signals, services, local SEO angle, and the CTA/channel intended for outreach.

=========================================================
DESIGN SYSTEM
=========================================================

Colors:
- [Palette inferred from docs and images]

Typography:
- [Fonts and hierarchy]

Spacing and Layout:
- [Grid, max width, card density, section spacing]

Components:
- [Buttons, cards, forms, tables, badges, filters, sidebars, modals]

Motion:
- Lightweight, purposeful transitions only.
- Respect reduced motion.
- Keep mobile interactions fast and simple.

=========================================================
RESPONSIVE REQUIREMENTS
=========================================================

[Desktop, tablet, and mobile behavior. Include touch targets, sticky actions, navigation collapse, table/card transformations.]

=========================================================
DATA MODEL AND CONTENT
=========================================================

[Use project docs to define realistic fields, labels, statuses, sample records, and copy. Avoid generic placeholder content when docs provide product terms.]

=========================================================
CONVERSION / UX PSYCHOLOGY
=========================================================

[Explain the user's decision path, trust signals, clarity rules, urgency, proof, risk reduction, and CTA placement. Adapt this to the project instead of local-business boilerplate.]

=========================================================
SEO / ACCESSIBILITY / PERFORMANCE
=========================================================

[Only include SEO if relevant. Always include accessibility and performance requirements.]

=========================================================
TECH STACK
=========================================================

Use:
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide icons
- Framer Motion only when useful and lightweight

Ensure:
- accessible contrast
- keyboard navigation
- focus states
- responsive layout
- no unnecessary dependencies

=========================================================
UNIQUE DESIGN RULES
=========================================================

Seed: [project/feature/client seed]

[Give unique hero layout, section order, card style, CTA style, spacing density, color accents, and image-inspired visual rules.]

Important:
- Do not copy layouts from unrelated projects.
- Keep the design unique to this project and this feature.
- Use the reference images as inspiration, not as literal screenshots to duplicate.

COMPLETE, PRODUCTION-READY CODE.
```

## Quality Rules

- Prefer a single complete prompt over multiple small prompts unless the user asks for variants.
- Keep the output detailed enough that Lovable can build without additional explanation.
- Include concrete labels, sample data, section names, and UI states from project docs.
- If project docs conflict, mention the assumption chosen inside the prompt.
- Avoid vague phrases like "modern UI" unless immediately followed by concrete visual rules.
- Do not include implementation details from docs that are irrelevant to a Lovable frontend build.
- If the user asks in Portuguese, produce the final Lovable prompt in Portuguese unless they request English.

## Optional Variants

Offer these variants only when useful:

- `completo`: full Lovable super prompt with all screens, states, design system, data, accessibility, and performance.
- `compacto`: shorter prompt for quick iteration.
- `visual-first`: emphasizes `references/images/` and UI fidelity.
- `mvp`: focuses only on the first shippable version from the docs and roadmap.
