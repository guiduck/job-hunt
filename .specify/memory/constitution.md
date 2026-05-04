<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
  - IV. Human-Reviewed Multi-Channel Outreach (clarified approved send and bulk send rules)
  - V. Compatible Architecture and Operator Workflow (added browser extension as first-class operator UI)
- Added constraints:
  - Email sending must be provider-backed, evented, rate-limited, and auditable.
  - The Chrome/Plasmo extension is now an accepted local-first interface for authenticated browser workflows.
  - Freelance Google Maps discovery remains a first-class future lane and must follow niche/location evidence rules.
- Templates requiring updates:
  - ✅ reviewed .specify/templates/plan-template.md
  - ✅ reviewed .specify/templates/spec-template.md
  - ✅ reviewed .specify/templates/tasks-template.md
  - ✅ reviewed .cursor/skills/speckit-constitution/SKILL.md
  - ✅ updated docs/overview.md
  - ✅ updated docs/architecture.md
  - ✅ updated docs/domain-model.md
  - ✅ updated docs/action-plan.md
  - ✅ updated docs/roadmap.md
  - ✅ updated docs/product-modes.md
  - ✅ updated docs/bot-1-job-search.md
  - ✅ updated docs/bot-1-scraper.md
  - ✅ updated docs/handoff.md
  - ✅ updated docs/next-spec-prompt.md
- Follow-up TODOs:
  - Specify provider details for email sending (Gmail OAuth/API first, SMTP fallback if needed).
  - Specify Google Maps freelance discovery after Full-time email sending is usable.
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
explicit compliance, rate-limit, and quality rules. The system MAY send an email after the
operator explicitly approves an individual or bulk action, but sending MUST be provider-backed,
evented, auditable, rate-limited, and reversible at the workflow level. Outreach content MUST be
grounded in the user's CV, offered services, saved templates, and verified opportunity context.

### V. Compatible Architecture and Operator Workflow
Long-running search, enrichment, and outreach jobs MUST stay outside the HTTP API process. The
system SHOULD evolve toward a CRM-like operator workflow with dashboards, campaigns, leads,
templates, settings, and AI prompt generation similar to the provided references. A Chrome/Plasmo
extension is now an accepted local-first operator interface for authenticated browser workflows,
while a future web dashboard MAY reuse the same API contracts. Existing project patterns and
documentation MUST remain aligned.

## Additional Constraints

- Core backend stack MUST remain `FastAPI` with `PostgreSQL` and local infrastructure via
  `Docker Compose` unless an explicit architectural decision changes it.
- The project MUST support both domestic and international searches, including future geographic
  suggestions for areas with higher concentrations of chosen niches.
- The niche catalog MUST be configurable and initially support business-service niches, Christian
  churches/ministries, psychologists, therapists, and doctors/medical clinics.
- The system SHOULD allow future Google Maps integration and SHOULD keep map-related data models
  compatible with that direction.
- The future `Freelance` lane SHOULD support Google Maps based niche/location discovery, including
  business website detection, weak-site signals, public contacts, review metadata, and prompt/demo
  context for Lovable.
- Only public or user-provided data SHOULD be used for prospecting, and platform-specific
  constraints for scraping and messaging MUST be reviewed before scale.
- Email sending MUST not happen directly inside request handlers. HTTP APIs MAY create drafts,
  approvals, and send jobs; workers or provider adapters MUST perform the actual send.

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

**Version**: 1.1.0 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-05-02
