# Feature Specification: User Auth Ownership Deploy

**Feature Branch**: `007-user-auth-ownership-deploy`  
**Created**: 2026-05-03  
**Status**: Draft  
**Input**: User description: "Specify the next incremental feature: user login with email/password, user-owned data, deployment readiness, environment configuration, OAuth secrets, storage boundaries, and production validation for the existing Full-time capture/review/email workflow."

## Continuity Context

**Roadmap Phase**: Fase 3. Revisao e envio para vagas  
**Action Plan Step**: 5.5. Login de usuario, ownership e prontidao para deploy  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: Use `docs/next-spec-prompt.md` with `/speckit-specify` to create the spec for deployment readiness, email/password login, user ownership, environment configuration, OAuth secrets, storage boundaries, and published-environment validation.

> Before finalizing this spec, confirm `docs/handoff.md` reflects the current phase, current work,
> and latest prompt so another human or model can resume without re-discovery.

## Clarifications

### Session 2026-05-03

- Q: Who should be allowed to create accounts in a published production environment for this MVP? → A: Open self-signup in all environments; keep the same environment variable names across environments, with each environment using its own values such as its own database URL. For local development, those values can point to Docker PostgreSQL.
- Q: How long should a normal logged-in browser extension session remain valid before requiring login again? → A: Until browser restart.
- Q: Should new accounts verify their signup email before accessing protected Full-time workflow features? → A: Do not require email verification in this MVP.
- Q: Should this feature include a user-facing password reset flow? → A: Include user-facing password reset in this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign Up And Access Own Data (Priority: P1)

As an operator preparing to use the Full-time workflow outside local development, I can create an account, log in with email and password, and access only my own settings, resumes, templates, provider connection, opportunities, and email history.

**Why this priority**: Public or shared access is unsafe until each operator has an explicit account and isolated data.

**Independent Test**: Can be fully tested by registering two users, logging in as each user, creating or viewing operational data, and confirming each user only sees their own records.

**Acceptance Scenarios**:

1. **Given** a new operator without an account in any environment, **When** they register with a valid email, password, and display name, **Then** they can log in and access the Full-time workflow as that user.
2. **Given** two registered users, **When** user A creates settings, uploads a resume, creates a template, connects a provider, captures opportunities, or sends email, **Then** user B cannot list, view, update, send, or delete those resources.
3. **Given** an unauthenticated request to protected operational data, **When** the request is submitted, **Then** access is denied with a clear login-required outcome and no protected data is returned.
4. **Given** a logged-in user, **When** they log out, their session is no longer valid, or the browser restarts, **Then** protected actions require login again.
5. **Given** a registered user who cannot log in, **When** they complete the password reset flow for their account email, **Then** they can set a new password and log in without losing their owned data.

---

### User Story 2 - Preserve Existing Local Data Under A Default Owner (Priority: P2)

As the current local operator, I can upgrade the existing local database without losing already captured opportunities, templates, resumes, provider connections, drafts, send requests, bulk batches, or outreach events.

**Why this priority**: The product already has useful local data and workflows; the ownership change must not discard or orphan that work.

**Independent Test**: Can be tested by preparing a database with pre-existing global data, applying the ownership upgrade, and confirming every migrated record belongs to a default local owner and remains usable.

**Acceptance Scenarios**:

1. **Given** existing local operational records without an owner, **When** the ownership upgrade runs, **Then** all records are assigned to one explicit default local user.
2. **Given** migrated local data, **When** the default local user logs in, **Then** their previous settings, resumes, templates, provider connection, opportunities, drafts, send requests, bulk batches, and outreach events remain visible and usable.
3. **Given** a published environment, **When** a browser install or extension install starts for the first time, **Then** the system does not silently create a new user and instead requires explicit signup or login.

---

### User Story 3 - Configure Published Environments Safely (Priority: P3)

As the person deploying the product, I can configure local, staging, and production environments from documented secrets and environment-specific settings, without relying on local-only files for production behavior.

**Why this priority**: The Full-time workflow can only be validated outside localhost if configuration, secrets, redirects, health checks, and storage boundaries are explicit.

**Independent Test**: Can be tested by following the deployment checklist in a clean environment and completing login, provider connection, resume upload/download, draft creation, approved send, and worker delivery validation.

