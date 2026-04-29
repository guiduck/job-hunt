<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] -> I. Dual Opportunity Search
  - [PRINCIPLE_2_NAME] -> II. Specialized, Evidence-Backed Discovery
  - [PRINCIPLE_3_NAME] -> III. Structured Opportunity Records
  - [PRINCIPLE_4_NAME] -> IV. Human-Reviewed Multi-Channel Outreach
  - [PRINCIPLE_5_NAME] -> V. Compatible Architecture and Operator Workflow
- Added sections:
  - Additional Constraints
  - Development Workflow
- Removed sections:
  - Placeholder-only constitution tokens
- Templates requiring updates:
  - ✅ reviewed .specify/templates/plan-template.md
  - ✅ reviewed .specify/templates/spec-template.md
  - ✅ reviewed .specify/templates/tasks-template.md
  - ✅ reviewed .cursor/skills/speckit-constitution/SKILL.md
  - ✅ updated README.md
  - ✅ updated docs/overview.md
  - ✅ updated docs/architecture.md
  - ✅ updated docs/domain-model.md
  - ✅ updated docs/action-plan.md
- Follow-up TODOs:
  - Define research-backed niche catalog and area opportunity dataset in a dedicated spec
  - Define compliance and delivery rules for automated email and WhatsApp sending before scale
-->
# Scrapper Freelance API Constitution

## Core Principles

### I. Dual Opportunity Search
The system MUST treat freelance/client acquisition and job search as first-class opportunity
types. Shared CRM capabilities MAY be reused, but product flows, filters, and future UI tabs
MUST support both lanes explicitly rather than forcing one domain into the other.

### II. Specialized, Evidence-Backed Discovery
Discovery bots MUST perform specialized searches tied to niche, market, and location instead of
generic scraping. Opportunities MUST retain the evidence that justified their capture, and any
displayed conversion-rate or niche-scoring data SHOULD remain undefined until backed by real
project data.

### III. Structured Opportunity Records
Every captured opportunity MUST be stored as structured data that can be reused by CRM,
outreach, AI prompt generation, and analytics. Schema changes MUST preserve compatibility where
possible and include additive fields for opportunity type, niche, geography, contact channels,
source evidence, and operator notes.

### IV. Human-Reviewed Multi-Channel Outreach
Email and WhatsApp outreach MUST support human review before sending until the project has
explicit compliance, rate-limit, and quality rules. Outreach content MUST be grounded in the
user's CV, offered services, saved templates, and verified opportunity context.

### V. Compatible Architecture and Operator Workflow
Long-running search, enrichment, and outreach jobs MUST stay outside the HTTP API process. The
system SHOULD evolve toward a CRM-like operator workflow with dashboards, campaigns, leads,
templates, settings, and AI prompt generation similar to the provided references, while preserving
existing project patterns and documentation.

## Additional Constraints

- Core backend stack MUST remain `FastAPI` with `PostgreSQL` and local infrastructure via
  `Docker Compose` unless an explicit architectural decision changes it.
- The project MUST support both domestic and international searches, including future geographic
  suggestions for areas with higher concentrations of chosen niches.
- The niche catalog MUST be configurable and initially support business-service niches, Christian
  churches/ministries, psychologists, therapists, and doctors/medical clinics.
- The system SHOULD allow future Google Maps integration and SHOULD keep map-related data models
  compatible with that direction.
- Only public or user-provided data SHOULD be used for prospecting, and platform-specific
  constraints for scraping and messaging MUST be reviewed before scale.

## Development Workflow

- Before updating specs, plans, or tasks, load the relevant context from `README.md`, `docs/`,
  and any user-provided research material required for the decision.
- `docs/handoff.md` MUST be updated whenever project status, active phase, next step, or the
  latest working prompt changes materially, so another human or model can resume work quickly.
- Product direction MUST account for these major capabilities: discovery, CRM review, template
  generation, AI prompt generation, and outreach via email or WhatsApp.
- Features that touch frontend or AI UI SHOULD consider the relevant `.agents` skills already
  installed in the project.
- When project scope changes materially, the affected docs MUST be updated in the same work so
  spec artifacts do not drift from runtime guidance.

## Governance

This constitution supersedes ad hoc implementation choices for project direction. Amendments MUST
be explicit, documented, and synced with affected templates or docs. Every significant spec, plan,
or implementation review SHOULD check alignment with these principles before proceeding.

**Version**: 1.0.0 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-04-22
