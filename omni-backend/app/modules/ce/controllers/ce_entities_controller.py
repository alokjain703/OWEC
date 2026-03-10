"""CE Entities controller."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_entity_repository import CeEntityRepository
from app.modules.ce.schemas import (
    CeEntityCreate,
    CeEntityOut,
    CeEntityUpdate,
    CeEntityTraitOut,
    CeEntityTraitsPut,
    CeResolvedTrait,
)
from app.modules.ce.services.ce_entity_service import CeEntityService

router = APIRouter(prefix="/entities", tags=["CE Entities"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeEntityService:
    return CeEntityService(CeEntityRepository(db), db)


@router.get("", response_model=list[CeEntityOut])
async def list_entities(svc: CeEntityService = Depends(get_service)):
    return await svc.list()


@router.get("/{entity_id}", response_model=CeEntityOut)
async def get_entity(entity_id: str, svc: CeEntityService = Depends(get_service)):
    try:
        return await svc.get(entity_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("", response_model=CeEntityOut, status_code=status.HTTP_201_CREATED)
async def create_entity(payload: CeEntityCreate, svc: CeEntityService = Depends(get_service)):
    return await svc.create(payload)


@router.put("/{entity_id}", response_model=CeEntityOut)
async def update_entity(entity_id: str, payload: CeEntityUpdate, svc: CeEntityService = Depends(get_service)):
    try:
        return await svc.update(entity_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entity(entity_id: str, svc: CeEntityService = Depends(get_service)):
    try:
        await svc.delete(entity_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{entity_id}/traits", response_model=list[CeEntityTraitOut])
async def list_entity_traits(entity_id: str, svc: CeEntityService = Depends(get_service)):
    try:
        return await svc.list_traits(entity_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{entity_id}/traits", response_model=list[CeEntityTraitOut])
async def put_entity_traits(
    entity_id: str,
    payload: CeEntityTraitsPut,
    svc: CeEntityService = Depends(get_service),
):
    try:
        return await svc.put_traits(entity_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{entity_id}/resolved-traits", response_model=list[CeResolvedTrait])
async def get_resolved_traits(entity_id: str, svc: CeEntityService = Depends(get_service)):
    try:
        return await svc.resolve_traits(entity_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
