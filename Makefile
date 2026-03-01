# ──────────────────────────────────────────────────────────────────────────────
# OWEC – OMNI project root Makefile
# ──────────────────────────────────────────────────────────────────────────────
# Prerequisites:
#   • Docker Desktop running
#   • omni-backend/.venv created and activated, or editable install done:
#       cd omni-backend && python -m venv .venv && source .venv/bin/activate
#       pip install -e ".[dev]"
#
# All targets that run Python assume the venv is already active.
# Pass DB_URL to override the default, e.g.:
#   make migrate DB_URL=postgresql+asyncpg://user:pass@host:5483/omni_db
# ──────────────────────────────────────────────────────────────────────────────

SHELL := /bin/zsh
.DEFAULT_GOAL := help

BACKEND_DIR  := omni-backend
FRONTEND_DIR := omni-frontend
DB_DIR       := omni-db

# Docker Compose service names (must match docker-compose.yml)
SVC_DB       := postgres
SVC_BACKEND  := backend
SVC_FRONTEND := frontend

# ── Colours ───────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RESET := \033[0m

.PHONY: help \
        start stop restart status logs \
        start-db  stop-db  restart-db  logs-db  db-shell \
        start-backend  stop-backend  restart-backend  logs-backend \
        start-frontend stop-frontend restart-frontend logs-frontend \
        backend-install backend-dev backend-lint backend-typecheck backend-test \
        migrate migrate-new migrate-down migrate-history migrate-current \
        frontend-install frontend-dev frontend-build \
        up down

# ── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(CYAN)OWEC – OMNI Makefile$(RESET)"
	@echo ""
	@echo "  $(GREEN)All apps (Docker Compose)$(RESET)"
	@echo "    start              Start all 3 services (db + backend + frontend)"
	@echo "    stop               Stop all 3 services"
	@echo "    restart            Restart all 3 services"
	@echo "    status             Show running container status"
	@echo "    logs               Tail logs for all services"
	@echo ""
	@echo "  $(GREEN)omni-db$(RESET)"
	@echo "    start-db           Start PostgreSQL container (port 5483)"
	@echo "    stop-db            Stop PostgreSQL container"
	@echo "    restart-db         Restart PostgreSQL container"
	@echo "    logs-db            Tail PostgreSQL logs"
	@echo "    db-shell           Open psql inside the container"
	@echo ""
	@echo "  $(GREEN)omni-backend$(RESET)"
	@echo "    start-backend      Start backend container (port 8000)"
	@echo "    stop-backend       Stop backend container"
	@echo "    restart-backend    Restart backend container"
	@echo "    logs-backend       Tail backend container logs"
	@echo "    backend-dev        Run FastAPI locally with hot-reload (no Docker)"
	@echo "    backend-install    Install backend deps (editable + dev extras)"
	@echo "    backend-lint       Run ruff linter"
	@echo "    backend-typecheck  Run mypy"
	@echo "    backend-test       Run pytest with coverage"
	@echo ""
	@echo "  $(GREEN)omni-frontend$(RESET)"
	@echo "    start-frontend     Start frontend container (port 4252)"
	@echo "    stop-frontend      Stop frontend container"
	@echo "    restart-frontend   Restart frontend container"
	@echo "    logs-frontend      Tail frontend container logs"
	@echo "    frontend-dev       Run Angular dev server locally (no Docker)"
	@echo "    frontend-install   Install Angular deps with pnpm"
	@echo "    frontend-build     Production build"
	@echo ""
	@echo "  $(GREEN)Migrations$(RESET)"
	@echo "    migrate            Apply all pending migrations (upgrade head)"
	@echo "    migrate-new MSG=…  Autogenerate a new revision  e.g. make migrate-new MSG=\"add users\""
	@echo "    migrate-down       Roll back one revision"
	@echo "    migrate-history    Print full revision history"
	@echo "    migrate-current    Show the current DB revision"
	@echo ""

# ══════════════════════════════════════════════════════════════════════════════
# ALL APPS  ── start / stop / restart / status / logs
# ══════════════════════════════════════════════════════════════════════════════
start:
	@echo "$(CYAN)▶ Starting all services…$(RESET)"
	docker compose up -d --build
	@echo "$(GREEN)✔ All services started$(RESET)"
	@echo "  DB       → localhost:5483"
	@echo "  Backend  → http://localhost:8000"
	@echo "  Frontend → http://localhost:4252"

stop:
	@echo "$(YELLOW)■ Stopping all services…$(RESET)"
	docker compose stop
	@echo "$(YELLOW)✔ All services stopped$(RESET)"

restart:
	@echo "$(CYAN)↺ Restarting all services…$(RESET)"
	docker compose restart
	@echo "$(GREEN)✔ All services restarted$(RESET)"

status:
	@echo "$(CYAN)● Container status:$(RESET)"
	docker compose ps

logs:
	docker compose logs -f --tail=100

# Alias for backwards compatibility
up:   start
down:
	@echo "$(YELLOW)■ Stopping and removing all services…$(RESET)"
	docker compose down

