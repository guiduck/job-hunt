---
name: "speckit-tasks"
description: "Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/tasks.md"
---

# Speckit Tasks

This is the Codex mirror for `.cursor/skills/speckit-tasks/SKILL.md`.

Follow the Cursor skill as the canonical workflow, with this Codex path mapping:

- When the Cursor skill references `.cursor/skills/<name>/SKILL.md`, use `.codex/skills/<name>/SKILL.md`.
- Keep shared Spec Kit paths unchanged: `.specify/`, `.specify/scripts/bash/check-prerequisites.sh`, `.specify/templates/tasks-template.md`, and `specs/`.
- Preserve existing feature artifacts and generate tasks from the current spec and plan context.

Cursor support remains available through the original `.cursor/skills/speckit-tasks/SKILL.md`.
