# Quickstart: Full-time Email Sending

This quickstart validates the planned `Full-time` templates, resume settings, preview, approval, worker delivery, and send history workflow.

## Prerequisites

- API, worker, and PostgreSQL dependencies installed for `apps/api` and `apps/worker`.
- Plasmo extension dependencies installed in `apps/extension`.
- Local environment variables configured in `.env.local`, `.env`, shell, or the deploy provider's Environment/Secrets settings.
- A Gmail OAuth client configured for the operator account used in local testing.
- For Gmail setup: create a Google Cloud project, enable Gmail API, configure OAuth consent, create
  an OAuth client, then provide the downloaded client JSON either as `GMAIL_OAUTH_CLIENT_CONFIG_JSON`
  or as a local secret file at `GMAIL_OAUTH_CLIENT_SECRETS_FILE`.

## Environment

Expected variables for implementation. Local values live in `.env.local`; staging/production should
set the same names in the target environment:

```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/scrapper_freelance
PLASMO_PUBLIC_API_BASE_URL=http://localhost:8000
EMAIL_PROVIDER=gmail
GMAIL_OAUTH_CLIENT_CONFIG_JSON=
GMAIL_OAUTH_CLIENT_SECRETS_FILE=.local/gmail/client_secret.json
RESUME_STORAGE_BACKEND=local_fs
RESUME_STORAGE_DIR=.local/resumes
EMAIL_SEND_POLL_INTERVAL_SECONDS=5
```

`.local/` is only a development convenience for local logs, browser profiles, and optional secret
files. The OAuth token created after Google consent is stored in PostgreSQL at
`sending_provider_accounts.token_json`, and uploaded resume PDFs are stored in PostgreSQL at
`resume_attachments.file_content`. In deployed environments, prefer `GMAIL_OAUTH_CLIENT_CONFIG_JSON`
as a service secret or use a mounted secret file for `GMAIL_OAUTH_CLIENT_SECRETS_FILE`.

## 1. Apply Database Migrations

```bash
cd apps/api
alembic upgrade head
```

Expected result:

- Tables for settings, resumes, templates, drafts, send requests, provider accounts, bulk batches, and outreach events exist.
- Existing opportunities and job review data remain readable.

## 2. Start Local Services

```bash
docker compose up -d
```

Expected result:

- API becomes healthy.
- Worker is running and can poll pending job-search runs and pending email send requests.
- PostgreSQL is shared by API and worker.

## 3. Configure Operator Settings

```bash
curl -X PATCH http://localhost:8000/user-settings \
  -H "Content-Type: application/json" \
  -d '{"operator_name":"Guilherme","operator_email":"operator@example.com"}'
```

Expected result:

- Response includes `operator_name` and `operator_email`.

## 4. Upload a Resume

Upload a PDF. The file bytes are stored in PostgreSQL, not in `.local/resumes`:

```bash
curl -X POST http://localhost:8000/user-settings/resumes/upload \
  -F "display_name=Guilherme CV" \
  -F "is_default=true" \
  -F "file=@/path/to/guilherme-cv.pdf;type=application/pdf"
```

Expected result:

- Resume is listed by `GET /user-settings/resumes`.
- New email drafts select the default resume by default.

## 5. Create a Full-time Template

```bash
curl -X POST http://localhost:8000/email-templates \
  -H "Content-Type: application/json" \
  -d '{
    "mode":"full_time",
    "template_kind":"job_application",
    "name":"Default application",
    "subject_template":"Application for {{job_title}} at {{company_name}}",
    "body_template":"Hi {{author_name}}, I saw the {{job_title}} opportunity at {{company_name}}. My CV is attached. Source: {{source_url}}",
    "is_active":true
  }'
```

Expected result:

- Template appears in `GET /email-templates?mode=full_time&active_only=true`.
- No freelance template kinds appear in this response.

## 6. Create and Edit an Email Draft

Use an existing `opportunity_id` from `GET /opportunities?opportunity_type=job&contact_available=true`.

```bash
curl -X POST http://localhost:8000/email-drafts \
  -H "Content-Type: application/json" \
  -d '{"opportunity_id":"<opportunity_id>","template_id":"<template_id>"}'
```

Expected result:

- Draft contains recipient, subject, body, selected resume, rendered variables, and warnings.
- If the selected resume is removed and the template kind is `job_application`, draft/confirmation warnings mention no CV attached.

Optional edit:

```bash
curl -X PATCH http://localhost:8000/email-drafts/<draft_id> \
  -H "Content-Type: application/json" \
  -d '{"subject":"Edited subject","body":"Edited body"}'
```

## 7. Check Gmail Provider Status

```bash
curl http://localhost:8000/sending/provider-account
```

Expected result:

- `auth_status` is `authorized` before real send approval succeeds.
- Response never includes tokens, secrets, or local credential contents.

## 8. Approve an Individual Send

```bash
curl -X POST http://localhost:8000/email-drafts/<draft_id>/approve-send
```

Expected result:

- API returns the approved send request after queueing it for worker delivery.
- Worker sends via Gmail/OAuth.
- A successful `job_application` send changes the opportunity `job_stage` to `applied`.
- A failed send records an error and does not mark the job as applied.
- A second `job_application` send for the same opportunity is blocked.

## 9. Preview and Approve Bulk Send

```bash
curl -X POST http://localhost:8000/bulk-email/preview \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_ids":["<opportunity_id_1>","<opportunity_id_2>"],
    "template_id":"<template_id>"
  }'
```

Expected result:

- Summary includes sendable, skipped missing contact, skipped duplicate, and blocked invalid contact counts.
- There is no global hardcoded bulk count cap; future limits should come from plan/subscription rules.

Approve:

```bash
curl -X POST http://localhost:8000/bulk-email/<batch_id>/approve
```

Expected result:

- Sendable recipients become individual queued send requests.
- Each skipped or sent recipient has a tracked outreach event.
- Partial failures preserve correct status per recipient.

## 10. Inspect Send History

```bash
curl http://localhost:8000/opportunities/<opportunity_id>/email-history
```

Expected result:

- History includes template, resume, recipient, status, provider message ID when available, timestamp, and error when present.

## 11. Extension Validation

```bash
cd apps/extension
npm run typecheck
```

Manual extension checks:

- `Templates` tab creates, edits, previews, activates, and deactivates `Full-time` templates.
- `Settings` tab shows operator settings and resume records.
- Job detail can prepare, edit, warn, confirm, and show email history.
- Job list bulk action shows skip/block/sendable summary before approval.

## 12. Automated Tests

```bash
cd apps/api
pytest

cd ../worker
pytest
```

Expected coverage:

- API contract tests for templates, settings, resumes, drafts, send approval, duplicate application blocking, bulk preview, and history.
- Worker tests for Gmail provider success/failure mapping, missing attachment handling, job-stage update on success only, and per-recipient event recording.

Implementation validation observed on 2026-05-03:

- `cd apps/api && pytest`: 62 passed.
- `cd apps/worker && pytest`: 44 passed, 1 existing LinkedIn provider collection test failed outside the email path (`blocked_source` vs `accepted`).
- `cd apps/extension && npm run typecheck`: passed.
