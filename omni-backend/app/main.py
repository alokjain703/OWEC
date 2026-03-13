"""
OMNI Backend – Application Entry Point
"""
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.db.session import engine, Base
from app.api.v1.router import api_router
from app.modules.ce.router import router as ce_router
from app.modules.user_context.router import router as uc_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (dev convenience; use Alembic in prod)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_application() -> FastAPI:
    application = FastAPI(
        title="OMNI – Narrative Engine API",
        description=(
            "Schema-driven hierarchical + graph-based narrative operating system. "
            "Tree · Entities · Timeline · Graph · Bible Schemas."
        ),
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    application.include_router(api_router, prefix="/api/v1")
    # CE alias without version prefix
    application.include_router(ce_router, prefix="/api")
    # User Context
    application.include_router(uc_router, prefix="/api")

    # ── Health ────────────────────────────────────────────────────────────────
    @application.get("/health", tags=["health"], include_in_schema=True)
    async def health_check():
        return {
            "status": "ok",
            "service": "omni-backend",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return application


app = create_application()
