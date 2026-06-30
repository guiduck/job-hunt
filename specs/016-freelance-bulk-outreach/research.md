# Research: Freelance Bulk Outreach and Channel Settings

## Decision: Keep Freelance Delivery Inside `apps/web`

**Decision**: Implement Freelance Email and WhatsApp delivery workflows inside `apps/web` with dedicated provider adapters, data models, route handlers, diagnostics, and tests.

**Rationale**: The clarified requirement is that the Freelance app should not depend on the Full-time FastAPI/Gmail service running. Keeping delivery inside `apps/web` preserves the product boundary, matches the existing Freelance Prisma-owned app, and lets channel readiness/debugging be visible in one UI.

**Alternatives considered**:

- Reuse Full-time FastAPI Gmail OAuth directly: rejected because it creates a runtime dependency on another service and blurs product surfaces.
- Shared adapter package now: deferred because the immediate need is a working Freelance flow; extraction can happen after the provider boundary proves stable.

## Decision: Channel-Specific Bulk Actions

**Decision**: After lead checkbox selection, show separate Email and WhatsApp bulk action buttons. The selected action creates a channel-specific batch before generation starts.

**Rationale**: Email and WhatsApp have different contact fields, content shapes, provider readiness checks, and failure modes. A single mixed batch would make debugging harder and risks sending the wrong channel during approval.

**Alternatives considered**:

- One mixed approval button: rejected because it can hide channel-specific failures and makes user intent less explicit.
- Separate pages per channel: rejected for MVP because the existing Leads table can host both actions cleanly.

## Decision: Contact Sources Must Be Reviewable

**Decision**: Provider payload, manual operator edits, and future enrichment may all supply email or WhatsApp contact values, but the final value must be visible, validated, and editable before approval.

**Rationale**: This matches the existing Full-time extension pattern while supporting real-world lead data quality. It lets the operator correct emails/numbers and messages after AI generation, before side effects happen.

**Alternatives considered**:

- Provider payload only: too restrictive for leads with manually found contact data.
- Manual confirmation required for every item: safer but too slow for the intended bulk review flow; the review UI already exposes all targets.

## Decision: WhatsApp Is End-to-End When Configured

**Decision**: Model and implement WhatsApp as a real provider-backed channel in this slice. If configuration or provider prerequisites are missing, block sending with a specific diagnostic rather than falling back to `wa.me` links.

**Rationale**: The operator wants real sending and debuggable setup. Provider-backed delivery is also required by the product guardrails; browser query-string links do not provide auditable provider events, failure states, or reliable compliance handling.

**Alternatives considered**:

- Design-only WhatsApp: rejected by clarification.
- Provider-ready but no send: rejected by clarification.
- `wa.me` link shortcut: rejected by spec and roadmap as not a final implementation.

## Decision: Configurable High Channel Limits

**Decision**: Use large per-channel environment/provider limits, surfaced through channel readiness and remaining-capacity diagnostics. Do not hard-code small product caps like 20 or 50.

**Rationale**: The operator wants configurable capacity for local/internal operation. Environment/provider limits are flexible while still providing guardrails and debug signals.

**Alternatives considered**:

- No app-level cap: rejected because missing or exceeded capacity should be visible before approval.
- Fixed low caps: rejected as arbitrary and too limiting.

## Decision: Durable Batch State and Events

**Decision**: Persist batches, items, channel settings, generation context snapshots, and delivery events in PostgreSQL.

**Rationale**: The operator can close/reopen the app, inspect failures, retry generation, and audit delivery history per lead. This also supports tests for duplicate prevention and owner scope.

**Alternatives considered**:

- Client-only state: rejected because refresh/reopen would lose review state and auditability.
- Reuse `latest_generated_texts` only: insufficient for multi-lead batches, skip state, contact edits, provider diagnostics, and delivery events.

## Decision: Provider Diagnostics Are First-Class

**Decision**: Store and expose user-safe diagnostic codes and messages for provider readiness and delivery attempts.

**Rationale**: The user explicitly needs to debug missing `.env` variables, credentials, provider setup, templates, opt-in, caps, and send failures from the app. Provider diagnostics prevent silent blocked states and reduce guesswork.

**Alternatives considered**:

- Raw provider payloads in UI: rejected because secrets and noisy provider internals may leak.
- Generic "send failed" messages: rejected because they do not help local setup/debugging.
