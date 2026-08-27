# WhatsApp Operations

## Twilio endpoints

- Incoming messages: `POST https://freelance.gfig.space/api/twilio/whatsapp/webhook`
- Delivery status: `POST https://freelance.gfig.space/api/twilio/whatsapp/status`

Both endpoints validate `X-Twilio-Signature` with `TWILIO_AUTH_TOKEN`. Keep
`TWILIO_DISABLE_WEBHOOK_VALIDATION` unset in production.

For an individual WhatsApp Sender, configure both URLs under Messaging Endpoint Configuration.
The incoming URL creates inbound messages and conversations. The status URL reconciles outbound
states such as `sent`, `delivered`, `read`, `failed`, and `undelivered`.

## VPS deploy and inbox backfill

```bash
cd /srv/projects/job-hunt/job-hunt
git pull
docker compose --env-file .env.local up -d --force-recreate web web-worker
docker compose --env-file .env.local exec -T web npm run whatsapp:backfill-inbox
docker compose --env-file .env.local ps
```

The backfill is idempotent. It finds Twilio-backed WhatsApp bulk items, queries their current
Twilio Message status, and creates any missing inbox conversations/messages without duplicating
records that already exist.

## Verification

1. Refresh `/inbox`; outbound first-contact messages must appear before a lead replies.
2. Open a conversation; each outbound bubble shows its current provider status.
3. Reply from a recipient; the inbound webhook should add the reply and unread count within the
   existing five-second inbox polling interval.
4. Check web logs when needed:

```bash
docker compose --env-file .env.local logs --tail 200 web
```
