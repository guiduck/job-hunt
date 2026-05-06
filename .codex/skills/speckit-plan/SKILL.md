---
name: "speckit-plan"
description: "Execute the implementation planning workflow using the plan template to generate design artifacts."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/plan.md"
---

# Speckit Plan

This is the Codex mirror for `.cursor/skills/speckit-plan/SKILL.md`.

Follow the Cursor skill as the canonical workflow, with this Codex path mapping:

- Before running the workflow, load `.codex/skills/speckit-project-context/SKILL.md` and `.codex/skills/specify-prompt-engineer/SKILL.md`.
- When the Cursor skill references `.cursor/skills/<name>/SKILL.md`, use `.codex/skills/<name>/SKILL.md`.
- When updating agent context, update Codex context in `AGENTS.md` if the active plan reference changes, and keep `.cursor/rules/specify-rules.mdc` available for Cursor.
- Keep shared Spec Kit paths unchanged: `.specify/`, `.specify/scripts/bash/setup-plan.sh`, `.specify/templates/plan-template.md`, and `specs/`.

Cursor support remains available through the original `.cursor/skills/speckit-plan/SKILL.md`.