**Acceptance Scenarios**:

1. **Given** a clean published environment with documented secrets configured, **When** the deployer runs the validation checklist, **Then** health checks, database readiness, login, provider connection, resume upload/download, draft preview, approved send, and worker delivery can all be verified.
2. **Given** provider client configuration is missing or invalid, **When** a user starts provider connection, **Then** the system reports that setup is required without exposing secrets or tokens.
3. **Given** the provider redirect configuration does not match the published URL, **When** the user attempts to connect the provider, **Then** the failure is visible and actionable.
4. **Given** the worker is unavailable or the database cannot be reached, **When** the user approves a send or checks delivery status, **Then** the system exposes an understandable blocked or failed state without marking the message as delivered.

---

### User Story 4 - Maintain Extension Login State (Priority: P4)

As an operator using the browser extension, I can sign in, stay signed in for normal use, send authenticated requests, and sign out without storing provider secrets, provider tokens, or resume file bytes in the extension.

**Why this priority**: The extension is the current operational interface for the Full-time workflow and must respect the new account boundary.

**Independent Test**: Can be tested by using the extension against local and published environments, verifying that protected screens require login and that authenticated actions are attributed to the logged-in user.

**Acceptance Scenarios**:

1. **Given** the extension is opened without a valid login state, **When** the operator tries to access protected workflow data, **Then** the extension prompts for signup or login before showing data.
2. **Given** the operator is logged in through the extension, **When** they capture opportunities, review details, create drafts, upload a resume, or approve a send, **Then** those actions are attributed to that user.
3. **Given** the operator signs out, **When** the extension is reopened, **Then** protected data and actions are unavailable until login.

### Edge Cases

- A duplicate email is used during signup.
- A user signs up with an unverified email address; protected access still depends on valid login and user-owned data boundaries.
- A password is too weak or fails minimum policy.
- A login attempt uses the wrong password or a non-existent email.
- A password reset is requested for an unknown email address.
- A password reset request is reused, expired, or otherwise invalid.
- A browser restart clears the extension login state and protected workflow access requires login again.
- A valid session expires while the operator is reviewing or approving a send.
- A user attempts to access another user's resource by direct identifier.
- Existing local data contains partially complete records during ownership backfill.
- Provider authorization has expired or been revoked after previously working.
- Provider client configuration is present locally through a file but absent in a published environment.
- Uploaded resume content exists in storage, but the metadata or owner relationship is inconsistent.
- The published environment is deployed before migrations or seed data have completed.
- The browser extension points to the wrong environment URL.
- A send request is approved while the worker is down or provider delivery fails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create an account with a unique email, password, and display name in local, staging, and production environments.
- **FR-002**: The system MUST store only a secure password verifier and MUST never store or expose plaintext passwords.
- **FR-003**: Users MUST be able to log in, maintain an authenticated session for the current browser session, and log out.
- **FR-004**: The system MUST deny protected operational actions when no valid authenticated user is present.
- **FR-004a**: Users MUST NOT be required to verify their signup email before accessing protected workflow features in this MVP.
- **FR-004b**: Users MUST be able to request a password reset for their account email and set a new password through a user-facing reset flow.
- **FR-005**: The system MUST associate each user's settings, resumes, templates, provider account, provider authorization, job-search runs, opportunities, drafts, send requests, bulk batches, and outreach events with that user.
- **FR-006**: The system MUST ensure each user can only list, view, create, update, send, or delete resources they own.
- **FR-007**: The system MUST preserve existing local data by assigning previously global records to an explicit default local owner during upgrade or seed.
- **FR-008**: The system MUST avoid silently creating users per browser install, extension install, or anonymous session.
- **FR-009**: The extension MUST require explicit signup or login before showing protected Full-time workflow data.
- **FR-010**: The extension MUST send authenticated requests for protected actions and MUST support logout.
- **FR-011**: The extension MUST NOT store provider client secrets, provider access tokens, provider refresh tokens, or uploaded resume file bytes.
- **FR-012**: Provider client configuration MUST be supplied through documented environment secrets in published environments, with local file-based configuration allowed only as a local development fallback.
- **FR-013**: Provider authorization tokens granted by the user MUST remain server-side operational data owned by that user.
- **FR-014**: Uploaded resume metadata and current PDF content MUST remain owned by the user and available through the existing upload/download user experience.
- **FR-015**: The specification and supporting documentation MUST describe the future path for moving resume bytes to managed object storage without changing the extension user experience.
- **FR-016**: Environment-specific values MUST use the same documented variable names across local, staging, and production while allowing each environment to provide its own values, including its own database connection value.
- **FR-017**: Published deployment guidance MUST include database setup, migration execution, service health checks, worker startup, public application URL configuration, provider redirect configuration, and extension environment targeting.
- **FR-018**: Provider status MUST report setup-required, authorization-required, authorized, failed, and expired states without exposing secrets or tokens.
- **FR-019**: Validation guidance MUST cover health check, migration status, provider start/callback, provider status, resume upload/download, draft creation, approved send, and worker delivery.
- **FR-020**: Failure guidance MUST cover missing provider client configuration, invalid redirect URL, expired provider authorization, worker unavailable, database unavailable, and provider send failure.
- **FR-021**: Future search and send limits MUST be described as user subscription or plan rules, not global environment-level product limits.
- **FR-022**: Teams, workspaces, organizations, social login, magic links, single sign-on, and new third-party sending providers MUST remain outside this feature.
- **FR-023**: The existing Full-time capture, review, template, resume, draft, approved send, bulk foundation, and send history workflows MUST remain usable after login and ownership are introduced.

