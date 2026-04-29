---
name: specify-prompt-engineer
description: Transform informal product requests into structured, Spec Kit-ready prompts for speckit.constitution, speckit.clarify, speckit.specify, and speckit.plan. Use whenever the user gives a rough idea, short text, or loosely described request before generating or updating Spec Kit artifacts.
---

# Specify Prompt Engineer

Use this skill before `speckit.constitution`, `speckit.clarify`, `speckit.specify`, or
`speckit.plan` whenever the user's request is short, informal, incomplete, or mixed with context.

## Goal

Convert the user's raw request into a structured prompt that is safer for Spec Kit execution.

The rewritten prompt must:

1. preserve the real intent
2. align with current project docs and constitution
3. make assumptions explicit
4. surface compatibility and scope risks
5. prepare the next Speckit command to produce cleaner artifacts

## Required Context

Before restructuring the request, gather only the relevant context from:

- `README.md`
- `docs/`
- `docs/handoff.md`
- `.specify/memory/constitution.md`
- the active spec or plan artifact when one already exists

When relevant, also consider:

- `.cursor/skills/speckit-project-context/SKILL.md`
- existing project skills already used by this repo

## Core Workflow

### 1. Identify the target command

Decide whether the prompt is for:

- `speckit.constitution`
- `speckit.clarify`
- `speckit.specify`
- `speckit.plan`

If the user did not name the command explicitly, infer it from intent and say so.

### 2. Extract the real ask

From the user's raw text, identify:

- desired change
- affected product area
- hard constraints
- compatibility concerns
- missing but important assumptions

Do not copy the text mechanically. Normalize it into a prompt the next command can use directly.

### 3. Anchor to project reality

Always reflect current project direction:

- `freelance` and `job` are first-class lanes
- discovery, CRM review, prompts, templates, campaigns, and outreach are connected flows
- long-running work stays outside the HTTP API
- additive evolution is preferred over broad rewrites

### 4. Tailor to the command

#### For `speckit.constitution`

Focus on:

- principle or governance change requested
- why the change is needed now
- docs, templates, or skills that may need sync
- whether the change is additive, clarifying, or breaking

#### For `speckit.clarify`

Focus on:

- what is still ambiguous
- what decisions are blocking clean specification or planning
- which ambiguities materially affect scope, data model, UX, operations, or validation

#### For `speckit.specify`

Focus on:

- feature objective
- user value
- scope boundaries
- actors, entities, and flows
- acceptance criteria
- non-goals when needed

Avoid implementation details unless the project constraints make them unavoidable.

#### For `speckit.plan`

Focus on:

- implementation direction already implied by docs and spec
- architecture boundaries
- data and contract impact
- validation needs
- cross-area work that must be planned together

## Output Format

Use this format unless the user asked for a different one:

```markdown
## Command
[speckit.constitution | speckit.clarify | speckit.specify | speckit.plan]

## Objective
[What this command should accomplish]

## Source Request
[Short normalized summary of the user's original ask]

## Project Context
- Relevant area: [backend, worker, web, docs, AI, mixed]
- Existing direction to preserve: [architecture, naming, workflow, product constraints]
- Current stage: [roadmap or handoff context when relevant]

## Requirements
- [Key requirement]
- [Key requirement]

## Existing Artifact Considerations
- [What existing doc/spec/plan/constitution behavior must stay aligned]
- [What nearby files or flows may need sync]

## Risks / Assumptions
- [Main regression, drift, or scope risk]
- [Explicit assumption]

## Expected Output
- [What the next Speckit command should produce]
- [What it should avoid]
```

## Command-Specific Hints

### `speckit.constitution`

Prefer language like:

- principles to add, remove, or clarify
- governance or workflow expectations
- templates and docs that must stay synced

### `speckit.clarify`

Prefer language like:

- clarify unresolved scope
- identify blocking decisions
- reduce ambiguity that would cause rework

### `speckit.specify`

Prefer language like:

- describe user-facing value
- define scope and acceptance signals
- preserve project constraints from docs

### `speckit.plan`

Prefer language like:

- plan implementation within existing architecture
- include docs, schema, worker, UI, and validation impacts
- preserve compatibility with already documented product direction

## Quality Bar

Before handing the structured prompt to the next command, verify:

- the intent is clearer than the original request
- the prompt is aligned with current docs
- assumptions are explicit
- scope is not inflated unnecessarily
- risks or cross-area impacts are visible

## Example

Raw request:

```text
quero melhorar o specify pra entender meus textos curtos e nao sair criando spec torta
```

Structured prompt:

```markdown
## Command
speckit.specify

## Objective
Create a cleaner feature specification workflow that converts short and informal requests into structured, project-aligned spec inputs before the spec is generated.

## Source Request
Improve the specify workflow so brief user prompts are expanded into safer, clearer spec-ready instructions.

## Project Context
- Relevant area: docs, process, mixed
- Existing direction to preserve: current Speckit workflow, project docs, constitution alignment, additive process changes
- Current stage: documentation and workflow refinement before core implementation

## Requirements
- Add a prompt-structuring step before spec generation.
- Preserve compatibility with the current Spec Kit flow.
- Ensure the resulting spec still reflects project docs and constitution.

## Existing Artifact Considerations
- Existing Speckit skills and rules should remain the main entry points.
- Constitution, clarify, specify, and plan flows may all need to reference the new prompt-structuring step.

## Risks / Assumptions
- If the new step is vague, it may duplicate existing project-context behavior instead of complementing it.
- Assume the project wants a reusable skill rather than one-off prompt rewriting.

## Expected Output
- A specification or workflow update that formalizes prompt engineering before spec generation.
- Avoid broad changes unrelated to Spec Kit input quality.
```
