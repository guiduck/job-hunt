# Quickstart: User Auth Ownership Deploy

## Goal

Validate that email/password auth, browser-session extension login, password reset, user-owned data, environment configuration, Gmail OAuth, resume storage, and approved email delivery work together without leaking data between users.

## Prerequisites

- Python environment for `apps/api` and `apps/worker`.
- Node environment for `apps/extension`.
- PostgreSQL available through `DATABASE_URL`.
- For local development, `DATABASE_URL` can point to Docker PostgreSQL.
- Gmail OAuth client configuration available through one of:
  - `GMAIL_OAUTH_CLIENT_CONFIG_JSON` for staging/production.
  - `GMAIL_OAUTH_CLIENT_SECRETS_FILE` for local fallback.
- Extension configured with `PLASMO_PUBLIC_API_BASE_URL`.

## Environment Rules

Use the same variable names in local, staging, and production. Values are environment-specific.

Local can use:

```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/scrapper_freelance
EMAIL_PROVIDER=gmail
GMAIL_OAUTH_CLIENT_CONFIG_JSON=
GMAIL_OAUTH_CLIENT_SECRETS_FILE=.local/gmail/client_secret.json
GMAIL_OAUTH_REDIRECT_URI=http://localhost:8000/sending/google-oauth/callback
GMAIL_OAUTH_SUCCESS_REDIRECT_URL=http://localhost:8000/health
PLASMO_PUBLIC_API_BASE_URL=http://localhost:8000
```

Published environments should use their own database URL and secret values under the same names. Do not copy `.local/` as a production storage strategy.

## Local Validation

1. Start PostgreSQL, API, and worker.

   ```bash
   docker compose up -d postgres api worker
   ```

2. Run migrations.

   ```bash
   cd apps/api
   alembic upgrade head
   ```

   Existing local rows are backfilled to the default local owner (`local@example.com` / `Local Operator`) during the auth ownership migration. New seeded defaults also belong to that owner.

3. Confirm health check.

   ```bash
   curl http://localhost:8000/health
   ```

4. Register user A.

   ```bash
   curl -X POST http://localhost:8000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user-a@example.com","password":"Password123!","display_name":"User A"}'
   ```

5. Register user B.

   ```bash
   curl -X POST http://localhost:8000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user-b@example.com","password":"Password123!","display_name":"User B"}'
   ```

6. Use each returned bearer token to verify `/auth/me`.

   ```bash
   curl http://localhost:8000/auth/me -H "Authorization: Bearer <TOKEN>"
   ```

7. Verify unauthenticated protected routes fail.

   ```bash
   curl -i http://localhost:8000/opportunities
   ```

8. Verify two-user isolation.

   - With user A token, create settings, upload a resume, create a template, capture or seed an opportunity, and create a draft.
   - With user B token, list the same resource types and confirm user A records are not visible.
   - Try direct identifier access to user A records using user B token and confirm the response does not reveal the record.

9. Verify password reset.

   ```bash
   curl -X POST http://localhost:8000/auth/password-reset/request \
     -H "Content-Type: application/json" \
     -d '{"email":"user-a@example.com"}'
   ```

   Complete the reset flow using the configured reset delivery/logging path, set a new password, then log in with the new password.

10. Verify browser-session auth in the extension.

    ```bash
    cd apps/extension
    npm run typecheck
    npm run dev
    ```

    - Open the extension.
    - Confirm protected data prompts for login.
    - Log in as user A.
    - Confirm protected API calls include the session token.
    - Restart the browser and confirm login is required again.
    - Log out and confirm protected screens/actions require login.

## Gmail OAuth Validation

1. Configure Gmail OAuth client secret.
2. Ensure `GMAIL_OAUTH_REDIRECT_URI` exactly matches the callback registered in Google Cloud.
3. Log in as user A.
4. Start OAuth.

   ```bash
   curl http://localhost:8000/sending/google-oauth/start \
     -H "Authorization: Bearer <USER_A_TOKEN>"
   ```

5. Complete the browser consent flow.
6. Check provider status.

   ```bash
   curl http://localhost:8000/sending/provider-account \
     -H "Authorization: Bearer <USER_A_TOKEN>"
   ```

7. Confirm the response shows provider status without exposing OAuth tokens or secrets.
8. Log in as user B and confirm user B does not see user A's Gmail provider connection.

## Resume And Email Send Validation

1. Upload a resume for user A.
2. Download it with user A token.
3. Attempt download with user B token and confirm the record is unavailable.
4. Create or select a user A template.
5. Select a user A opportunity with contact email.
6. Create draft preview.
7. Approve the draft for send.
8. Confirm the worker sends through user A's Gmail provider account only.
9. Confirm send request and outreach event remain visible to user A and hidden from user B.

## Published Environment Smoke Test

After API, worker, and Postgres are deployed:

1. Confirm `DATABASE_URL` points to the published database for that environment.
2. Run migrations against the published database.
3. Confirm `/health`.
4. Register a new production user through open self-signup.
5. Log in through the extension configured with the published `PLASMO_PUBLIC_API_BASE_URL`.
6. Complete Gmail OAuth with the published callback URL.
7. Upload and download a resume.
8. Create a draft preview.
9. Approve one controlled real send.
10. Confirm worker delivery and outreach history.
11. Repeat a two-user isolation spot check.

## Failure Modes To Validate

- Missing Gmail OAuth client configuration returns setup-required provider status.
- Invalid redirect URI produces a visible OAuth setup failure.
- Expired/revoked Gmail token returns expired or authorization-required status.
- Worker down leaves approved send visible as queued/blocked/failed, not delivered.
- Database unavailable fails health or protected operations clearly.
- Provider send failure records a failed send request and outreach event without losing owner attribution.
- Wrong extension API base URL shows a clear connection error.

## Expected Automated Checks

Run focused checks before moving to `/speckit-tasks` implementation completion:

```bash
cd apps/api
pytest tests/contract tests/integration tests/unit
```

```bash
cd apps/worker
pytest tests/integration tests/unit
```

```bash
cd apps/extension
npm run typecheck
```
