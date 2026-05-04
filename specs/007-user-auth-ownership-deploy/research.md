# Research: User Auth Ownership Deploy

## Decision: Signed Bearer Sessions With Server-Side Session Records

**Rationale**: The extension needs a token it can attach to protected API requests, but the clarified product behavior says login lasts only until browser restart and logout should revoke access. A signed bearer token backed by an `auth_sessions` record keeps API calls simple, allows explicit logout/revocation, and lets the extension store the token in browser session storage rather than persistent storage.

**Alternatives considered**:

- Stateless JWT only: simpler request validation, but hard to revoke on logout without a denylist and easy to make longer-lived than the browser-session requirement.
- Cookie-only session: good for web dashboards, but less direct for a browser extension calling a configurable API base URL.
- Long-lived refresh token: unnecessary for the clarified MVP and conflicts with browser-restart expiry.

## Decision: Additive User Ownership Migration With Default Local Backfill

**Rationale**: Existing local data is valuable and currently global. The migration should create a default local user, assign existing rows to that user, then enforce non-null ownership where feasible. This preserves current development data while making all future reads and writes owner-scoped.

**Alternatives considered**:

- Drop global records: violates the spec's no-data-loss requirement.
- Keep null/global rows forever: creates ambiguous access rules and risks cross-user leaks.
- Create a user per extension install: explicitly rejected because it fragments data across browsers and machines.

## Decision: User-Owned Templates Instead Of Shared Editable Templates

**Rationale**: Edited templates contain user-specific tone, resume context, and outreach preferences. Existing templates should be backfilled to the default local user. Future application defaults can be seed/system templates that are copied into a user's account before editing.

**Alternatives considered**:

- Global editable templates: risks sharing personal outreach content across users.
- No default templates: makes onboarding worse and increases setup friction.

## Decision: Password Hashing Via Maintained Password Library

**Rationale**: Password handling is a security-sensitive concern and should rely on a maintained hashing library with salted, adaptive hashes rather than custom hashing. The exact package can be selected during implementation based on Python compatibility, but the behavior must store only a password verifier and support password replacement during reset.

**Alternatives considered**:

- Plain SHA hashing: insufficient for password storage.
- Custom crypto wrapper: adds unnecessary risk and maintenance burden.
- External identity provider: out of scope because the MVP is email/password only.

## Decision: User-Facing Password Reset With Time-Limited Reset Requests

**Rationale**: The clarified scope includes password reset. A `password_reset_requests` record gives the API a testable lifecycle for requested, used, and expired reset attempts. The contract should avoid confirming whether an email exists and should ensure reset tokens are single-use and time-limited.

**Alternatives considered**:

- No reset flow: rejected by clarification.
- Manual/admin reset only: rejected by clarification.
- Magic-link login: out of scope and conflicts with explicit email/password login.

## Decision: No Email Verification In This MVP

**Rationale**: The spec explicitly clarifies that signup email verification is not required before protected access. User isolation remains enforced by authentication and `user_id` ownership. This keeps the deploy readiness slice focused and avoids adding a verification lifecycle that is not needed for the current single-operator-to-MVP transition.

**Alternatives considered**:

- Require verification before access: safer for public signup, but adds another email loop and was rejected.
- Mark accounts unverified for future enforcement: useful later, but unnecessary unless future subscription, abuse, or compliance rules require it.

## Decision: Same Environment Variable Names, Environment-Specific Values

**Rationale**: Local, staging, and production should use the same configuration keys so deployment docs and code remain consistent. Values differ by environment: local can point to Docker PostgreSQL and local OAuth files, while staging/production use managed database URLs and environment secrets.

**Alternatives considered**:

- Separate variable names per environment: increases code/config branching.
- Reusing one shared database across environments: violates isolation and increases risk of test data mixing with production.

## Decision: Keep Resume Bytes In PostgreSQL For MVP

**Rationale**: Existing resume upload/download already stores PDF bytes in PostgreSQL. Preserving this avoids changing the extension contract while ownership is introduced. The plan documents future object-storage migration with metadata remaining in the database.

**Alternatives considered**:

- Move to object storage now: adds deploy complexity before ownership is stable.
- Store files in `.local/`: explicitly disallowed for production data.

## Decision: Owner-Scoped Worker Processing

**Rationale**: The worker must preserve `user_id` when processing runs and sending email. Send delivery must select the Gmail provider account owned by the same user as the send request, and run/candidate/opportunity processing must not create or mutate data for another user.

**Alternatives considered**:

- Let worker infer user by provider account: fragile and unsafe when multiple users exist.
- Keep worker global until later: creates false security because API routes would be protected while background work could still mix users.

## Decision: Open Self-Signup In All Environments

**Rationale**: Clarification selected open self-signup for production as well as local/staging. The risk is managed through required login, strict owner scoping, and a deploy checklist that validates two-user isolation.

**Alternatives considered**:

- Invite-only production signup: lower public abuse risk, but rejected for this MVP.
- Admin-created production accounts only: adds administrative workflow outside the current product goal.
