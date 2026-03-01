# OMNI Backend

Schema-driven hierarchical narrative engine API built with **Python 3.11 + FastAPI + SQLAlchemy 2.0**.

## Structure

```
omni-backend/
├── app/
│   ├── main.py               # FastAPI application factory
│   ├── config/settings.py    # pydantic-settings (LOCAL/DEV/TEST/PROD)
│   ├── db/
│   │   ├── session.py        # Async engine + get_db dependency
│   │   └── base.py           # Model import registry for Alembic
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic v2 request/response schemas
│   ├── modules/
│   │   ├── tree/             # Recursive tree service + router
│   │   ├── entities/         # Character/faction/item service + router
│   │   ├── timeline/         # Event service + router
│   │   ├── graph/            # Edge / relationship service + router
│   │   └── schemas/          # Bible layer service + router
│   ├── api/v1/router.py      # Aggregated v1 API router
│   └── storage/              # local_storage.py / s3_storage.py
├── alembic/                  # Database migrations
├── alembic.ini
└── pyproject.toml
```

## Quick Start

```bash
cd omni-backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Make sure omni-db is running: cd ../omni-db && docker compose up -d
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for the interactive Swagger UI.

## Environment Variables

| Variable          | Default                                             | Description                  |
|-------------------|-----------------------------------------------------|------------------------------|
| `ENVIRONMENT`     | `local`                                             | `local\|dev\|test\|prod`       |
| `DATABASE_URL`    | `postgresql+asyncpg://omni:omni_secret@localhost:5483/omni_db` | Async DB URL |
| `STORAGE_MODE`    | `local`                                             | `local\|s3`                    |
| `S3_BUCKET`       | *(empty)*                                           | Required when mode=s3        |
| `CORS_ORIGINS`    | `["http://localhost:4252"]`                         | Allowed CORS origins         |

## Database Migrations (Alembic)

All migration commands must be run with `omni-backend` as the working directory
and the virtual environment active. The `DATABASE_URL` is resolved automatically
from `app/config/settings.py` (no need to set it in `alembic.ini`).

### Option A – Makefile (from the repo root)

```bash
# Start the database first
make db-up

# Create the initial migration (first time only)
make migrate-new MSG="initial schema"

# Apply all pending migrations
make migrate

# Roll back the last migration
make migrate-down

# Show full revision history
make migrate-history

# Show the revision the DB is currently at
make migrate-current
```

### Option B – CLI entry-points (after `pip install -e ".[dev]"`)

```bash
# Apply pending migrations
omni-migrate

# Generate a new autogenerate revision
omni-migrate-new "add projects table"

# Roll back one revision
omni-migrate-down

# Print history
omni-migrate-history

# Print current revision
omni-migrate-current
```

### Option C – alembic directly (from `omni-backend/`)

```bash
cd omni-backend
source .venv/bin/activate

alembic revision --autogenerate -m "initial schema"
alembic upgrade head
alembic downgrade -1
alembic history --verbose
alembic current --verbose
```

### Option D – Python module (from `omni-backend/`)

```bash
python -m scripts.migrate upgrade
python -m scripts.migrate new "add projects table"
python -m scripts.migrate down
python -m scripts.migrate history
python -m scripts.migrate current
```

## API Modules

| Prefix             | Description                              |
|--------------------|------------------------------------------|
| `/api/v1/tree`     | Recursive node tree (CRUD + CTE subtree) |
| `/api/v1/entities` | Characters, factions, items              |
| `/api/v1/timeline` | Events, entity attachment, chronology    |
| `/api/v1/graph`    | Edges, relationship path BFS             |
| `/api/v1/schemas`  | Bible layer CRUD + metadata validation   |
