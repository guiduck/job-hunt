# WhatsApp Operations

## Twilio endpoints

- Incoming messages: `POST https://freelance.gfig.space/api/twilio/whatsapp/webhook`
- Delivery status: `POST https://freelance.gfig.space/api/twilio/whatsapp/status`

Both endpoints validate `X-Twilio-Signature` with `TWILIO_AUTH_TOKEN`. Keep
`TWILIO_DISABLE_WEBHOOK_VALIDATION` unset in production.

Set the exact public base URL in the VPS environment so signature validation does not depend on the
internal URL seen behind Caddy:

```bash
TWILIO_WEBHOOK_BASE_URL=https://freelance.gfig.space
REDIS_URL=redis://redis:6379
```

The webhook validator also considers forwarded proxy headers, but `TWILIO_WEBHOOK_BASE_URL` is the
authoritative production value. A rejected request logs safe diagnostics without exposing the auth
token or request signature.

For an individual WhatsApp Sender, configure both URLs under Messaging Endpoint Configuration.
The incoming URL creates inbound messages and conversations. The status URL reconciles outbound
states such as `sent`, `delivered`, `read`, `failed`, and `undelivered`.

## VPS deploy and inbox backfill

```bash
cd /srv/projects/job-hunt/job-hunt
git pull
docker compose --env-file .env.local up -d --build --force-recreate redis web web-worker whatsapp-realtime
docker compose --env-file .env.local exec -T web npm run prisma:migrate
docker compose --env-file .env.local exec -T web npm run whatsapp:normalize-lead-phones
docker compose --env-file .env.local exec -T web npm run whatsapp:backfill-inbox
docker compose --env-file .env.local ps
```

The backfill is idempotent. It finds Twilio-backed WhatsApp bulk items, queries their current
Twilio Message status, and creates any missing inbox conversations/messages without duplicating
records that already exist.

## Verification

1. Refresh `/inbox`; outbound first-contact messages must appear before a lead replies.
2. Open a conversation; each outbound bubble shows its current provider status.
3. Reply from a recipient; the inbound webhook persists the reply and publishes a Redis event. The
   inbox should update immediately through WebSocket. A 30-second poll remains as a fallback.
4. The unread badge remains until that conversation is opened. Opening it marks inbound messages as
   read locally and clears the badge; this is an inbox read state, not a WhatsApp read receipt.
5. Click the bell icon once to grant browser notification permission. New unread replies in a
   conversation that is not currently visible trigger a browser notification.
6. Check web and realtime logs when needed:

```bash
docker compose --env-file .env.local logs --tail 200 web
docker compose --env-file .env.local logs --tail 200 whatsapp-realtime
```

Expected inbound success log in `web`:

```text
Recorded inbound Twilio WhatsApp message
```

If Twilio shows a webhook attempt with HTTP `403`, compare the logged `candidates` with exactly
`https://freelance.gfig.space/api/twilio/whatsapp/webhook`. If no request appears in `web` logs,
check the sender URL, DNS, TLS, and Caddy before debugging Redis or the inbox.

## Brazilian mobile normalization

Brazilian mobile numbers stored with eight local digits are normalized before persistence, review,
inbox matching, and the final Twilio API request. For example, `+556182724656` becomes
`+5561982724656`. The sender configured in `TWILIO_WHATSAPP_FROM` is not rewritten. PostgreSQL check constraints
reject non-E.164 contacts and enforce the Brazilian fixed/mobile shape after the migration repairs
existing records.

`whatsapp:normalize-lead-phones` repairs existing lead phone/WhatsApp fields idempotently. It does
not rewrite historical Twilio messages or prove that a past `delivered` message reached the intended
human; inspect that message SID in Twilio before deciding whether to contact the lead again.

## Regenerating localized drafts

The approved template uses variable `{{7}}` for the complete delivery timeline. Draft generation
converts simple values such as `15 days`/`15 dias` to the selected template language. Drafts already
generated before a localization fix must be regenerated; provider delivery uses the variables saved
in each draft snapshot.


## Already-contacted semantics and GFig test reset

Draft generation does not count as contact. Duplicate first-contact protection considers only a
`sent` event persisted after the provider accepts the request, and it compares the exact normalized
recipient. Interrupted `queued_send` attempts and failed sends remain retryable.

To inspect the local GFig test history without changing data:

```bash
docker compose --env-file .env.local exec -T web npm run whatsapp:reset-gfig-test-lead
```

To delete only that lead's local outreach items/events and inbox conversation, then return it to
`new` for another test:

```bash
docker compose --env-file .env.local exec -T web npm run whatsapp:reset-gfig-test-lead -- --confirm
```

The command requires exactly one lead named `GFig Software Factory Sandbox`; otherwise it aborts.
It does not delete Twilio message logs and does not affect any other lead.


## Resetting every contacted WhatsApp lead

Use this only when intentionally restarting first-contact testing for every lead. Preview first:

```bash
docker compose --env-file .env.local exec -T web npm run whatsapp:reset-all-contacted-leads
```

The preview lists every affected lead and the number of blocking sent events. Confirm globally with:

```bash
docker compose --env-file .env.local exec -T web npm run whatsapp:reset-all-contacted-leads -- --confirm-all
```

This removes only WhatsApp first-contact `sent` events used by duplicate protection and releases
items linked as `duplicate_blocked`. Leads, inbox conversations/messages, and Twilio logs are
preserved. Afterward, close any open review modal and create a fresh selection.
