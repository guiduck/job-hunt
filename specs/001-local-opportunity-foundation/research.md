# Research: Local Opportunity Foundation

## Decision: Use Docker Compose with PostgreSQL as the only required local service

**Rationale**: The constitution and architecture docs already require PostgreSQL and Docker Compose
for local infrastructure. Keeping this feature to a single database service reduces setup time and
keeps the first implementation focused on persistence.

**Alternatives considered**:

- SQLite: rejected because the project direction is PostgreSQL and early schema choices should match production behavior.
- Full API + worker Compose stack: deferred because no worker implementation is required in this feature.

## Decision: Use FastAPI with SQLAlchemy 2.x, Alembic, Pydantic Settings, and psycopg

**Rationale**: FastAPI is the documented backend stack. SQLAlchemy 2.x and Alembic provide a stable
migration path for the structured opportunity model, while Pydantic Settings keeps environment
configuration explicit.

**Alternatives considered**:

- Raw SQL only: rejected because relationships, migrations, and future contracts will become harder to maintain.
- Async-only stack in the first increment: deferred unless implementation needs it; a synchronous SQLAlchemy foundation is simpler for initial CRUD and migrations.

## Decision: Model a shared `opportunities` base with lane-specific detail tables

**Rationale**: `freelance` and `job` must be first-class lanes without creating two incompatible
systems. A shared base table supports common filters, notes, source evidence, and future tabs, while
detail tables keep lane-specific fields clear.

**Alternatives considered**:

- Single wide `leads` table: rejected because job-specific lifecycle and freelance-specific CRM fields would drift quickly.
- Separate `freelance_leads` and `job_leads` roots: rejected because shared CRM, campaigns, prompts, and analytics would duplicate logic.

## Decision: Persist `keyword_sets` in this feature

**Rationale**: The full-time job lane depends on configured keywords now and future CV-derived
keywords later. Persisting a minimum keyword set gives the API a stable place to store manual terms
and a clearly marked mock fallback.

**Alternatives considered**:

- Store only `matched_keywords` on opportunities: rejected because it cannot represent configured search intent.
- Defer keyword storage entirely: rejected because job-search setup would be blocked or improvised.

## Decision: Defer LinkedIn scraping, CV parsing, prompt generation, and outreach sending

**Rationale**: This feature is the local data foundation. Discovery, parsing, prompt generation, and
delivery require separate compliance, worker, and UX decisions. The model stores enough context for
those future features without implementing them now.

**Alternatives considered**:

- Include a first scraper now: rejected because it would mix long-running discovery with a foundation feature.
- Include prompt/message generation now: rejected because the current feature needs persistence before AI artifacts.

## Decision: Provide API contracts for CRUD/filtering and local validation

**Rationale**: Even without a web UI, the first implementation should be testable through API
contracts. Contracts also keep future UI tabs and operator workflows aligned with the same backend
surface.

**Alternatives considered**:

- Migrations only: rejected because the success criteria require saving, retrieving, updating, and filtering records.
- Private service functions only: rejected because the project is explicitly an API-first backend.
