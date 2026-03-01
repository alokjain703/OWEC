# OMNI – Database (omni-db)

Dockerized PostgreSQL service for the OMNI narrative engine.

## Structure

```
omni-db/
├── docker-compose.yml    # Postgres service, port 5483
├── .env.example          # Credentials template  →  copy to .env
└── init/
    ├── 001_init.sql      # Core schema + indexes
    └── 002_seed.sql      # Seed Bible schemas (Book/TV/Movie/Game)
```

## Setup

```bash
cd omni-db
cp .env.example .env          # adjust credentials if needed
docker compose up -d
```

Postgres is now available at `localhost:5483`.

## Schema Summary

| Table          | Purpose                                              |
|----------------|------------------------------------------------------|
| `projects`     | Top-level workspace container                        |
| `nodes`        | Recursive tree (Universe→Collection→Major→Atomic)    |
| `entities`     | Characters, factions, items (tree-independent)       |
| `events`       | Timeline events (supports custom calendars via JSONB)|
| `event_entities` | Many-to-many: events ↔ entities                  |
| `edges`        | Graph layer: entity↔entity and node↔entity           |
| `schemas`      | Bible layer: swappable writing-mode definitions      |

## Teardown

```bash
docker compose down -v   # removes container AND named volume
```
