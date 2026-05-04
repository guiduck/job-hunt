# Implementation Plan: User Auth Ownership Deploy

**Branch**: `007-user-auth-ownership-deploy` | **Date**: 2026-05-03 | **Spec**: `specs/007-user-auth-ownership-deploy/spec.md`
**Input**: Feature specification from `specs/007-user-auth-ownership-deploy/spec.md`

## Continuity Context

**Roadmap Phase**: Fase 3. Revisao e envio para vagas  
**Action Plan Step**: 5.5. Login de usuario, ownership e prontidao para deploy  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Run `/speckit-plan` for `specs/007-user-auth-ownership-deploy/spec.md` after clarification resolved open signup, browser-session auth, no email verification, and user-facing password reset.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Add individual email/password accounts, browser-session authentication for the Plasmo extension, user-facing password reset, and strict `user_id` ownership across the existing Full-time capture, review, resume, template, Gmail provider, draft, send, bulk, and outreach-history workflows. The implementation will extend the current FastAPI/PostgreSQL/Alembic foundation with additive ownership migrations and protected-route dependencies, keep long-running send work in the worker, update extension request state to authenticate every protected call, and produce deploy-ready configuration and validation docs for local, staging, and production.

## Technical Context

**Language/Version**: Python >=3.11 for API/worker; TypeScript with React 19/Plasmo for extension  
**Primary Dependencies**: FastAPI, SQLAlchemy 2, Alembic, Pydantic Settings, psycopg, google-api-python-client/google-auth-oauthlib, pytest/httpx; Plasmo, React, Zustand, TypeScript  
**Storage**: PostgreSQL via `DATABASE_URL`; OAuth tokens in `sending_provider_accounts.token_json`; resume PDFs in `resume_attachments.file_content`; `.local/` only for local Playwright profile/logs/optional dev secret files  
**Testing**: `pytest` for API and worker; extension `npm run typecheck`; focused deployed smoke test for health, auth, OAuth, resume, draft, approved send, and worker delivery  
**Target Platform**: Local Docker Compose; Render API, worker, and Postgres for published environments; Chrome/Plasmo extension configured by `PLASMO_PUBLIC_API_BASE_URL`  
**Project Type**: Full-stack operational workflow with FastAPI web service, separate worker, PostgreSQL persistence, and browser extension UI  
**Performance Goals**: Signup and login under 2 minutes, password reset under 5 minutes, protected resource isolation passing 100% of two-user tests, clean published smoke test in under 45 minutes after secrets are available  
**Constraints**: Additive migration-backed schema evolution; no teams/workspaces; open self-signup in all environments; no email verification in MVP; browser-session login expires on browser restart; same env var names across environments with environment-specific values; no global product limits by env var  
**Scale/Scope**: MVP multi-user ownership for existing Full-time workflows; future subscriptions are user-scoped placeholders only; no new sending providers, Google Maps freelance bot, SSO, social login, magic links, teams, or web dashboard in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Dual opportunity search**: PASS. The plan preserves existing `job`/`freelance` compatibility and only scopes current Full-time operational data by user; it does not collapse lanes or introduce a parallel model.
- **Specialized, evidence-backed discovery**: PASS. Search and evidence behavior remain unchanged; ownership is added to runs, candidates, opportunities, and evidence-bearing records so captured data stays attributable to one user.
- **Structured opportunity records**: PASS. Schema changes are additive and migration-backed with `user_id` ownership columns and a `users` model; existing structured opportunity fields remain intact.
- **Human-reviewed multi-channel outreach**: PASS. Draft, approval, send request, bulk batch, provider account, and outreach event ownership preserve human-gated email sending and prevent cross-user Gmail/provider mixing.
- **Compatible architecture and operator workflow**: PASS. API remains command/query surface, worker remains responsible for long-running send work, extension remains the first operational UI, and docs/handoff are updated with the active plan.
- **Additional constraints**: PASS. FastAPI/PostgreSQL/Docker Compose/Render direction remains intact; no heavy scraping or email sending is moved into HTTP handlers; `.local/` is not used as production storage.

## Project Structure

### Documentation (this feature)

```text
specs/007-user-auth-ownership-deploy/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── alembic/versions/          # ownership/auth migrations
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/      # current_user/session dependencies
│   │   │   └── routes/            # auth + protected existing routes
│   │   ├── core/                  # env/session/password config
│   │   ├── models/                # User, AuthSession/PasswordReset, user_id ownership
│   │   ├── schemas/               # auth, user, ownership-aware response schemas
│   │   └── services/              # auth, password reset, owner-scoped services
│   └── tests/
│       ├── contract/              # auth + protected route contracts
│       ├── integration/           # migration/backfill, isolation, OAuth/resume/send
│       └── unit/                  # hashing, session, reset, ownership helpers
├── worker/
│   ├── app/                       # preserve user_id when processing sends/runs
│   └── tests/                     # worker ownership/provider isolation
└── extension/
    ├── src/api/                   # auth-aware client and types
    ├── src/store/                 # browser-session auth state
    └── src/components/popup/      # signup/login/logout/reset UI

docs/
├── auth-and-ownership.md
├── deployment-config-and-storage.md
└── handoff.md
```

**Structure Decision**: Use the existing `apps/api`, `apps/worker`, and `apps/extension` split. Add auth/ownership inside the current API and extension contracts, and update worker behavior only where it must preserve `user_id` for long-running sends/runs.

## Phase 0 Research Summary

Research is captured in `specs/007-user-auth-ownership-deploy/research.md`.

Key decisions:

- Use signed bearer session tokens with server-side session records so extension login can be browser-session scoped and logout can revoke the active session.
- Add `users`, `auth_sessions`, and `password_reset_requests`, then add non-null `user_id` ownership columns through additive/backfill migrations.
- Use strong password hashing via a maintained password hashing library and never store plaintext passwords.
- Keep password reset user-facing but email-provider independent in architecture: API creates time-limited reset requests; delivery/URL handling is documented and testable without mixing it with Gmail send authorization.
- Use same environment variable names across local/staging/production, with values changing per environment; local values can point to Docker PostgreSQL.

## Phase 1 Design Summary

Design artifacts:

- `specs/007-user-auth-ownership-deploy/data-model.md`
- `specs/007-user-auth-ownership-deploy/contracts/openapi.yaml`
- `specs/007-user-auth-ownership-deploy/quickstart.md`

Implementation should proceed in this order:

1. Add auth/session/password-reset models, schemas, services, and migrations.
2. Backfill existing global operational rows to a default local user.
3. Add `current_user` dependency and owner-scoped query/write enforcement across protected routes and services.
4. Preserve `user_id` through worker-run/send processing and provider-account selection.
5. Update the extension client/store/UI for signup, login, logout, browser-session auth, and password reset.
6. Update environment docs, deploy config docs, and validation quickstart.

## Post-Design Constitution Check

- **Dual opportunity search**: PASS. Data-model design adds owner boundaries without changing lane semantics.
- **Specialized, evidence-backed discovery**: PASS. Run/candidate/opportunity ownership preserves evidence and does not change provider rules.
- **Structured opportunity records**: PASS. Ownership is explicit, relational, and additive; no structured fields are removed.
- **Human-reviewed multi-channel outreach**: PASS. Gmail provider tokens, drafts, send requests, bulk batches, and outreach events become user-owned and remain worker-delivered after human approval.
- **Compatible architecture and operator workflow**: PASS. Existing API/worker/extension split remains, and the extension becomes authenticated without introducing a web dashboard.
- **Additional constraints**: PASS. No constitution violations found.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations require complexity justification.
