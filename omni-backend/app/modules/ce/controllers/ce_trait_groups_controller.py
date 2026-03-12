"""CE Trait Groups controller.

Routes (all under /ce/trait-groups):
    GET     /              – list all groups (optionally filter ?schema_id=)
    POST    /              – create group  [ce-admin]
    PUT     /{id}          – update group  [ce-admin]
    DELETE  /{id}          – delete group  [ce-admin]
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_ce_admin
from app.db.session import get_db
from app.modules.ce.repositories.ce_trait_group_repository import CeTraitGroupRepository
from app.modules.ce.schemas import (
    CeTraitGroupCreate,
    CeTraitGroupOut,
    CeTraitGroupUpdate,
)
from app.modules.ce.services.ce_trait_group_service import CeTraitGroupService

router = APIRouter(prefix="/trait-groups", tags=["CE Trait Groups"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeTraitGroupService:
    return CeTraitGroupService(CeTraitGroupRepository(db), db)


@router.get("", response_model=list[CeTraitGroupOut])
async def list_trait_groups(
    schema_id: str | None = Query(default=None),
    svc: CeTraitGroupService = Depends(get_service),
):
    if schema_id:
        return await svc.list_by_schema(schema_id)
    return await svc.list()


@router.post("", response_model=CeTraitGroupOut, status_code=status.HTTP_201_CREATED,
             dependencies=[require_ce_admin()])
async def create_trait_group(
    payload: CeTraitGroupCreate,
    svc: CeTraitGroupService = Depends(get_service),
):
    return await svc.create(payload)


@router.put("/{group_id}", response_model=CeTraitGroupOut,
            dependencies=[require_ce_admin()])
async def update_trait_group(
    group_id: str,
    payload: CeTraitGroupUpdate,
    svc: CeTraitGroupService = Depends(get_service),
):
    try:
        return await svc.update(group_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[require_ce_admin()])
async def delete_trait_group(
    group_id: str,
    svc: CeTraitGroupService = Depends(get_service),
):
    try:
        await svc.delete(group_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