### Key Entities *(include if feature involves data)*

- **User**: An individual operator account identified by email, display name, password verifier, creation/update timestamps, and placeholders for future subscription plan and status.
- **Authenticated Session**: The user's active authenticated state used to access protected workflow data and actions.
- **Password Reset Request**: A time-limited user-facing recovery action tied to one account email that allows the user to set a new password.
- **Owned Operational Resource**: Any settings, resume, template, provider account, run, opportunity, draft, send request, bulk batch, or outreach event that belongs to exactly one user.
- **Provider Connection**: A user's connected sending provider state, including authorization status and server-side provider tokens.
- **Resume Attachment**: A user-owned resume file record with metadata and current PDF content, with a documented future storage-adapter path.
- **Environment Configuration**: The documented values and secrets that distinguish local, staging, and production operation.
- **Deployment Validation Run**: A recorded or documented smoke-test pass proving the published environment can support the core Full-time workflow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete signup and login in under 2 minutes with valid credentials.
- **SC-001a**: A registered user can complete password reset and log in with the new password in under 5 minutes.
- **SC-002**: In isolation tests with at least two users, 100% of protected resource list/detail/update/send attempts return only the logged-in user's data.
- **SC-003**: Existing local operational records are backfilled to a default local owner with 0 lost records across settings, resumes, templates, provider accounts, runs, opportunities, drafts, send requests, bulk batches, and outreach events.
- **SC-004**: A clean published-environment checklist can be completed in under 45 minutes after secrets and database credentials are available.
- **SC-005**: Provider status and provider failure responses expose 0 secret values, access tokens, refresh tokens, or resume file bytes.
- **SC-006**: The browser extension blocks protected workflow access for unauthenticated users in 100% of protected screens or actions, including after browser restart.
- **SC-007**: A controlled published-environment smoke test completes health check, login, provider connection, resume upload/download, draft preview, approved send, and delivery status without manual database edits.
- **SC-008**: Documentation clearly distinguishes database-owned operational data, environment secrets, local-only files, and future object-storage migration in one deploy-readiness guide.

## Assumptions

- The first product cycle uses individual users only; teams, workspaces, organizations, and enterprise identity are out of scope.
- Email verification is out of scope for this MVP.
- The existing Full-time workflow remains the active product lane for this feature.
- Existing local data may be assigned to one default local owner to preserve development continuity.
- Provider sending remains the current Gmail/OAuth-based v1 direction; adding alternative sending providers is out of scope.
- Uploaded resume PDFs remain stored as application-owned data for now, while documentation describes a future object-storage migration path.
- Published environments require explicit signup or login and should not rely on anonymous operator assumptions.
- Open self-signup is acceptable in production for this MVP, provided every protected resource remains isolated by authenticated user.
- Local development configuration can point to Docker PostgreSQL; staging and production should use their own environment-specific database values under the same variable names.
- Future subscription status and plan fields are placeholders in this feature and do not enforce product limits yet.