# ══════════════════════════════════════════════════════════════════════════════
# omni-db  ── start / stop / restart / logs / shell
# ══════════════════════════════════════════════════════════════════════════════
start-db:
	@echo "$(CYAN)▶ Starting omni-db (PostgreSQL, port 5483)…$(RESET)"
	docker compose up -d $(SVC_DB)
	@echo "$(GREEN)✔ omni-db started → localhost:5483$(RESET)"

stop-db:
	@echo "$(YELLOW)■ Stopping omni-db…$(RESET)"
	docker compose stop $(SVC_DB)

restart-db:
	@echo "$(CYAN)↺ Restarting omni-db…$(RESET)"
	docker compose restart $(SVC_DB)
	@echo "$(GREEN)✔ omni-db restarted$(RESET)"

logs-db:
	docker compose logs -f --tail=100 $(SVC_DB)

db-shell:
	docker compose exec $(SVC_DB) psql -U omni -d omni_db

# ══════════════════════════════════════════════════════════════════════════════
# omni-backend  ── start / stop / restart / logs / local dev
# ══════════════════════════════════════════════════════════════════════════════
start-backend:
	@echo "$(CYAN)▶ Starting omni-backend (port 8000)…$(RESET)"
	docker compose up -d $(SVC_BACKEND)
	@echo "$(GREEN)✔ omni-backend started → http://localhost:8000$(RESET)"

stop-backend:
	@echo "$(YELLOW)■ Stopping omni-backend…$(RESET)"
	docker compose stop $(SVC_BACKEND)

restart-backend:
	@echo "$(CYAN)↺ Restarting omni-backend…$(RESET)"
	docker compose restart $(SVC_BACKEND)
	@echo "$(GREEN)✔ omni-backend restarted$(RESET)"

logs-backend:
	docker compose logs -f --tail=100 $(SVC_BACKEND)

backend-install:
	@echo "$(CYAN)▶ Installing backend (editable + dev)…$(RESET)"
	cd $(BACKEND_DIR) && pip install -e ".[dev]"

backend-dev:
	@echo "$(CYAN)▶ Starting FastAPI dev server locally (hot-reload, port 8000)…$(RESET)"
	cd $(BACKEND_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-lint:
	@echo "$(CYAN)▶ Running ruff…$(RESET)"
	cd $(BACKEND_DIR) && python -m ruff check .

backend-typecheck:
	@echo "$(CYAN)▶ Running mypy…$(RESET)"
	cd $(BACKEND_DIR) && python -m mypy app

backend-test:
	@echo "$(CYAN)▶ Running pytest…$(RESET)"
	cd $(BACKEND_DIR) && python -m pytest --cov=app --cov-report=term-missing -v

# ══════════════════════════════════════════════════════════════════════════════
# omni-frontend  ── start / stop / restart / logs / local dev
# ══════════════════════════════════════════════════════════════════════════════
start-frontend:
	@echo "$(CYAN)▶ Starting omni-frontend (port 4252)…$(RESET)"
	docker compose up -d $(SVC_FRONTEND)
	@echo "$(GREEN)✔ omni-frontend started → http://localhost:4252$(RESET)"

stop-frontend:
	@echo "$(YELLOW)■ Stopping omni-frontend…$(RESET)"
	docker compose stop $(SVC_FRONTEND)

restart-frontend:
	@echo "$(CYAN)↺ Restarting omni-frontend…$(RESET)"
	docker compose restart $(SVC_FRONTEND)
	@echo "$(GREEN)✔ omni-frontend restarted$(RESET)"

logs-frontend:
	docker compose logs -f --tail=100 $(SVC_FRONTEND)

frontend-install:
	@echo "$(CYAN)▶ Installing Angular deps with pnpm…$(RESET)"
	cd $(FRONTEND_DIR) && pnpm install

frontend-dev:
	@echo "$(CYAN)▶ Starting Angular dev server locally (port 4252)…$(RESET)"
	cd $(FRONTEND_DIR) && pnpm run start

frontend-build:
	@echo "$(CYAN)▶ Building Angular (production)…$(RESET)"
	cd $(FRONTEND_DIR) && pnpm run build

# ══════════════════════════════════════════════════════════════════════════════
# Migrations
# ══════════════════════════════════════════════════════════════════════════════
migrate:
	@echo "$(CYAN)▶ Applying migrations (upgrade head)…$(RESET)"
	cd $(BACKEND_DIR) && python -m alembic upgrade head

migrate-new:
	@if [ -z "$(MSG)" ]; then \
	  echo "Usage: make migrate-new MSG=\"your migration message\""; exit 1; \
	fi
	@echo "$(CYAN)▶ Generating new migration: $(MSG)$(RESET)"
	cd $(BACKEND_DIR) && python -m alembic revision --autogenerate -m "$(MSG)"

migrate-down:
	@echo "$(CYAN)▶ Rolling back one revision…$(RESET)"
	cd $(BACKEND_DIR) && python -m alembic downgrade -1

migrate-history:
	@echo "$(CYAN)▶ Revision history:$(RESET)"
	cd $(BACKEND_DIR) && python -m alembic history --verbose

migrate-current:
	@echo "$(CYAN)▶ Current revision:$(RESET)"
	cd $(BACKEND_DIR) && python -m alembic current --verbose
