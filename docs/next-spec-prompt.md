## Command
speckit.analyze

## Feature
Freelance Bulk Outreach and Channel Settings

## Objective
Run a non-destructive consistency review for `specs/016-freelance-bulk-outreach` after implementation.

## Current Context
- `/speckit-implement` completed T001-T077 for `specs/016-freelance-bulk-outreach/tasks.md`.
- `apps/web` now owns Freelance bulk Email and WhatsApp delivery.
- Email uses the Resend adapter when `FREELANCE_EMAIL_PROVIDER=resend`, `FREELANCE_EMAIL_FROM`, and
  `RESEND_API_KEY` are configured.
- WhatsApp uses the Twilio adapter when `FREELANCE_WHATSAPP_PROVIDER=twilio`,
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` are configured.
- AI generation remains human-gated: drafts are generated/reviewed/edited/skipped before approval.
- Channel readiness surfaces missing env var names, daily limits, remaining capacity and provider
  diagnostics without exposing secret values.
- Official Bash Spec Kit scripts remain blocked on this Windows environment because WSL has no
  installed distribution; paths were resolved manually from `.specify/feature.json`.

## Review Focus
1. Check consistency between `spec.md`, `plan.md`, `data-model.md`, `contracts/`, `quickstart.md`,
   `tasks.md`, and implemented `apps/web` behavior.
2. Verify whether follow-up specs are needed for production-grade WhatsApp template/opt-in management,
   provider webhooks/status reconciliation, richer daily-limit accounting, or email enrichment.
3. Confirm docs and operational notes describe the env vars and debug behavior accurately.

## Guardrails To Preserve
- Do not propose moving Freelance delivery back into the Full-time FastAPI/Gmail service.
- Do not introduce automatic sending before explicit approval.
- Do not expose provider secrets in client components, API responses, diagnostics, logs, or docs.
- Do not use `wa.me` or query-string shortcuts as final WhatsApp delivery.
