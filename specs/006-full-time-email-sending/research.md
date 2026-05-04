# Research: Full-time Email Sending

## Decision: Require Gmail/OAuth real sending in v1 behind a provider adapter

**Rationale**: The clarified spec requires a real send button, not `mailto`, copy-only, or a local/mock sender. Gmail/OAuth matches the operator-owned personal account model, avoids embedding passwords, and aligns with the existing constitution requirement that sending be provider-backed, auditable, and outside HTTP request handlers. A provider adapter keeps the workflow stable if SMTP or another provider is added later.

**Alternatives considered**:

- **Local/mock sender only**: Rejected because it would not satisfy the real-send requirement.
- **SMTP first**: Rejected as the primary path because credential handling is more fragile for a local extension workflow and Gmail/OAuth is already the preferred project direction.
- **Direct browser Gmail compose/send**: Rejected because provider secrets and delivery state must stay backend/worker-controlled and auditable.

## Decision: API records previews/approvals; worker performs delivery

**Rationale**: HTTP requests should create drafts, approvals, and send requests quickly, then return status. The worker can safely handle provider latency, retries, token refresh, rate limits, and failure recording without blocking the extension UI.

**Alternatives considered**:

- **Send directly in API route**: Rejected by constitution and architecture docs because sending can be slow, retried, rate-limited, and failure-prone.
- **Send from the extension**: Rejected because OAuth tokens/secrets must not be bundled or stored in the operator-facing client.

## Decision: Store immutable rendered email snapshots on drafts/send requests

**Rationale**: Templates are editable and deactivatable, but history must show what was actually approved and sent. Persisting rendered subject/body, selected template ID, selected resume metadata, recipient, and warnings on the draft/send request preserves auditability after template edits.

**Alternatives considered**:

- **Render from template at send time only**: Rejected because template edits between preview and send could change approved content.
- **Only store template reference in history**: Rejected because historical records would drift after template edits or deletion/deactivation.

## Decision: Resume files are local-first with metadata in PostgreSQL

**Rationale**: The first version runs locally and only needs enough attachment support for the operator's resumes. Database metadata supports listing, default-by-upload-recency selection, availability checks, and audit history while the file bytes live in a local ignored storage path controlled by API/worker.

**Alternatives considered**:

- **Store resume bytes in PostgreSQL**: Rejected for v1 because local filesystem storage is simpler and keeps migrations/contracts lighter.
- **Store resumes in the extension**: Rejected because worker/provider delivery needs backend-controlled file access and the extension should not be the source of attachment truth.
- **Require a resume for all sends**: Rejected by clarification; resumes remain optional, with a warning for `job_application` without a CV.

## Decision: Last uploaded available CV is the default resume selection

**Rationale**: The user clarified that the email template/preview should already come with the last uploaded CV. This avoids a separate default toggle in v1 while staying predictable and easy to test.

**Alternatives considered**:

- **Manual default resume flag**: Deferred because upload recency satisfies the clarified behavior with fewer settings.
- **No default selection**: Rejected because it would add friction to every application preview.

## Decision: Block duplicate `job_application` sends after one success

**Rationale**: Real job applications carry higher accidental-send risk. Blocking duplicates in API service logic protects both individual and bulk sends. Later contact remains possible through `job_follow_up`, which is semantically different and visible in history.

**Alternatives considered**:

- **Allow override confirmation**: Rejected by clarification.
- **Warn only**: Rejected because it does not protect bulk sending strongly enough.

## Decision: Bulk send v1 is preview-first with duplicate/contact validation

**Rationale**: The feature needs a bulk-send foundation, not full automation. The first version must require preview and approval, skip duplicates, skip missing contacts, block invalid emails, and record events per recipient. Hardcoded global caps were removed; future volume limits should come from plan/subscription/workspace rules instead of env vars or fixed constants.

**Alternatives considered**:

- **No bulk flow in v1**: Rejected because the spec explicitly asks for a foundation.
- **Fixed cap of 25 recipients**: Replaced because limits should become product rules, not a hidden hardcoded constraint.

## Decision: Extend Plasmo popup navigation instead of adding a web app

**Rationale**: Current product direction treats the Plasmo extension as the first operational `Full-time` UI. Adding settings/templates/send panels to the existing popup and store keeps the feature close to the current operator workflow and reuses `PLASMO_PUBLIC_API_BASE_URL`.

**Alternatives considered**:

- **New Next.js web UI**: Deferred because the current feature should build on the existing extension rather than introduce another app.
- **Backend-only delivery APIs**: Rejected because the operator must manage templates/settings and review previews before approval.
