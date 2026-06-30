# Implementation Plan: Freelance Bulk Outreach and Channel Settings

**Branch**: `016-freelance-bulk-outreach` | **Date**: 2026-06-25 | **Spec**: `specs/016-freelance-bulk-outreach/spec.md`  
**Input**: Feature specification from `/specs/016-freelance-bulk-outreach/spec.md`

**Note**: The official `.specify/scripts/bash/setup-plan.sh --json` could not run in this Windows environment because `bash` invokes WSL and no WSL distribution is installed. The plan setup was resolved manually from `.specify/feature.json`, matching prior local Spec Kit runs documented in `docs/handoff.md`.

## Continuity Context

**Roadmap Phase**: Fase 4.5. Outreach Freelance Em Massa  
**Action Plan Step**: 9. Bulk outreach freelance after the governed Freelance lead catalog  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Plan `specs/016-freelance-bulk-outreach/spec.md` after clarification. Preserve the clarified decisions: `apps/web` owns Freelance email delivery through its own provider adapter; WhatsApp is real provider-backed delivery when configured; Email and WhatsApp use separate bulk action buttons after lead selection; contact values can come from provider payload, manual edit, or future enrichment but must be reviewable/editable before approval; channel limits are large configurable environment/provider limits with visible diagnostics.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Extend the existing `apps/web` Freelance app with controlled bulk outreach. The operator selects visible/filtered leads, chooses either the Email or WhatsApp bulk action, generates one individualized draft per selected lead, reviews and edits every contact target and message, skips blocked or unsuitable items, and explicitly approves channel-specific delivery.

The implementation stays inside `apps/web`: Prisma models, route handlers, services, UI components, provider adapters, and tests all live with the Freelance app. Existing Full-time FastAPI/Gmail behavior is a reference pattern only, not a runtime dependency. Email delivery is owned by an `apps/web` provider adapter. WhatsApp delivery is also implemented provider-backed when configured, with explicit diagnostics for missing environment variables, provider credentials, templates, opt-in, message-window constraints, rate limits, and provider delivery failures.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16 App Router, React 19.2, Node.js runtime for `apps/web` route handlers and worker/provider code  
**Primary Dependencies**: Next.js, React, shadcn/ui/Radix primitives, Zod, Zustand, Prisma 6.19, PostgreSQL, existing commercial generation builders, provider adapters for email and WhatsApp, existing Vitest test stack  
**Storage**: PostgreSQL via `apps/web/prisma/schema.prisma`; additive Prisma models/enums for bulk batches, items, channel settings, delivery events, diagnostics, and per-channel caps  
**Testing**: `npm run test:unit`, `npm run test:contract`, `npm run test:integration`, `npm run typecheck`, `npm run build` from `apps/web`; focused UI tests using existing Testing Library/Vitest setup  
**Target Platform**: Local Docker Compose/VPS `apps/web`; no dependency on the Full-time FastAPI service for Freelance email delivery; existing auth fallback/session behavior remains the owner-scope boundary  
**Project Type**: Existing internal Next.js web app feature slice with server-side provider integrations and client-side review UI  
**Performance Goals**: Selecting 50 visible leads and opening bulk outreach in under 30 seconds; batch creation returns within 2 seconds for 50 leads; generation progress becomes visible within 5 seconds; review page loads 50 batch items in under 2 seconds from stored state; approval queues eligible items without duplicate sends  
**Constraints**: No automatic delivery before explicit approval; no Full-time/job/resume/candidature wording; no `wa.me`/query-string WhatsApp delivery; no provider secrets in browser-visible UI; no niche candidates/reference files entering outreach; no small hard-coded product caps; batch state must survive refresh/reopen; schema changes must be additive  
**Scale/Scope**: Single internal operator MVP, but owner-scoped; first-contact bulk outreach only; visible/filtered lead selection in batches around 50 items; both Email and WhatsApp channel flows planned end-to-end when configured

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The work is scoped to `apps/web` Freelance and does not change the Full-time extension/API product surface.
- **II. Specialized, Evidence-Backed Discovery**: PASS. Outreach uses already saved real Freelance leads with source evidence; niche candidates/reference images remain excluded.
- **III. Structured Opportunity Records**: PASS. Batches, items, channel settings, generation context, delivery events, diagnostics, duplicate rules, and caps are structured records.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. AI generation only creates drafts; Email and WhatsApp delivery require separate explicit approval and auditable provider-backed events.
- **V. Compatible Architecture and Operator Workflow**: PASS. The CRM-like workflow stays in `apps/web`; provider integrations are server-side adapters and do not expose secrets to the browser.

