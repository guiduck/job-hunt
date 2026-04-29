---
name: prompt-structuring
description: Transform informal user requests into structured implementation prompts with scope, constraints, acceptance criteria, risk checks, and stack-aware guidance. Use when the user gives a vague request, rough idea, messy prompt, or asks to improve a prompt for coding work in FastAPI, React, or mixed codebases.
---

# Prompt Structuring

Turn loose human requests into clear implementation prompts that are safe for an engineering workflow.

## When to Use

- The request is informal, incomplete, or ambiguous.
- The user wants a better prompt before implementation.
- The task may affect API contracts, frontend behavior, or shared architecture.
- The work spans FastAPI, React, or backend/frontend boundaries.

## Core Behavior

Do not simply paraphrase the request. Rewrite it into an execution-ready prompt that reduces ambiguity and regression risk.

Default to this flow:

1. Extract the user's real goal.
2. Infer likely scope and missing constraints.
3. Surface backward-compatibility and cross-area impact.
4. Add acceptance criteria and verification expectations.
5. Keep the final prompt concise and practical.

## Output Template

Use this structure unless the user asks for another format:

```markdown
## Objective
[What should change and why]

## Context
- Stack: [FastAPI / React / both / other]
- Relevant area: [API, UI, auth, data model, docs, tests, infra]
- Constraints: [performance, compatibility, timeline, style, etc.]

## Requirements
- [Functional requirement]
- [Functional requirement]

## Backward Compatibility
- [Existing contracts that must not break]
- [Fallback or migration expectations]

## Impact Review
- [Other files, modules, clients, or flows that may need updates]
- [Monitoring, docs, tests, schema, env vars, permissions, jobs, caches]

## Acceptance Criteria
- [Observable outcome]
- [Observable outcome]

## Validation
- [Tests, manual checks, lints, or rollout checks]

## Open Questions
- [Only if truly unresolved]
```

## Stack-Specific Checks

### FastAPI

When the request touches backend behavior, consider:

- Request and response models
- Validation and error shapes
- Route compatibility and status codes
- Auth, permissions, and dependency injection
- DB schema, migrations, and seed data
- Background tasks, queues, webhooks, schedulers
- API docs, examples, and client expectations

### React

When the request touches frontend behavior, consider:

- Component API and prop compatibility
- State shape and derived UI behavior
- Loading, error, and empty states
- Accessibility and keyboard flow
- Data fetching, caching, and invalidation
- Form validation and user feedback
- Shared design patterns and reusable components

## Guardrails

- Prefer explicit constraints over broad freedom.
- Preserve existing public contracts unless the user explicitly accepts breaking changes.
- If the request implies a risky refactor, call it out.
- Mention adjacent areas only when they are plausibly affected.
- Ask clarifying questions only for blockers; otherwise provide assumptions.

## Style

- Write in direct engineering language.
- Favor bullets over long prose.
- Optimize for implementation, not marketing.
- Keep the rewritten prompt short enough to use immediately.
