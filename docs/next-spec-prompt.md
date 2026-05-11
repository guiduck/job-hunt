## Command
speckit.specify

## Objective
Create a Spec Kit feature specification for Full-time operational retention and long-running workflow
hardening after the AI Field Assistant MVP: automatic cleanup/archive of old job opportunities,
durable AI bulk generation, and final status visibility for generated/sent outreach.

## Source Request
The current Full-time flow can capture many LinkedIn opportunities and now helps fill external
application forms. The next cleanup should prevent the local database and popup from accumulating old
jobs forever, while also finishing the remaining async workflow hardening for bulk AI generation and
post-send feedback. The user specifically mentioned that old job records may need automatic deletion
later, especially jobs registered in the last month or older, but this needs a safe product spec before
implementation.

## Project Context
- Relevant area: backend API, PostgreSQL schema/migrations, worker jobs, Plasmo extension Jobs/Search
  UI, docs, tests.
- Existing direction to preserve: `job` and `freelance` remain separate; LinkedIn capture remains the
  only active job discovery source; human-reviewed outreach remains mandatory; Gmail OAuth/send stays
  separate from primary app auth; model/secrets remain backend/worker-only.
- Current status: `009-full-time-fixes` and the first `010-ai-field-assistant` implementation slice are
  complete enough for local validation. The AI Field Assistant now also rescans dynamic pages without
  manual refresh, constrains its answer menu to the visible viewport, and lets the operator select
  which resumes are used as backend-only AI context. Its shell can autofill visible fields using saved
  answers first, with optional AI generation only for missing answers. It still needs broader real-site
  smoke, but the next backend product spec should focus on retention and durable long-running
  workflows.

## Requirements
- Define a safe retention policy for old Full-time job opportunities.
- Prefer archive/soft-delete or reviewable cleanup before permanent delete unless the spec justifies
  irreversible deletion.
- Scope cleanup by owner and `opportunity_type=job`; do not affect `freelance` prospects or future
  freelance campaigns.
- Preserve opportunities with meaningful user activity unless explicitly included: saved/applied,
  interview/responded, sent email history, manual notes, generated drafts, or selected favorites should
  not disappear silently.
- Allow the operator to configure retention windows such as 30, 60, 90 days or disabled.
- Provide a visible preview/count before manual cleanup and a safe scheduled cleanup path only after
  the retention rules are clear.
- Keep LinkedIn source evidence and audit trails for archived records when needed for troubleshooting.
- Finish durable AI bulk generation hardening: batches should be resumable/pollable outside a single
  HTTP request and show queued/running/completed/failed/skipped per item until terminal state.
- Improve post-send feedback so Gmail/API send results update visible batch item status, opportunity
  status, and outreach history without requiring confusing manual refresh loops.
- Preserve existing Jobs pagination, search by email/description/keywords, selection semantics, sender
  profile LinkedIn URL, Google primary auth, Gmail OAuth separation, AI Field Assistant activation,
  selected-resume context, dynamic field rescanning, viewport-safe answer menu behavior, manually saved
  field answers, and shell-level saved/AI autofill behavior.
- Do not reintroduce discarded external job-source providers or email discovery pipelines.

## Existing Artifact Considerations
- Align docs with `docs/roadmap.md`, `docs/handoff.md`, `docs/domain-model.md`,
  `docs/plasmo-extension-usage.md`, and `docs/bot-1-job-search.md`.
- Preserve owner-scoped models and existing API contract compatibility.
- Consider impacts on opportunities, job details, candidates/runs, email drafts, send requests,
  outreach events, AI generation batches/items, and extension popup persisted state.
- The retention policy should be specified separately from real-site AI Field Assistant UI polish.

## Risks / Assumptions
- Risk: deleting opportunities too aggressively could erase useful application history. Assume archive
  or soft-delete is safer than permanent delete by default.
- Risk: old runs/candidates may be needed to debug capture quality. Specify what is retained, archived,
  or pruned separately.
- Risk: durable AI generation may require worker-owned queues and idempotency rather than API request
  handlers doing all work synchronously.
- Risk: status polling can make the popup noisy or heavy if not paginated/throttled.
- Assumption: cleanup is per user and should default to disabled until the operator opts in.

## Expected Output
- A focused `spec.md` with user stories, functional requirements, edge cases, success metrics,
  non-goals, assumptions, and acceptance criteria.
- Explicitly distinguish archive, soft-delete, and permanent delete.
- Explicitly preserve human-reviewed outreach and auditability.
- Avoid implementation tasks; planning/tasks should come later through `/speckit-plan` and
  `/speckit-tasks`.
