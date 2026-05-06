# Next Spec Prompt

Use this prompt with `/speckit-specify` for the next feature. It is intentionally scoped as a
stabilization spec before opening the larger `Freelance`/Google Maps product phase.

```markdown
## Command
speckit.specify

## Objective
Create a feature specification for hardening the current Full-time local MVP into a reliable, smoke-tested, deploy-ready operator workflow before starting the next major product lane.

## Source Request
Stabilize the implemented Full-time flow after the latest LinkedIn AI filter calibration: finish manual validation, close known auth/deploy/test gaps, improve post-send visibility, and document the current runtime contract so the project can safely move next to Freelance Google Maps discovery.

## Project Context
- Relevant area: mixed backend, worker, Plasmo extension, docs, tests, deployment validation.
- Current stage: Full-time local MVP is implemented end-to-end with authenticated Plasmo extension, LinkedIn broad capture, optional post-capture AI filters, job review, templates/resumes, Gmail OAuth, individual send, AI-assisted bulk send, owner-scoped data, and focused tests passing. The explicit `Exclude keywords` setting has been removed; AI filters now rely on full post text, search intent, resume/profile context when available, remote/region preferences, and job-opening-vs-job-seeker classification.
- Existing direction to preserve: `job` and `freelance` remain first-class lanes; Plasmo is the local-first operator UI for Full-time; long-running search/filter/send work stays in workers; secrets stay backend/worker-only; outreach remains human-reviewed before real send.
- Roadmap position: finish Fase 3/3.5 operational hardening before opening Fase 4 `Freelance` Google Maps/Lovable discovery.

## Requirements
- Validate the remaining manual quickstart for `specs/008-linkedin-ai-filters`, including a real broad LinkedIn capture, optional AI filters enabled, visible more-results control handling, fallback behavior, counters, reasoning/signals, and evidence retention.
- Validate that AI filters reject self-promotion/job-seeker posts while preserving plausible real hiring posts, including cases where remote status is inferred from context rather than stated as an exact keyword.
- Update or create focused tests for legacy routes that still fail because they do not send bearer tokens after auth/ownership was introduced.
- Review and align OpenAPI/API contract documentation for auth, job-search runs, candidates, email drafts, bulk send, Gmail provider account, resumes, and AI filter fields, ensuring `excluded_keywords` is not treated as a current public setting.
- Add or improve operator-visible post-send feedback so the Plasmo extension can show whether approved individual/bulk send requests are `queued`, `sending`, `sent`, `failed`, or skipped without requiring manual history inspection.
- Validate two-user ownership isolation across current operational resources: runs, candidates, opportunities, templates, resumes, provider account, drafts, send requests, bulk batches, and outreach events.
- Validate Gmail OAuth and at least one controlled approved-send flow against a non-local/public callback environment, or explicitly document why the environment is not available and what remains blocked.
- Re-check the known worker/provider regression around LinkedIn provider expectation (`blocked_source` vs `accepted`) and either fix it or reclassify the test expectation with evidence.
- Refresh docs that describe current state, deploy checklist, validation commands, and remaining risks.

## Scope Boundaries
- Do not start the `Freelance` Google Maps bot in this spec.
- Do not build a Next.js web app yet.
- Do not add teams/workspaces; keep users individual.
- Do not introduce automatic outreach without explicit human approval.
- Do not expose `OPENAI_API_KEY`, Gmail OAuth client secret, OAuth tokens, or provider credentials to the extension.

## Existing Artifact Considerations
- Preserve the implemented artifacts from:
  - `specs/006-full-time-email-sending`
  - `specs/007-user-auth-ownership-deploy`
  - `specs/008-linkedin-ai-filters`
- Keep `docs/handoff.md`, `docs/current-state-review.md`, `docs/deployment-config-and-storage.md`, `docs/roadmap.md`, and `README.md` aligned with the new validation status.
- Use additive compatibility for any schema/API changes.
- Keep `Freelance` roadmap language intact and identify it as the next major product phase after this hardening spec.

## Risks / Assumptions
- Risk: opening the Freelance bot before validating auth/deploy/send/AI-filter behavior could compound failures across two product lanes.
- Risk: post-send UI that only says requests were submitted may hide Gmail/worker failures from the operator.
- Risk: changing legacy tests without understanding ownership expectations could weaken user isolation.
- Assumption: local focused suites already pass for AI filters, worker filtering, API AI filter contracts, and extension typecheck; this spec focuses on broader operational confidence and published-environment validation.
- Assumption: if a public deploy environment is unavailable, the spec should still produce explicit acceptance criteria for what can be validated locally and what remains blocked.

## Expected Output
- A Spec Kit `spec.md` defining user stories, acceptance criteria, edge cases, functional requirements, success criteria, and assumptions for Full-time operational hardening.
- The spec should make clear when the project is ready to proceed to the next major spec: Freelance Google Maps discovery.
- Avoid implementation tasks in the spec itself; planning/tasks should come later through `/speckit-plan` and `/speckit-tasks`.
```
