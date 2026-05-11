# Research: Full-time Workflow Fixes

## Decision: Add Google primary auth through a separate identity link from Gmail sending OAuth

**Rationale**: The product needs lower-friction login/register, but Gmail send consent is a different permission with a different user expectation. A local operator account can link to a verified Google identity for app authentication while `sending_provider_accounts` continues to represent Gmail send authorization only.

**Alternatives considered**:

- Reuse Gmail OAuth as primary auth: rejected because it would conflate account login with email-send permission.
- Replace email/password auth with Google-only auth: rejected because existing local accounts and tests should remain compatible.
- Store Google tokens in the extension: rejected because secrets/tokens should stay server-side and the extension should only hold the app session token.

## Decision: Centralize email sanitization and validate after cleanup

**Rationale**: The same invalid suffix problem can enter through LinkedIn capture, manual edits, draft preparation, and bulk generation. A shared sanitizer avoids divergent behavior and lets tests cover both malformed suffixes such as `hashtag` and normal valid addresses such as plus-tagged or subdomain emails.

**Alternatives considered**:

- Clean only in the extension: rejected because worker/API-created data could still persist invalid contacts.
- Clean only before sending: rejected because invalid data would remain visible and break search/review flows.
- Aggressively trim to common TLDs only: rejected because it risks corrupting valid but less common addresses.

## Decision: Return opportunities in a paginated envelope with default page size 50

**Rationale**: The Jobs popup becomes heavy with hundreds of cards, and future pagination needs navigation metadata. A response envelope with `items`, total/page metadata, and current criteria is clearer than overloading the existing bare list. The extension can adapt its client/store while preserving the item shape for cards/details.

**Alternatives considered**:

- Client-side pagination after loading all opportunities: rejected because it still transfers and stores the heavy list.
- Infinite scroll only: rejected because selection semantics for bulk delete/send become harder to explain.
- Support all-pages selection now: rejected by the spec; `All listed` remains current-page scoped.

## Decision: Move Search region entirely into enabled AI filter payload

**Rationale**: LinkedIn publication search does not reliably honor region in this flow. Keeping base capture to text and sort avoids hiding useful posts before review. Region remains useful as optional post-capture AI context when the operator explicitly enables AI filters.

**Alternatives considered**:

- Keep appending region to base keywords: rejected because old behavior is unreliable and conflicts with the spec.
- Remove region preferences entirely: rejected because optional AI filtering still benefits from accepted/excluded regions.
- Always send region but ignore server-side: rejected because it preserves confusing state and tests become ambiguous.

## Decision: Store sender LinkedIn URL in owner-scoped settings and generation context

**Rationale**: Sender name, email, portfolio URL, and LinkedIn URL are all operator profile data used to personalize outreach. Keeping the URL in settings follows the existing owner-scoped settings pattern and lets template preview and AI generation share context without exposing another user's data.

**Alternatives considered**:

- Store LinkedIn URL per template: rejected because it is sender identity, not template content.
- Store LinkedIn URL only in extension state: rejected because AI generation runs server-side and future web clients need the same value.
- Auto-discover LinkedIn URL from Google account: rejected because it is not guaranteed and could surprise the operator.

## Decision: Model AI bulk generation as durable batch items with independent statuses

**Rationale**: The clarified requirement says completed items must be reviewable while the rest of the batch continues. That requires a durable progress model, not a single synchronous response. Per-item statuses (`queued`, `running`, `completed`, `failed`, `skipped`) let the popup poll or refresh safely and let failures remain visible with reasons.

**Alternatives considered**:

- Keep synchronous `/bulk-email/generate-ai`: rejected because it hides progress until the whole batch returns.
- Use popup-only transient progress: rejected because refresh/close would leave the operator blind.
- Create send requests as each item completes: rejected because generated content must remain human-reviewed before approval.

## Decision: Keep Search feedback anchored to run-level counters

**Rationale**: Real captured runs showed that secondary detail endpoints can fail because individual candidate details contain unexpected AI signal values. The operator still needs the Search panel to show whether the run is pending, running, completed, and how many candidates were accepted/rejected/duplicated. Run-level counters should therefore remain visible even when candidate or opportunity detail loading is partially unavailable.

**Alternatives considered**:

- Require all verification calls to succeed before showing progress: rejected because one malformed candidate detail can hide a valid completed run.
- Show only a generic error when candidate details fail: rejected because it leaves the operator blind even though run counters are reliable.
- Ignore candidate detail failures silently: rejected because the operator should still see a warning or degraded state while retaining counters.

## Decision: Normalize composite AI work-mode signals before candidate serialization

**Rationale**: AI filter output can describe work mode as a composite value such as `onsite|hybrid` or `remote|hybrid|onsite`. These values are understandable but may exceed a strict enum. The product should treat them as mixed or otherwise readable signals rather than letting candidate serialization fail and break Search feedback.

**Alternatives considered**:

- Reject AI outputs with composite signal values: rejected because the decision itself may still be useful and high confidence.
- Expand every possible composite string into a permanent enum: rejected because it creates an unbounded contract surface.
- Store raw provider output only: rejected because the operator and tests need stable, readable candidate diagnostics.

## Decision: Use source URL as fallback dedupe identity when company/title are missing

**Rationale**: Real captures showed approved candidates being marked as duplicates when the parser could not extract company/title, causing dedupe keys to collapse to keywords plus recruiter email. Recruiters often post different jobs with the same email and similar keywords. Company/title should remain the primary identity when available, but source URL should discriminate posts when those fields are empty.

**Alternatives considered**:

- Keep email-plus-keywords dedupe for missing company/title: rejected because it collapses distinct recruiter posts and hides approved jobs.
- Always include source URL in dedupe keys: rejected because reposted or mirrored URLs could weaken legitimate company/title dedupe.
- Disable dedupe for missing company/title: rejected because the exact same post can still be captured repeatedly.
