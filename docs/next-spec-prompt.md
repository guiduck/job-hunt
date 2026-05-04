# Next Spec Prompt

Use this prompt with `/speckit-specify` for the next feature.

```markdown
## Command
speckit.specify

## Objective
Specify the next incremental feature: user login with email/password, user-owned data, deployment readiness, environment configuration, OAuth secrets, storage boundaries, and production validation for the existing `Full-time` capture/review/email workflow.

## Context
- Relevant area: FastAPI API, worker, PostgreSQL, user auth/session boundaries, Plasmo extension login/config, Gmail OAuth, migrations, docs, deployment.
- Existing patterns to preserve: API receives commands and exposes status; worker performs long-running jobs; PostgreSQL is the source of truth for operational data; Plasmo uses `PLASMO_PUBLIC_API_BASE_URL`; schema changes should be additive and migration-backed.
- Current state: `Full-time` capture, review, templates, resume upload, drafts, Gmail/OAuth send, bulk foundation and send history are implemented locally. OAuth tokens are stored in `sending_provider_accounts.token_json`; uploaded PDF content is stored in `resume_attachments.file_content`; `.local/` is only for local Playwright profiles, logs and optional dev secret files.
- Current ownership gap: settings, resumes, templates, provider accounts, opportunities, runs and send history are effectively global/single-operator today. Before deploy, define user accounts so each logged-in user only sees and mutates their own data.
- Product decision: no teams/workspaces in this cycle. Use individual users with email/password. Future subscriptions and limits belong to the user.
- Product direction: stabilize deployability and ownership before adding the next large product lane. After this, the roadmap can continue with response/interview tracking and then the `Freelance` Google Maps/Lovable bot.

## Requirements
- Define a deploy-ready configuration model for local, staging and production environments.
- Add a minimal `users` model with unique email, password hash, display name, subscription status/plan placeholders, created/updated timestamps.
- Add register/login/logout or equivalent session endpoints using email and password.
- Use secure password hashing; never store plaintext passwords.
- Add an authenticated `current_user` dependency for protected API routes.
- Add Plasmo extension login state so the extension sends authenticated requests after login.
- Ensure user-owned resources are scoped in API queries and writes: user settings, resumes, email templates, Gmail provider account, job-search runs, opportunities, email drafts, send requests, bulk batches and outreach events.
- Do not silently create a new user per browser install. Use explicit signup/login. Local development may backfill old data to one default local user only through migration/seed.
- Ensure all environment-specific values are documented and read from env vars/secrets, not hardcoded local paths.
- Support Gmail OAuth client configuration through `GMAIL_OAUTH_CLIENT_CONFIG_JSON` as the preferred production secret, while keeping `GMAIL_OAUTH_CLIENT_SECRETS_FILE` as a local fallback.
- Keep OAuth access/refresh tokens in PostgreSQL, never in the extension and never committed to the repo.
- Keep uploaded resume metadata and current PDF bytes in PostgreSQL for now, and document the future R2/S3/GCS adapter path without changing the extension contract.
- Define Render deployment steps for API, worker and Postgres, including migrations, health checks, worker startup, public API URL and Gmail redirect URI.
- Define how the Plasmo extension should point to local/staging/production APIs through `PLASMO_PUBLIC_API_BASE_URL`.
- Remove or clearly mark any stale docs implying `.local/` is production storage or that OAuth tokens must be file-based.
- Preserve the no-global-limits decision: future send/search limits must be product rules by user subscription plan, not env vars.
- Add validation steps for a deployed environment: health check, migration status, OAuth start/callback, provider status, resume upload/download, draft creation, approved send and worker delivery.
- Add failure-mode guidance for missing OAuth client config, invalid redirect URI, expired token, worker down, DB unavailable and provider send failure.

## Existing Code Considerations
- Preserve existing routes for opportunities, job search runs, email templates, user settings, resumes, drafts, send requests, bulk send and provider status.
- Preserve existing DB-backed token/resume decisions unless a migration is explicitly required.
- Add `user_id` ownership columns and backfill/migration strategy carefully so existing local data can be assigned to a default local user.
- Do not introduce SendGrid/Resend/Postmark in this spec; keep Gmail API/OAuth as v1 and only document provider abstraction compatibility.
- Do not implement the Google Maps freelance bot in this spec.
- Do not add teams, workspaces, organizations, SSO, magic link or social login in this spec. Keep auth/ownership small, explicit and compatible with future individual subscriptions.

## Cross-Area Impact
- `.env.example`, `.env.local`, `docker-compose.yml`, API/worker config, OAuth service, provider status service.
- DB models/migrations for `users`, password hashes, auth/session support and `user_id` ownership columns.
- Every route/service that currently reads or writes global settings, resumes, templates, opportunities, runs or email records.
- `docs/deployment-config-and-storage.md`, `docs/architecture.md`, `docs/action-plan.md`, `docs/roadmap.md`, `docs/handoff.md`, and the quickstart for spec `006`.
- Render service settings and Google Cloud OAuth redirect URI setup.
- Extension build/release configuration for API base URL.

## Risks
- OAuth redirect URI mismatch can block all Gmail connection attempts after deploy.
- File-path based secrets can create local-only behavior if docs are unclear.
- Storing PDFs in Postgres is acceptable for MVP but may become costly at scale; the spec should document the migration path without prematurely adding bucket complexity.
- Worker/API config drift can cause sends to queue but never deliver.
- A deployed API without basic access control may expose operator actions if publicly reachable.
- Global tables without owner scoping would mix resumes, templates, Gmail tokens and captured vacancies between users after deploy.
- Auto-creating a new user per extension install can fragment data if the same operator uses multiple browsers or machines.
- Introducing auth without route-level scoping can create a false sense of security while data still leaks across users.

## Acceptance Criteria
- A developer can deploy API, worker and Postgres to Render using only documented env vars/secrets.
- Users can sign up and log in with email/password.
- Each user has isolated settings, resumes, templates, Gmail provider account, opportunities and email history.
- Existing local data can be migrated/backfilled to a default local owner without data loss.
- The extension has a clear login/logout state and sends authenticated requests before accessing protected API data.
- Gmail OAuth can be connected in deployed environment without relying on `.local/`.
- Provider status correctly reports configured, authorization required, authorized, failed or expired states without exposing secrets/tokens.
- Resume upload/download and email send still work locally and are documented for deployed validation.
- Docs clearly state what lives in the database, what lives in environment secrets, and what `.local/` is allowed to contain.
- No docs recommend global email/search limits by env var.

## Validation
- Run focused API tests for provider status, OAuth start, resume upload/download, email drafts and send approval.
- Run focused worker tests for Gmail provider and email delivery.
- Run extension typecheck.
- Run a manual deployed smoke test: health check, OAuth connect, provider status, resume upload, draft preview and one controlled real send.
```
