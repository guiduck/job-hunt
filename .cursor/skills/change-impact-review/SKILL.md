---
name: change-impact-review
description: Review proposed code changes for project health, backward compatibility, regression risk, and cross-module impact before implementation. Use when planning a feature, refactor, API change, schema update, auth change, or any request that might affect other areas of a FastAPI, React, or full-stack codebase.
---

# Change Impact Review

Use this skill to pressure-test a requested change before implementation.

## Goals

- Protect backward compatibility by default.
- Identify likely blast radius across backend, frontend, docs, tests, and operations.
- Catch hidden follow-up work early.
- Turn risky requests into safer execution plans.

## Review Workflow

For any requested change, run this checklist mentally and report only the relevant items.

1. Define the public contract being touched.
2. Identify consumers of that contract.
3. Check which adjacent systems may break silently.
4. Decide whether the change is additive, compatible, or breaking.
5. Recommend mitigations, migrations, and validation steps.

## Output Template

```markdown
## Change Type
[additive | compatible modification | breaking change | unclear]

## Primary Surface
- [API endpoint, component API, schema, background job, env var, etc.]

## Compatibility Risk
- [Low / Medium / High]
- [Why]

## Potentially Affected Areas
- [Backend routes, schemas, services, workers, DB, tests]
- [Frontend components, queries, forms, route guards, caches]
- [Docs, observability, CI, deployment, env vars]

## Failure Modes
- [What could break]
- [What could become inconsistent]

## Recommended Safeguards
- [Additive rollout, deprecation, feature flag, migration, fallback, docs, tests]

## Required Checks
- [Concrete validation steps]
```

## Compatibility Rules

- Treat changes to public APIs, payload fields, status codes, auth behavior, DB schema, and shared component props as compatibility-sensitive.
- Prefer additive changes over in-place breaking changes.
- If a breaking change is unavoidable, recommend a migration path and list impacted consumers.
- Distinguish internal cleanup from externally visible behavior changes.

## FastAPI Focus

Pay extra attention to:

- Route paths, methods, query params, headers, and body models
- Pydantic field names, defaults, aliases, and validation rules
- Exception handling and response envelope shape
- Authentication, authorization, middleware, dependencies
- Database migrations, default values, nullability, indexes
- Background tasks, scheduled jobs, queues, webhooks
- OpenAPI/docs drift and generated clients

## React Focus

Pay extra attention to:

- Component props and composition patterns
- Shared hooks, context, and state shape
- React Query or fetch cache keys and invalidation
- Forms, validation, optimistic updates, and toasts
- Loading, error, and empty states
- Accessibility regressions
- Routing, guards, persisted session behavior

## Project Health Checks

When relevant, verify whether the change also requires updates to:

- Automated tests
- Documentation
- Feature flags or configuration
- Environment variables and secrets references
- Logging, tracing, and alerts
- Seed data, fixtures, mocks, or scripts
- Monitoring dashboards or operational runbooks

## Decision Heuristics

- If many unrelated areas must change, recommend staging the work.
- If the request is vague, state assumptions explicitly.
- If risk is high, suggest plan-first execution before code edits.
- If impact is low, keep the review short and actionable.
