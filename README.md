# OMNI – Schema-Driven Narrative Engine

> **"A hierarchical writing engine where all projects are nested nodes in a tree structure – decoupled from domain logic via swappable Bible schemas."**

---

## Integration with RAMPS

Omni integrates with RAMPS (Resources, Authorization, Management, Policies, Subscriptions) for authentication and workspace management. The organizational hierarchy is:

```
RAMPS Tenant (organization/customer)
  └── RAMPS Workspace (logical grouping)
        └── RAMPS Project (work unit)
              └── OMNI Project (narrative/writing data)
```

### Data Synchronization

- **Workspace Cache**: Omni caches workspace metadata from RAMPS in `workspace_cache` table
- **Project Cache**: Omni caches project metadata from RAMPS in `project_cache` table
- **User Access**: User-workspace relationships are synced via `user_workspace_access` table
- **Detailed Project Data**: While RAMPS stores project metadata, Omni stores the actual narrative content (nodes, entities, events, edges, schemas) in its own tables, linked by project ID

### Key Tables

- `workspace_cache`: Cached RAMPS workspace data (id, name, description, type, status)
- `project_cache`: Cached RAMPS project data (id, workspace_id, name, description, type)
- `projects`: Omni's core project table with detailed narrative structure
- `nodes`, `entities`, `events`, `edges`: Narrative content linked to projects

---

## Architecture

```
OWEC/
├── omni-db/           🐘  PostgreSQL (Dockerized) – port 5483
├── omni-backend/      ⚙   FastAPI + SQLAlchemy 2.0 – port 8000
├── omni-frontend/     🖥   Angular 19+ + D3.js – port 4252
└── docker-compose.yml 🐳   Full-stack orchestration
```

### Core Design Principles

| Layer | Concept |
|-------|---------|
| **The Tree** | Recursive `nodes` table: Universe → Collection → Major Unit → Atomic Unit |
| **The Bible** | `schemas` table: swappable JSON definitions that give meaning to roles |
| **Entities** | `entities` table: characters/factions/items, fully independent of the tree |
| **Timeline** | `events` + `event_entities`: temporal layer, not coupled to nodes |
| **Graph** | `edges` table: supports entity↔entity, node↔entity, causality chains |

---

## Makefile – Start / Stop / Restart

All lifecycle commands are available via `make` from the repo root.

```bash
# ── All 3 apps ────────────────────────────────────────────────
make start            # build & start db + backend + frontend
make stop             # stop all (containers preserved)
make restart          # restart all
make status           # show container status
make logs             # tail logs for all services
make down             # stop + remove containers

# ── omni-db ───────────────────────────────────────────────────
make start-db
make stop-db
make restart-db
make logs-db
make db-shell         # open psql inside the container

# ── omni-backend ─────────────────────────────────────────────
make start-backend
make stop-backend
make restart-backend
make logs-backend
make backend-dev      # run FastAPI locally (no Docker, hot-reload)

# ── omni-frontend ────────────────────────────────────────────
make start-frontend
make stop-frontend
make restart-frontend
make logs-frontend
make frontend-dev     # run Angular dev server locally (no Docker)
```

Run `make help` for the full reference.

---

## Quick Start – Individual Services

### 1 · Database

```bash
cd omni-db
cp .env.example .env
docker compose up -d
```

Postgres available at `localhost:5483`.

### 2 · Backend

```bash
cd omni-backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Swagger UI: **http://localhost:8000/docs**

### 3 · Frontend

```bash
cd omni-frontend
pnpm install
pnpm start           # → http://localhost:4252
```

---

## Full-Stack Docker Mode

```bash
# From project root – copy env files once
cp omni-db/.env.example omni-db/.env
cp omni-backend/.env.example omni-backend/.env

# Build images and start all 3 services
make start
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:4252       |
| Backend  | http://localhost:8000/docs  |
| Postgres | localhost:5483             |

---

## API Modules

| Prefix                      | Description                                    |
|-----------------------------|------------------------------------------------|
| `POST /api/v1/tree/nodes`   | Create tree node                               |
| `GET  /api/v1/tree/nodes/{id}/subtree` | Recursive subtree (CTE)           |
| `POST /api/v1/entities`     | Create character / faction / item              |
| `GET  /api/v1/entities/{id}/graph` | Entity relationship graph             |
| `POST /api/v1/timeline/events` | Create timeline event                       |
| `GET  /api/v1/timeline/project/{id}` | Full chronological timeline         |
| `POST /api/v1/graph/edges`  | Create directed relationship                   |
| `GET  /api/v1/graph/path`   | BFS shortest path between entities            |
| `GET  /api/v1/schemas`      | List all Bible schemas                         |
| `POST /api/v1/schemas/project/{id}/activate` | Swap active schema        |
| `POST /api/v1/schemas/project/{id}/validate` | Validate node metadata    |

---

## Writing Modes (Seed Schemas)

| Schema        | Universe → Collection → Major Unit → Atomic Unit |
|---------------|--------------------------------------------------|
| `BOOK_SERIES` | Universe → Series → Book → Chapter               |
| `TV_SERIES`   | Universe → Show → Season → Episode               |
| `MOVIE_SERIES`| Universe → Franchise → Film → Sequence           |
| `GAME_PROJECT`| Universe → Game → Act → Quest                   |

Switch modes by calling `POST /api/v1/schemas/project/{id}/activate` — **no migration required**.

---

## Future Extensions

- 🎮 Game branching logic (node metadata + schema rules)
- 🧬 Character state evolution (tracked in `entities.state` JSONB)
- 📅 Custom calendars (via `events.time_data` JSONB)
- 🤖 AI integration (schema-aware generation hooks)
- 🌐 Multi-timeline modes (time_data.calendar_type field)
