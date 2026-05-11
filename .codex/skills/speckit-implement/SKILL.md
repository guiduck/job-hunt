---
name: "speckit-implement"
description: "Execute the implementation plan by processing and executing all tasks defined in tasks.md"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/implement.md"
---

# Speckit Implement

This is the Codex mirror for `.cursor/skills/speckit-implement/SKILL.md`.

Follow the Cursor skill as the canonical workflow, with this Codex path mapping:

- When the Cursor skill references `.cursor/skills/<name>/SKILL.md`, use `.codex/skills/<name>/SKILL.md`.
- Keep shared Spec Kit paths unchanged: `.specify/`, `.specify/scripts/bash/check-prerequisites.sh`, feature `tasks.md`, `plan.md`, `contracts/`, `quickstart.md`, and `specs/`.
- Mark completed tasks in the feature `tasks.md` only when implementation work actually completes.
- Before reporting an implementation complete, update all affected documentation plus `docs/handoff.md`
  and `docs/roadmap.md`, and prepare the next Spec Kit `/speckit-specify` prompt in
  `docs/next-spec-prompt.md`.

Cursor support remains available through the original `.cursor/skills/speckit-implement/SKILL.md`.
