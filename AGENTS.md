# Agent Instructions

This repository supports both Cursor and Codex-style agents. Keep the existing Cursor workflow intact:
`.cursor/rules/specify-rules.mdc` and `.cursor/skills/**` remain the Cursor source of truth.

For Codex, use this file as the top-level project brief and load mirrored workflow instructions from
`.codex/skills/**` when a task matches one of those skills.

## Project Context

Treat `README.md` and the files in `docs/` as the current product context. The project is a personal
opportunity platform with two first-class lanes:

- `job`: full-time job opportunities, currently the initial priority
- `freelance`: freelance prospecting opportunities, planned after the job flow

Current stack and direction:

- Backend API in `FastAPI`
- Persistence in `PostgreSQL`
- Local infra through `Docker Compose`
- Long-running scraping, enrichment, and outreach work outside the HTTP API process
- API and worker deployment target on `Render`
- Plasmo extension as the current local-first operational UI for the full-time job flow
- Future `Next.js` web app when the manual review workflow justifies it

## Spec Kit Workflow

The shared Spec Kit runtime lives in `.specify/`; generated feature artifacts live in `specs/`.
Use those folders for both Cursor and Codex.

When the user invokes or discusses Spec Kit commands such as `speckit.specify`,
`speckit.constitution`, `speckit.clarify`, `speckit.plan`, `speckit.tasks`, or implementation from
`tasks.md`, first load the relevant Codex mirror under `.codex/skills/`.

Before `speckit.constitution`, `speckit.clarify`, `speckit.specify`, or `speckit.plan`, load and
follow:

- `.codex/skills/speckit-project-context/SKILL.md`
- `.codex/skills/specify-prompt-engineer/SKILL.md`

For general prompt refinement or change-risk review, consider:

- `.codex/skills/project-prompt-engineer/SKILL.md`
- `.codex/skills/prompt-structuring/SKILL.md`
- `.codex/skills/change-impact-review/SKILL.md`

The active plan reference mirrored from Cursor is:

- `specs/008-linkedin-ai-filters/plan.md`

## Conflict Handling

If `README.md`, `docs/`, `.specify/memory/constitution.md`, and generated artifacts in `specs/`
disagree, surface the conflict before proceeding. Resolve the smallest coherent interpretation with
the user instead of silently choosing one source.

## Additional Skills

For frontend, web, or `Next.js` work, also consider:

- `.agents/skills/vercel-react-best-practices/SKILL.md`
- `.agents/skills/vercel-composition-patterns/SKILL.md`

For AI UI, chat UI, prompt workbench, or AI product flows, also consider:

- `.agents/skills/ai-elements/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

Do not load optional skills unnecessarily for backend-only scraper or worker work.

## Engineering Guardrails

- Preserve existing public API contracts unless the user explicitly accepts a breaking change.
- Prefer additive changes and established project patterns over new abstractions.
- Keep scraper, CRM review, outreach, and future AI flows aligned with the documented roadmap.
- Do not store secrets in source files; keep OAuth and environment secrets in environment-specific
  configuration.
- Update docs, tests, migrations, contracts, and operational notes when the change affects them.
