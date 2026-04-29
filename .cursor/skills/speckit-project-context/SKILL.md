---
name: speckit-project-context
description: Prepare Spec Kit commands with project-specific context, prompt refinement, compatibility checks, and documentation alignment. Use when the user invokes or discusses speckit commands such as speckit.specify, speckit.constitution, speckit.clarify, speckit.plan, speckit.tasks, or when rough product ideas must be turned into structured spec-ready inputs.
---

# Speckit Project Context

Use this skill before shaping or updating Spec Kit artifacts for this project.

For `speckit.constitution`, `speckit.clarify`, `speckit.specify`, and `speckit.plan`, load
`.cursor/skills/specify-prompt-engineer/SKILL.md` first so rough user text is normalized into a
structured command-ready prompt before continuing with project-context alignment.

## Required Context

Read only the relevant project docs before proceeding:

- `README.md`
- `docs/overview.md`
- `docs/architecture.md`
- `docs/domain-model.md`
- `docs/action-plan.md`
- `docs/bot-1-scraper.md`
- `docs/search-improvements.md`

Also consider project skills from `.agents/skills/` when relevant.

## Core Job

Turn informal product requests into Spec Kit-ready direction that stays aligned with the real project.

Always:

1. Extract the true product goal.
2. Align it with the existing docs.
3. Surface compatibility or architecture risks.
4. Keep scraper, CRM, outreach, and AI future-state in mind.
5. Call out doc conflicts before generating or updating spec artifacts.

## Project Defaults

- Backend-first project using `FastAPI` and `PostgreSQL`
- Local infra via `Docker Compose`
- `Render` for backend production
- Optional future `Next.js` web for CRM and AI flows
- Initial value comes from scraper + lead storage + manual review
- Outreach should be human-gated before full automation

## `.agents` Integration

When the request touches frontend, web, or `Next.js`, also load:

- `.agents/skills/vercel-react-best-practices/SKILL.md`
- `.agents/skills/vercel-composition-patterns/SKILL.md`

When the request touches AI UI, chat UI, prompt workbench, or AI product flows, also load:

- `.agents/skills/ai-elements/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

Do not load these `.agents` skills unnecessarily for backend-only scraper work.

## Spec Kit Guidance

### For `speckit.constitution`

- Keep principles concise and enforceable.
- Reflect current decisions from `docs/`.
- Update the constitution when project direction changed materially.

### For `speckit.specify`

- Convert loose ideas into concrete user stories, requirements, edge cases, and success criteria.
- Prefer additive, realistic scopes over speculative breadth.
- Preserve future compatibility with CRM, outreach, and AI prompt generation.
- If the user provides a brief prompt, expand it into the real implementation intent before writing the spec.

### For `speckit.plan` and `speckit.tasks`

- Keep the architecture split between `api`, `worker`, and optional `web`.
- Do not mix long-running scraping work into the HTTP API process.
- Ensure tasks cover docs, schema, and operational implications when relevant.
- If planning a future web, use the `.agents` React and AI skills as design constraints where applicable.

## Conflict Handling

If the request conflicts with `docs/` or the constitution:

- do not silently choose one
- describe the conflict
- propose the smallest coherent resolution

## Output Style

- concise
- implementation-oriented
- explicit about assumptions
- explicit about backward compatibility and project health
