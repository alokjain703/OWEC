"""CE Admin controller.

Admin-only aggregated endpoints under /ce/admin.
All routes require sc-mgr or sc-acct-mgr role (enforced via require_ce_admin()).

Routes:
    GET  /ce/admin/schemas                   – list all CE schemas
    GET  /ce/admin/trait-groups              – list all trait groups
    GET  /ce/admin/trait-defs                – list all trait defs
    GET  /ce/admin/trait-options             – list all trait options
    GET  /ce/admin/trait-packs               – list all trait packs
    GET  /ce/admin/relationship-types        – list all relationship types
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_ce_admin
from app.db.session import get_db
from app.modules.ce.models.ce_relationship import CeRelationshipType
from app.modules.ce.models.ce_schema import CeSchema
from app.modules.ce.models.ce_trait import CeTraitDef, CeTraitPack
from app.modules.ce.models.ce_trait_group import CeTraitGroup, CeTraitOption
from app.modules.ce.repositories.ce_trait_group_repository import CeTraitGroupRepository
from app.modules.ce.repositories.ce_trait_option_repository import CeTraitOptionRepository
from app.modules.ce.schemas import (
    CeRelationshipTypeOut,
    CeSchemaOut,
    CeTraitDefOut,
    CeTraitGroupOut,
    CeTraitOptionOut,
    CeTraitPackOut,
)

router = APIRouter(
    prefix="/admin",
    tags=["CE Admin"],
    dependencies=[require_ce_admin()],
)


# ── Schemas ───────────────────────────────────────────────────────────────────

@router.get("/schemas", response_model=list[CeSchemaOut])
async def admin_list_schemas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CeSchema))
    return list(result.scalars().all())


# ── Trait Groups ──────────────────────────────────────────────────────────────

@router.get("/trait-groups", response_model=list[CeTraitGroupOut])
async def admin_list_trait_groups(db: AsyncSession = Depends(get_db)):
    repo = CeTraitGroupRepository(db)
    return await repo.list()


# ── Trait Defs ────────────────────────────────────────────────────────────────

@router.get("/trait-defs", response_model=list[CeTraitDefOut])
async def admin_list_trait_defs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CeTraitDef))
    return list(result.scalars().all())


# ── Trait Options ─────────────────────────────────────────────────────────────

@router.get("/trait-options", response_model=list[CeTraitOptionOut])
async def admin_list_trait_options(db: AsyncSession = Depends(get_db)):
    repo = CeTraitOptionRepository(db)
    return await repo.list()


# ── Trait Packs ───────────────────────────────────────────────────────────────

@router.get("/trait-packs", response_model=list[CeTraitPackOut])
async def admin_list_trait_packs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CeTraitPack))
    return list(result.scalars().all())


# ── Relationship Types ────────────────────────────────────────────────────────

@router.get("/relationship-types", response_model=list[CeRelationshipTypeOut])
async def admin_list_relationship_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CeRelationshipType))
    return list(result.scalars().all())
