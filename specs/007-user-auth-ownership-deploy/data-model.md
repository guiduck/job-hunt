# Data Model: User Auth Ownership Deploy

## Overview

This feature adds individual user accounts and owner boundaries to the existing Full-time operational data. Schema changes should be additive and migration-backed. Existing local data must be assigned to a default local user before ownership is enforced.

## Entities

### User

Represents one individual operator account.

**Fields**

- `id`: stable unique identifier.
- `email`: unique login email, normalized for comparison.
- `password_hash`: secure password verifier; never plaintext.
- `display_name`: user-facing name.
- `subscription_status`: placeholder for future subscription state.
- `subscription_plan`: placeholder for future plan/limits.
- `created_at`: creation timestamp.
- `updated_at`: last update timestamp.

**Validation Rules**

- `email` is required, valid, normalized, and unique.
- `password_hash` is required after account creation.
- `display_name` is required for signup.
- No team, workspace, organization, SSO, social login, or email verification state is required for this MVP.

**Relationships**

- Owns many `AuthSession` records.
- Owns many `PasswordResetRequest` records.
- Owns exactly or many operational resources depending on resource type.

### AuthSession

Represents an authenticated browser-session login.

**Fields**

- `id`: stable unique identifier.
- `user_id`: owner user.
- `token_hash`: hashed representation of the bearer token presented by clients.
- `created_at`: creation timestamp.
- `last_used_at`: last successful authenticated use.
- `expires_at`: session expiry timestamp or browser-session policy marker.
- `revoked_at`: timestamp set on logout or administrative revocation.

**Validation Rules**

- A session is valid only when it belongs to an active user, is not revoked, and has not expired.
- Logout revokes the current session.
- Extension storage must be browser-session scoped; after browser restart, protected workflow access requires login again.
- Raw session tokens are never persisted.

**State Transitions**

```text
active -> revoked
active -> expired
```

### PasswordResetRequest

Represents a user-facing password reset attempt.

**Fields**

- `id`: stable unique identifier.
- `user_id`: account being reset.
- `token_hash`: hashed reset token.
- `requested_email`: email entered in the reset request.
- `created_at`: creation timestamp.
- `expires_at`: expiration timestamp.
- `used_at`: timestamp set after a successful reset.

**Validation Rules**

- Reset tokens are time-limited and single-use.
- Reset requests for unknown emails must return a non-enumerating response.
- Successful reset replaces the user's password hash and invalidates prior reset token use.
- The reset flow does not verify signup email addresses for this MVP.

**State Transitions**

```text
requested -> used
requested -> expired
```

### Owned Operational Resource

A shared ownership pattern applied to existing tables.

**Ownership Field**

- `user_id`: required owner reference after backfill.

**Resources To Own**

- `user_settings`
- `resume_attachments`
- `email_templates`
- `sending_provider_accounts`
- `job_search_runs`
- `job_search_candidates`
- `linkedin_collection_inputs`
- `opportunities`
- `job_opportunity_details` through `opportunity`
- `opportunity_keyword_matches` through `opportunity`
- `email_drafts`
- `send_requests`
- `bulk_send_batches`
- `outreach_events`

**Validation Rules**

- Reads, updates, deletes, sends, downloads, provider actions, and bulk actions must be scoped to the authenticated user's owned records.
- Cross-user direct identifier access returns a not-found or forbidden outcome without leaking the target record.
- Bulk send selection must reject or ignore opportunities not owned by the authenticated user.
- Worker processing must preserve `user_id` and must select provider accounts owned by the same user as the run or send request.

### UserSettings

Existing user preference record, now owned.

**Fields Added/Changed**

- `user_id`: required owner.
- Existing operator fields remain for display/profile compatibility.

**Cardinality**

- One active settings record per user.

### ResumeAttachment

Existing uploaded resume metadata and PDF content, now owned.

**Fields Added/Changed**

- `user_id`: required owner.
- Existing metadata and `file_content` remain in PostgreSQL for MVP.

**Validation Rules**

- A default resume is user-scoped.
- Download is allowed only for the owner.
- Future object storage should preserve upload/download behavior.

### EmailTemplate

Existing email template, now owned.

**Fields Added/Changed**

- `user_id`: required owner for editable templates.

**Validation Rules**

- User-edited templates are private to that user.
- Future system templates may be seeded and copied into user-owned templates before editing.

### SendingProviderAccount

Existing Gmail provider account and token holder, now owned.

**Fields Added/Changed**

- `user_id`: required owner.
- Existing `token_json` remains server-side and must never be returned to extension clients.

**Validation Rules**

- At most one active Gmail provider account per user/provider name for this MVP.
- Provider status responses never expose client secrets or access/refresh tokens.

### JobSearchRun, JobSearchCandidate, LinkedInCollectionInput

Existing search and capture records, now owned.

**Fields Added/Changed**

- `job_search_runs.user_id`: required owner.
- Candidate and collection input ownership may be direct via `user_id` or inherited from the parent run; service queries must enforce the parent run owner either way.

**Validation Rules**

- Extension-created runs belong to the logged-in user.
- Worker-created candidates and opportunities inherit the run owner.

### Opportunity And Related Job Detail/Keyword Matches

Existing opportunity records, now owned at the opportunity root.

**Fields Added/Changed**

- `opportunities.user_id`: required owner.

**Validation Rules**

- Detail and keyword match access is scoped through the owning opportunity.
- Existing `opportunity_type` remains intact to preserve `job` and future `freelance` lanes.

### EmailDraft, SendRequest, BulkSendBatch, OutreachEvent

Existing email workflow records, now owned.

**Fields Added/Changed**

- `user_id`: required owner on root email workflow records.

**Validation Rules**

- Draft creation requires owner match between opportunity, template, resume, and authenticated user.
- Send approval requires owner match between draft/opportunity/template/resume/provider account and authenticated user.
- Bulk approval requires all selected opportunities, template, resume, batch, send requests, and events to belong to the same user.
- Worker delivery must never use another user's provider account.

### EnvironmentConfiguration

Documented runtime configuration for local, staging, and production.

**Fields/Values**

- `DATABASE_URL`: same variable name in every environment; local can point to Docker PostgreSQL, staging/production use their own database values.
- `EMAIL_PROVIDER`: Gmail for v1.
- `GMAIL_OAUTH_CLIENT_CONFIG_JSON`: preferred published secret.
- `GMAIL_OAUTH_CLIENT_SECRETS_FILE`: local fallback only.
- `GMAIL_OAUTH_REDIRECT_URI`: public callback URL for published environments.
- `GMAIL_OAUTH_SUCCESS_REDIRECT_URL`: extension/app success landing target.
- `PLASMO_PUBLIC_API_BASE_URL`: extension API target per environment.

## Migration Strategy

1. Create `users`, `auth_sessions`, and `password_reset_requests`.
2. Create or reuse the default local user (`local@example.com`, `Local Operator`) for existing local data.
3. Add nullable `user_id` columns to existing operational tables.
4. Backfill all existing rows to the default local user.
5. Add indexes and foreign keys for `user_id`.
6. Enforce non-null ownership where direct ownership is required.
7. Update services and worker paths to write `user_id` on all new records.

## Data Integrity Rules

- `users.email` unique.
- `auth_sessions.token_hash` unique.
- `password_reset_requests.token_hash` unique.
- Owner-scoped unique constraints should be used where a resource was previously globally unique, such as provider account per provider and active/default records per user.
- Password reset and session tokens must be stored hashed, not as raw tokens.
- OAuth tokens remain in PostgreSQL and are never returned to the extension.
- Resume bytes remain in PostgreSQL for MVP and are never stored in the extension.
