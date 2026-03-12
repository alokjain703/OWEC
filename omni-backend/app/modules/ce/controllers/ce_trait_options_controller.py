"""CE Trait Options controller.

Routes (all under /ce/trait-options):
    GET     /              – list options  (optionally filter ?trait_def_id=)
    POST    /              – create option  [ce-admin]
    PUT     /{id}          – update option  [ce-admin]
    DELETE  /{id}          – delete option  [ce-admin]
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_ce_admin
from app.db.session import get_db
from app.modules.ce.repositories.ce_trait_option_repository import CeTraitOptionRepository
from app.modules.ce.schemas import (
    CeTraitOptionCreate,
    CeTraitOptionOut,
    CeTraitOptionUpdate,
)
from app.modules.ce.services.ce_trait_option_service import CeTraitOptionService

router = APIRouter(prefix="/trait-options", tags=["CE Trait Options"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeTraitOptionService:
    return CeTraitOptionService(CeTraitOptionRepository(db), db)


@router.get("", response_model=list[CeTraitOptionOut])
async def list_trait_options(
    trait_def_id: str | None = Query(default=None),
    svc: CeTraitOptionService = Depends(get_service),
):
    if trait_def_id:
        return await svc.list_by_trait_def(trait_def_id)
    return await svc.list()


@router.post("", response_model=CeTraitOptionOut, status_code=status.HTTP_201_CREATED,
             dependencies=[require_ce_admin()])
async def create_trait_option(
    payload: CeTraitOptionCreate,
    svc: CeTraitOptionService = Depends(get_service),
):
    return await svc.create(payload)


@router.put("/{option_id}", response_model=CeTraitOptionOut,
            dependencies=[require_ce_admin()])
async def update_trait_option(
    option_id: str,
    payload: CeTraitOptionUpdate,
    svc: CeTraitOptionService = Depends(get_service),
):
    try:
        return await svc.update(option_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{option_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[require_ce_admin()])
async def delete_trait_option(
    option_id: str,
    svc: CeTraitOptionService = Depends(get_service),
):
    try:
        await svc.delete(option_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
