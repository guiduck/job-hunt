# Research: LinkedIn Runs End-to-End Execution

## Decision: Use a database-backed worker polling loop for local v1

**Rationale**: The project already uses PostgreSQL as the source of truth and has a separate worker
entrypoint. A polling loop over `job_search_runs.status=pending` closes the operational gap without
introducing a queue service, broker, or new deployment component. This keeps local Docker validation
simple and preserves the constitution rule that long-running work stays outside the HTTP process.

**Alternatives considered**:

- Message broker queue: better for scale, but unnecessary for the current local validation target and
  would add infrastructure before the first end-to-end run is proven.
- API-triggered background task: simpler to wire, but violates the API/worker boundary for
  long-running scraping.
- Manual CLI invocation per run: useful for debugging, but fails the acceptance criterion that runs
  created by the API are processed without a manual internal call.

## Decision: Claim pending runs through a short transactional status change

**Rationale**: The worker should move a run from `pending` to `running` before provider collection so
operators can observe progress and so repeated loop iterations do not process the same pending run.
For the local v1 scope, one worker process is assumed; if multiple workers appear later, the same
claiming boundary can evolve toward row locking or leased claims.

**Alternatives considered**:

- Process pending rows without claiming first: risks duplicate processing when the loop restarts or
  overlaps.
- Add a full distributed lease model now: more robust for production, but broader than local v1.
- Delete queue rows after processing: incompatible with the existing run-as-history model.

## Decision: Mark stale running runs failed/stale on worker startup

**Rationale**: The clarification step chose visible failure over automatic retry for v1. This avoids
duplicating scraping and opportunity creation after a worker crash. The operator can see the failure,
inspect partial candidates if any exist, and start a new run intentionally.

**Alternatives considered**:

- Automatic retry once: useful later, but it requires idempotent checkpointing and stronger duplicate
  protections before it is safe.
- Resume in place: attractive for long jobs, but needs persisted progress markers beyond the current
  run/candidate outcome model.
- Leave running forever: simple, but hides operational failures and blocks trustworthy validation.

## Decision: Reuse existing candidate recording and opportunity creation semantics

**Rationale**: API services already encode acceptance, rejection, provider failure, dedupe, and metric
updates. The worker should feed normalized candidates into those semantics rather than duplicate the
rules. If import boundaries make direct reuse awkward, extract shared persistence helpers while
preserving the same behavior and tests.

**Alternatives considered**:

- Reimplement persistence inside worker: risks divergence between API tests, schemas, and actual
  worker behavior.
- Send candidates back through HTTP endpoints: preserves API boundaries but adds internal HTTP
  coupling and failure modes before needed.
- Store raw candidates only and process later: delays accepted opportunity visibility and fails the
  end-to-end acceptance criteria.

## Decision: Persist user-provided collection inputs for worker consumption

**Rationale**: The API currently accepts `collection_inputs` but the run model only records
`provided_source_count`. End-to-end processing requires the worker to read supplied URLs or pasted
content after the HTTP request returns. The design therefore needs either an additive
`linkedin_collection_inputs` table or an equivalent persisted JSON field on the run. A separate table
is preferred if implementation confirms inputs need filtering, per-input outcomes, or future audit.

**Alternatives considered**:

- Keep inputs request-only: cannot support asynchronous worker processing.
- Store all inputs only inside candidate rows: candidates do not exist until the worker runs.
- Store JSON on `job_search_runs`: smaller migration, but less queryable and less consistent with
  source-level audit needs.

## Decision: Treat provider status as aggregate, with candidate-level detail as source of truth

**Rationale**: A run can contain mixed outcomes: supplied content may succeed while automatic
LinkedIn search is blocked. Candidate records should carry exact provider status and error details,
while the run stores an aggregate status such as `collected`, `partial`, `blocked`, `empty`,
`inaccessible`, or `failed`. This keeps run list views useful without losing detailed diagnostics.

**Alternatives considered**:

- Only store run-level status: hides which source/query failed.
- Only store candidate-level status: makes run lists harder to operate.
- Fail the entire run on any provider error: too strict for partial local validation.

## Decision: Keep hiring-intent terms configurable and multilingual

**Rationale**: The user expects English-language job posts as well as Portuguese posts. The API and
provider already accept `hiring_intent_terms`, so the implementation should preserve that input and
seed defaults with `hiring`, `contratando`, and `contratamos` instead of hardcoding one language or
requiring a code change for calibration.

**Alternatives considered**:

- Hardcode only Portuguese terms: misses many English LinkedIn job posts.
- Hardcode only English terms: misses local Portuguese posts.
- Expand to a very large built-in keyword list now: risks noisy searches before real validation data.

## Decision: Detect broad LinkedIn contact invitations, not one DM literal

**Rationale**: Accepted LinkedIn contact without email should be based on explicit invitation wording,
not a single string like `me chame no dm`. The parser should use a maintainable phrase catalog across
English and Portuguese, covering DM/direct message/inbox, message me/us, reach out, send CV/resume via
LinkedIn, me chame, envie mensagem, fale comigo, and equivalent phrases. The poster profile URL remains
required so a loose profile link is not treated as contact permission.

**Alternatives considered**:

- Single regex alternative: brittle and misses common English postings.
- Accept any profile URL as contact: creates false positives and violates the explicit-contact rule.
- Require email only: safer but loses useful posts where recruiters explicitly ask for LinkedIn contact.

## Decision: Docker Compose should validate PostgreSQL, API, and worker together

**Rationale**: Previous quickstarts cover pieces of the flow, but this feature's acceptance criteria
require proving the API-created run is processed by the worker against the shared database. Docker
Compose is already the local infrastructure direction, so the quickstart should document the full
stack and expected curl responses.

**Alternatives considered**:

- Keep Compose PostgreSQL-only: acceptable for tests, but does not prove the operational local flow.
- Use only local Python processes: fine for development, but less reproducible for handoff.
- Require live LinkedIn success: unreliable because public LinkedIn access may be blocked; supplied
  public content remains the deterministic validation path.