No constitution violations are planned. The main compatibility risk is adding real sending to the Freelance app; the design mitigates it with separate channel actions, review/edit steps, duplicate blocking, provider diagnostics, and owner-scoped events.

## Project Structure

### Documentation (this feature)

```text
specs/016-freelance-bulk-outreach/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api.md
|   |-- web-ui.md
|   `-- provider-diagnostics.md
`-- tasks.md                  # Generated later by /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/
|-- app/
|   |-- (freelance)/
|   |   `-- leads/                         # Add checkbox selection and bulk action entry points
|   `-- api/freelance/
|       |-- bulk-outreach/
|       |   |-- route.ts                    # Create/list batches
|       |   |-- [batchId]/route.ts          # Read batch state
|       |   |-- [batchId]/generate/route.ts # Generate/retry items
|       |   |-- [batchId]/items/[itemId]/route.ts
|       |   |-- [batchId]/approve/route.ts  # Channel-specific approval
|       |   `-- [batchId]/events/route.ts
|       `-- channel-settings/route.ts
|-- components/
|   |-- leads/
|   |   |-- lead-table.tsx
|   |   |-- bulk-outreach-panel.tsx
|   |   |-- bulk-outreach-review.tsx
|   |   |-- bulk-outreach-counters.tsx
|   |   `-- bulk-outreach-item-editor.tsx
|   `-- settings/
|       |-- seller-settings-form.tsx
|       `-- channel-settings-panel.tsx
|-- lib/
|   |-- freelance/
|   |   |-- bulk-outreach-service.ts
|   |   |-- bulk-generation-service.ts
|   |   |-- outreach-delivery-service.ts
|   |   |-- channel-settings-service.ts
|   |   |-- duplicate-outreach-service.ts
|   |   `-- repositories.ts
|   |-- providers/
|   |   |-- email-provider.ts
|   |   |-- smtp-email-provider.ts          # or selected email provider adapter
|   |   |-- whatsapp-provider.ts
|   |   `-- twilio-whatsapp-provider.ts     # or selected WhatsApp Business adapter
|   |-- generation/
|   |   `-- commercial-message-builder.ts
|   `-- validation/
|       `-- freelance.ts
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
`-- tests/
    |-- unit/
    |-- integration/
    `-- contract/
```

**Structure Decision**: Implement the slice inside `apps/web` using existing route-handler/service/repository patterns. Add provider adapters under `apps/web/lib/providers` and keep Full-time FastAPI/Gmail code as a pattern reference only. Add UI in the current Leads and Settings areas rather than creating a separate outreach app.

## Phase 0: Research

See `research.md`.

Key decisions:

- `apps/web` owns both Email and WhatsApp delivery workflows through provider adapters.
- Use separate Email and WhatsApp bulk actions after lead selection; each creates a single-channel batch.
- Use provider payload, manual edit, and future enrichment as contact sources only after review validation.
- Implement large configurable per-channel limits via environment/provider capacity; do not hard-code small product caps.
- Persist explicit provider diagnostics and delivery events to support local debugging and operator visibility.

## Phase 1: Design & Contracts

See:

- `data-model.md`
- `contracts/api.md`
- `contracts/web-ui.md`
- `contracts/provider-diagnostics.md`
- `quickstart.md`

Design highlights:

- New `BulkOutreachBatch`, `BulkOutreachItem`, `OutreachChannelSetting`, and `OutreachEvent` records are owner-scoped.
- Batches are channel-specific from creation time: `email` or `whatsapp`.
- Item review fields differ by channel: Email requires recipient, subject, body; WhatsApp requires phone/WhatsApp target and message.
- Approval is channel-specific and idempotent; duplicate first-contact sends are blocked by lead/campaign/channel/stage unless a future follow-up flow explicitly overrides.
- Provider readiness returns user-safe diagnostics for missing env vars, credentials, account approval, templates, opt-in/message windows, caps, and provider failures.

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. No Full-time runtime dependency or mixed UI terminology is introduced.
- **Evidence-Backed Discovery**: PASS. Only saved real Freelance leads can enter batches; candidate niches and references remain excluded.
- **Structured Records**: PASS. Batch/item/event/channel-setting models support audit, CRM history, analytics, and retries.
- **Human-Reviewed Outreach**: PASS. Delivery is impossible before generation/review and channel-specific approval; every excluded item keeps a reason.
- **Compatible Architecture**: PASS. `apps/web` owns the Freelance workflow and provider adapters; secrets stay server-side.

## Complexity Tracking

No constitution violations are planned.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
