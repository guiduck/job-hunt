# Quickstart: Freelance Web App

This quickstart validates the planned `014-freelance-web-app` MVP after implementation.

## 1. Environment

Expected local services:

- PostgreSQL from `docker-compose.yml`
- Existing `apps/api` and `apps/worker` may still run for Full-time, but they are not required for the first isolated Freelance web smoke unless shared auth is wired during implementation.
- New `apps/web` service
- New `apps/web` worker process

Expected environment variables:

```bash
DATABASE_URL=postgresql://scrapper:scrapper@postgres:5432/scrapper_freelance
FREELANCE_MAPS_PROVIDER=mock
APIFY_TOKEN=
SERPAPI_API_KEY=
OPENAI_API_KEY=
AI_FREELANCE_MODEL=gpt-4o-mini
```

Use mock provider mode for deterministic local validation before provider credentials exist.

## 2. Install and Migrate

```bash
cd apps/web
npm install
npx prisma migrate dev
npx prisma db seed
npm run typecheck
npm run build
```

Expected:

- Prisma creates the Freelance tables.
- Seed inserts the initial niche catalog from `NICHE_OPTIONS`.
- Typecheck/build succeed.

## 3. Start Local App

```bash
cd apps/web
npm run dev
```

In another terminal:

```bash
cd apps/web
npm run worker
```

Expected:

- Web app opens locally.
- Worker polls for pending prospecting jobs.

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
- `GET /api/freelance/niches` returned 29 seeded niches.
- `POST /api/freelance/campaigns` returned 201 for one BR campaign (`Barbearia - Indaial`) and one
  international campaign (`Plumber - Alamo`).
- `/campaigns` returned 200 and displayed both campaigns.
- Note: `prisma migrate deploy` cannot be used directly against the existing non-empty FastAPI local
  schema until a Prisma baseline strategy is defined; local validation used targeted SQL execution to
  avoid touching existing Full-time tables.

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

## 10. Regression Guard

Confirm:

- `apps/extension` still builds/typechecks independently.
- Full-time docs/flows are not modified by this feature except context references.
- No CSV export/import UI appears in the Freelance MVP.
