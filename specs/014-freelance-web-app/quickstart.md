# Quickstart: Freelance Web App

This quickstart validates the planned `014-freelance-web-app` MVP after implementation.

## 1. Environment

Expected local services:

- `freelance-postgres` from `docker-compose.yml`
- `apps/web` service
- `apps/web` worker process for real SerpApi/Apify prospecting jobs
- `postgres` + `apps/api` when validating shared Google sign-in with the same account used by the
  extension

Expected environment variables:

```bash
DATABASE_URL=postgresql://scrapper:scrapper@freelance-postgres:5432/freelance_app
FREELANCE_AUTH_API_BASE_URL=http://api:8000
FREELANCE_WEB_APP_BASE_URL=http://localhost:3000
FREELANCE_MAPS_PROVIDER=mock
APIFY_TOKEN=
SERPAPI_API_KEY=
OPENAI_API_KEY=
AI_FREELANCE_MODEL=gpt-4o-mini
```

Use mock provider mode for deterministic local validation before provider credentials exist.
For Docker OAuth, keep the Google client file available at `.local/gmail/client_secret.json`; Compose
maps it inside API containers as `/app/.local/gmail/client_secret.json`.

## 2. Install and Migrate

```bash
cd apps/web
npm install
npm run db:bootstrap
npm run typecheck
npm run test
npm run build
```

Expected:

- Bootstrap creates the Freelance tables without touching existing Full-time tables.
- Bootstrap inserts the initial niche catalog from `NICHE_OPTIONS` and default templates.
- Typecheck/tests/build succeed.

## 3. Start Local App

```bash
docker compose --env-file .env.local up -d freelance-postgres web web-worker
```

For shared Google sign-in with the extension account, also run:

```bash
docker compose --env-file .env.local up -d postgres api
```

Expected:

- Web app opens at `http://localhost:3000`.
- Worker polls for pending prospecting jobs.
- `Connect Google` redirects through the FastAPI `/auth/google/start` flow and returns to
  `/auth/google/callback`.

## 4. Campaign Smoke

1. Open the Freelance app.
2. Go to `Campanhas`.
3. Create one BR campaign, for example:
   - Market: BR
   - Country: Brasil
   - State: SC
   - City: Indaial
   - Niche: Imobiliaria
4. Create one international campaign, for example:
   - Market: International
   - Country: United States
   - State: Texas
   - City: Alamo
   - Niche: Dentist

Expected:

- Both campaigns save from the same flow.
- Niche choices come from the seeded catalog.
- No job/curriculum/application language appears.

Validation status:

- 2026-06-06: Passed locally after applying the Freelance migration SQL with `prisma db execute`,
  running `npx.cmd prisma db seed`, and starting `apps/web` at `http://127.0.0.1:3000`.
- `GET /api/freelance/niches` returned 30 seeded niches.
- `POST /api/freelance/campaigns` returned 201 for one BR campaign (`Barbearia - Indaial`) and one
  international campaign (`Plumber - Alamo`).
- `/campaigns` returned 200 and displayed both campaigns.
- Note: `prisma migrate deploy` cannot be used directly against the existing non-empty FastAPI local
  schema until a Prisma baseline strategy is defined; local validation used targeted SQL execution to
  avoid touching existing Full-time tables.
- 2026-06-08: Revalidated after switching local setup to `npm run db:bootstrap`, adding Tailwind, and
  using the database configured for `apps/web`. `GET /api/freelance/niches` returned 30 niches,
  `/campaigns` rendered with app styles, and the previous `public.freelance_campaigns does not exist`
  error was resolved.

## 5. Prospecting Job Smoke

1. Start prospecting for one campaign.
2. Confirm the campaign card moves to a collecting/running state.
3. Watch progress steps:
   - discovering businesses
   - normalizing results
   - deduplicating
   - fetching websites
   - analyzing websites
   - scoring leads
   - saving leads
4. Wait for terminal status.

Expected:

- Job creation returns immediately.
- Worker updates counters and terminal status.
- At least one mock lead is saved with source query/evidence.
- Duplicate candidates are skipped with a reason.

Validation status:

- 2026-06-08: Passed with mock provider through `POST
  /api/freelance/campaigns/{campaignId}/prospecting-jobs`; response returned `completed` with 3
  accepted leads, and `GET /api/freelance/leads` returned saved leads.

## 6. Website Analysis Smoke

Open a saved lead with `websiteUrl`.

Expected analysis evidence:

- final URL/status
- HTTPS signal
- title/meta/headings when available
- CTA/contact signals when available
- social/Linktree/broken detection when relevant
- website status
- content/design/performance/SEO score breakdown
- at least three human-readable evidence points

Deep browser/mobile audit is not required for MVP.

Validation status:

- 2026-06-08: Passed through mock website analysis snapshots persisted with website status, evidence
  points, and content/design/performance/SEO scores.

## 7. Lead Review Smoke

1. Open `Leads`.
2. Filter by campaign, niche, website status, commercial status, and minimum score.
3. Open a lead detail.
4. Update:
   - commercial status
   - temperature
   - notes
   - demo URL

Expected:

- Filters preserve context.
- Detail page shows source evidence and website analysis.
- No resume, job stage, interview, or job application template appears.

Validation status:

- 2026-06-08: Passed by HTTP smoke for `/leads` and `/leads/{leadId}` plus contract/unit/integration
  coverage for filters, detail updates, dashboard metrics, and copy guard.

## 8. Prompt and Message Smoke

1. Open a Freelance lead detail.
2. Generate a Lovable prompt.
3. Switch between complete/generic/compact variants if implemented.
4. Copy the prompt.
5. Generate a first-contact message from a template.
6. Edit/review/copy the message.
7. Refresh or reopen the lead.

Expected:

- Prompt/message are generated on demand.
- Only the latest generated prompt/message text is saved.
- Templates and lead data persist.
- No automatic email or WhatsApp send occurs.

Validation status:

- 2026-06-08: Passed by HTTP smoke for both generation routes; latest generated prompt/message is
  replaced per slot and generation remains copy/review only.

## 9. Settings and Templates Smoke

1. Open `Configuracoes`.
2. Save seller name, WhatsApp, offer, price, installments, preferred niches, and default market.
3. Open `Templates`.
4. Preview/edit a first-contact and follow-up template.
5. Generate a message again.

Expected:

- Message output uses saved seller settings and template variables.
- Empty WhatsApp is omitted when not configured.
- Templates are commercial-only.

Validation status:

- 2026-06-08: Passed by HTTP smoke for `/templates`, `/settings`, generation using seeded templates,
  and tests for template variables/settings context.

## 10. Regression Guard

Confirm:

- `apps/extension` still builds/typechecks independently.
- Full-time docs/flows are not modified by this feature except context references.
- No CSV export/import UI appears in the Freelance MVP.

Validation status:

- 2026-06-08: `apps/web` passed `npm run typecheck`, `npm run test` (31 files, 43 tests), `npm run
  build`, and `npm run db:bootstrap`; `apps/extension` passed `npm run typecheck`.
