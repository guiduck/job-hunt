# Quickstart: Local Opportunity Foundation

This quickstart validates the first implementation once tasks are generated and completed.

## Prerequisites

- Docker Desktop running
- Python 3.11+
- A shell that can run the project scripts

## 1. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Expected local values:

```bash
DATABASE_URL=postgresql+psycopg://scrapper:scrapper@localhost:5432/scrapper_freelance
POSTGRES_DB=scrapper_freelance
POSTGRES_USER=scrapper
POSTGRES_PASSWORD=scrapper
```

## 2. Start PostgreSQL

```bash
docker compose up -d db
```

Expected result:

- PostgreSQL container is running
- database is reachable on localhost

## 3. Install API Dependencies

```bash
cd apps/api
python -m venv .venv
source .venv/Scripts/activate
pip install -e ".[dev]"
```

On non-Windows shells, use the appropriate virtualenv activation command.

## 4. Run Migrations

```bash
alembic upgrade head
```

Expected result:

- initial opportunity tables exist
- default mock keyword set exists or can be created by the seed command

## 5. Start API

```bash
uvicorn app.main:app --reload
```

Expected result:

- `GET /health` returns success

## 6. Validate Keyword Fallback

Call the keyword set endpoint.

Expected result:

- a default mock keyword set is available when no user keyword set exists
- terms include `reactjs`, `typescript`, `nextjs`, and `nodejs`
- the set is marked as mock/default, not user-provided

## 7. Validate Opportunity Persistence

Create one `freelance` opportunity and one `job` opportunity through the API.

Expected result:

- both records are persisted
- list endpoint can filter by `opportunity_type=freelance`
- list endpoint can filter by `opportunity_type=job`
- each detail endpoint returns lane-specific fields

## 8. Validate Manual State Updates

Update:

- freelance stage to `contacted`
- job stage to `applied`

Expected result:

- state updates persist after API restart
- interaction history can record a manual note

## 9. Stop Local Services

```bash
docker compose down
```

To remove local data during development:

```bash
docker compose down -v
```
