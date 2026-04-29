---
name: project-prompt-engineer
description: Convert informal product or coding requests into structured prompts that preserve existing code patterns, protect backward compatibility, and account for project context. Use when the user writes casually, gives a rough idea, or wants a safer implementation prompt before changing code.
---

# Project Prompt Engineer

Turn informal requests into implementation-ready prompts that respect the existing project.

## When to Use

- The user describes work casually or incompletely.
- The request may touch existing code, APIs, schemas, UI flows, or architecture.
- The user wants a better prompt before running Spec Kit or starting implementation.
- The user wants to avoid breaking patterns, contracts, or surrounding code.

## Required Context

Before rewriting the prompt, gather only the relevant context from:

- `README.md`
- `docs/`
- existing files or symbols affected by the request
- current architecture and conventions already present in the repo

## Main Goal

Do not just rewrite the request more formally.

Produce a prompt that:

1. captures the real intent
2. preserves existing code style and architectural direction
3. checks backward compatibility
4. identifies nearby files and flows that may also need changes
5. reduces regression risk

## Non-Negotiable Checks

Always consider:

- existing naming and folder conventions
- current abstractions and patterns already used
- public contract compatibility
- schema and migration impact
- docs and config drift
- tests or manual validation needed

## Project Health Rules

- Prefer extending existing patterns over introducing a new pattern without reason.
- If the codebase already has an established way to solve the problem, preserve it.
- If the request implies a breaking change, say so explicitly.
- If adjacent modules may be affected, mention them explicitly.
- If the request is vague, make assumptions explicit instead of hiding them.

## Output Format

Use this format unless the user requests another one:

```markdown
## Objective
[The real change to make]

## Context
- Relevant area: [backend, frontend, worker, docs, infra, mixed]
- Existing patterns to preserve: [naming, file layout, abstractions, API shape, UI conventions]
- Constraints: [compatibility, performance, scope, timeline]

## Requirements
- [Functional requirement]
- [Functional requirement]

## Existing Code Considerations
- [Pattern or convention that should be preserved]
- [Existing behavior that must remain compatible]

## Cross-Area Impact
- [Other modules, files, jobs, schemas, docs, or flows that may require updates]

## Risks
- [Regression or compatibility risk]
- [Assumption that should be validated]

## Acceptance Criteria
- [Observable result]
- [Observable result]

## Validation
- [Tests, lints, manual checks, migration checks, rollout checks]
```

## FastAPI Checks

When backend work is involved, pay attention to:

- request and response models
- status codes and error format
- dependency injection and auth
- DB schema and migrations
- background jobs and worker effects
- API docs and client expectations

## React or Next.js Checks

When frontend work is involved, pay attention to:

- component API compatibility
- state and data fetching patterns
- loading, error, and empty states
- accessibility and UX consistency
- existing design or composition patterns

## Spec Kit Use

When the rewritten prompt will be used with `speckit.specify`, `speckit.plan`, or `speckit.tasks`:

- keep the prompt implementation-oriented
- include project constraints from `docs/`
- avoid speculative scope expansion
- prefer additive work over broad rewrites

## Example

Informal request:

```text
quero começar o crm e ter como marcar lead quente ou frio sem bagunçar o que ja fizemos
```

Structured prompt:

```markdown
## Objective
Introduce an initial CRM status flow for leads so they can be classified as cold, warm, or hot without breaking the current lead capture direction.

## Context
- Relevant area: backend, future web, docs
- Existing patterns to preserve: current lead-centered data model, scraper-first architecture, additive evolution toward CRM
- Constraints: preserve existing lead records and avoid premature frontend complexity

## Requirements
- Add lead temperature support in a way that fits the existing lead model.
- Keep the change compatible with the current scraper-first workflow.

## Existing Code Considerations
- Preserve the lead table as the central source of truth.
- Avoid introducing a separate CRM subsystem if the same goal can be achieved with additive lead fields.

## Cross-Area Impact
- Lead schema, docs, future filtering endpoints, future web screens, and outreach flow may also need updates.

## Risks
- Adding status fields without clear meaning may create drift later.
- CRM naming may conflict with future outreach states if not defined clearly now.

## Acceptance Criteria
- Leads can store a temperature value consistently.
- The new fields fit future CRM and outreach usage without breaking current assumptions.

## Validation
- Verify schema compatibility and docs alignment.
- Check any affected serializers, endpoints, and future status usage notes.
```
