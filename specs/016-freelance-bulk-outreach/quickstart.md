# Quickstart: Freelance Bulk Outreach and Channel Settings

## Prerequisites

- Local PostgreSQL for `apps/web` is available.
- `apps/web` dependencies are installed.
- `apps/web/.env.local` or environment variables include `DATABASE_URL`.
- Existing Freelance seed/bootstrap has run and at least one campaign has real saved leads.

## Environment Variables

Base:

```bash
DATABASE_URL=postgresql://scrapper:scrapper@localhost:5433/freelance_app
OPENAI_API_KEY=
AI_FREELANCE_MODEL=gpt-4o-mini
```

Email delivery is owned by `apps/web` and currently supports the Resend adapter behind the normalized provider interface. The app shows missing variable names in channel readiness without exposing values:

```bash
FREELANCE_EMAIL_PROVIDER=resend
FREELANCE_EMAIL_DAILY_LIMIT=500
RESEND_API_KEY=
FREELANCE_EMAIL_FROM=
```

WhatsApp delivery is owned by `apps/web` and currently supports the Twilio WhatsApp adapter behind the normalized provider interface. The app shows missing variable names in channel readiness without exposing values:

```bash
FREELANCE_WHATSAPP_PROVIDER=twilio
FREELANCE_WHATSAPP_DAILY_LIMIT=500
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

Do not expose provider secrets through `NEXT_PUBLIC_*`.

## Bootstrap

From `apps/web`:

```bash
npm install
npm run db:bootstrap
npm run typecheck
npm run test
```

## Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000/leads
```

## Smoke Flow: Email

1. Open the Leads page.
2. Apply a campaign/status/website filter with at least two leads.
3. Select visible leads with row checkboxes.
4. Click `Generate Email`.
5. Confirm the batch shows:
   - selected count
   - eligible count
   - missing contact count
   - duplicate count
6. Generate drafts.
7. Edit at least one recipient email, subject, and body.
8. Skip one item.
9. Approve Email delivery.
10. Confirm:
    - no skipped/invalid/duplicate item sends
    - sent/failed states are visible per item
    - lead outreach history shows events

## Smoke Flow: WhatsApp

1. Open the Leads page.
2. Select leads with phone/WhatsApp values.
3. Click `Generate WhatsApp`.
4. If provider config is missing, confirm readiness shows exact missing env var names.
5. Configure provider variables when real delivery is desired.
6. Generate WhatsApp drafts.
7. Edit one phone number and message.
8. Approve WhatsApp delivery.
9. Confirm:
   - no `wa.me` shortcut is used as final delivery
   - provider message id or diagnostic is recorded
   - opt-in/template/rate-limit failures show specific messages

## Validation Commands

Focused:

```bash
npm run test:unit -- tests/unit/bulk-outreach-eligibility.test.ts tests/unit/bulk-outreach-duplicates.test.ts tests/unit/channel-readiness.test.ts
npm run test:contract -- tests/contract/bulk-outreach-contract.test.ts tests/contract/channel-settings-contract.test.ts
npm run test:integration -- tests/integration/bulk-outreach-selection-ui.test.tsx tests/integration/bulk-outreach-review-flow.test.tsx tests/integration/bulk-outreach-delivery-flow.test.tsx tests/integration/bulk-outreach-whatsapp-flow.test.tsx
```

Full:

```bash
npm run typecheck
npm run test
npm run build
```

## Expected Debug Behavior

- Missing Email env vars show names such as `RESEND_API_KEY`, not secret values.
- Missing WhatsApp env vars show names such as `TWILIO_ACCOUNT_SID`, not secret values.
- Provider errors are normalized to stable diagnostic codes.
- Daily/channel limits show configured limit and remaining capacity.
- Duplicate sends show the previous event or blocked reason.
