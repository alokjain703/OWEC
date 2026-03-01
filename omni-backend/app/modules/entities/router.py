"""Entities API Router"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.entities.service import EntityService
from app.schemas.entity import (
    EntityCreate,
    EntityUpdateAttributes,
    EntityUpdateState,
    EntityOut,
)

router = APIRouter(prefix="/entities", tags=["Entities"])


def get_service(db: AsyncSession = Depends(get_db)) -> EntityService:
    return EntityService(db)


@router.post("", response_model=EntityOut, status_code=status.HTTP_201_CREATED,
             summary="Create a new entity (character, faction, item, etc.)")
async def create_entity(
    payload: EntityCreate,
    svc: EntityService = Depends(get_service),
):
    return await svc.create_entity(payload)


@router.patch("/{entity_id}/attributes", response_model=EntityOut,
              summary="Merge-update entity attributes")
async def update_attributes(
    entity_id: uuid.UUID,
    payload: EntityUpdateAttributes,
    svc: EntityService = Depends(get_service),
):
    try:
        return await svc.update_attributes(entity_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{entity_id}/state", response_model=EntityOut,
              summary="Merge-update entity state snapshot")
async def update_state(
    entity_id: uuid.UUID,
    payload: EntityUpdateState,
    svc: EntityService = Depends(get_service),
):
    try:
        return await svc.update_state(entity_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{entity_id}/graph", summary="Get all graph edges connected to this entity")
async def get_entity_graph(
    entity_id: uuid.UUID,
    svc: EntityService = Depends(get_service),
):
    return await svc.get_entity_graph(entity_id)


@router.get("/project/{project_id}", response_model=list[EntityOut],
            summary="List all entities in a project")
async def list_entities(
    project_id: uuid.UUID,
    svc: EntityService = Depends(get_service),
):
    return await svc.list_by_project(project_id)
