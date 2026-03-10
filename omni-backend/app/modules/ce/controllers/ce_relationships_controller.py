"""CE Relationships controller."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_relationship_repository import CeRelationshipRepository
from app.modules.ce.schemas import (
    CeRelationshipCreate,
    CeRelationshipOut,
    CeRelationshipUpdate,
    CeRelationshipTypeCreate,
    CeRelationshipTypeOut,
    CeRelationshipTypeUpdate,
)
from app.modules.ce.services.ce_relationship_service import CeRelationshipService

router = APIRouter(prefix="/relationships", tags=["CE Relationships"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeRelationshipService:
    return CeRelationshipService(CeRelationshipRepository(db), db)


@router.get("", response_model=list[CeRelationshipOut])
async def list_relationships(svc: CeRelationshipService = Depends(get_service)):
    return await svc.list()


@router.post("", response_model=CeRelationshipOut, status_code=status.HTTP_201_CREATED)
async def create_relationship(payload: CeRelationshipCreate, svc: CeRelationshipService = Depends(get_service)):
    return await svc.create(payload)


@router.put("/{relationship_id}", response_model=CeRelationshipOut)
async def update_relationship(relationship_id: str, payload: CeRelationshipUpdate, svc: CeRelationshipService = Depends(get_service)):
    try:
        return await svc.update(relationship_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relationship(relationship_id: str, svc: CeRelationshipService = Depends(get_service)):
    try:
        await svc.delete(relationship_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/types", response_model=list[CeRelationshipTypeOut])
async def list_relationship_types(svc: CeRelationshipService = Depends(get_service)):
    return await svc.list_types()


@router.post("/types", response_model=CeRelationshipTypeOut, status_code=status.HTTP_201_CREATED)
async def create_relationship_type(payload: CeRelationshipTypeCreate, svc: CeRelationshipService = Depends(get_service)):
    return await svc.create_type(payload)


@router.put("/types/{type_id}", response_model=CeRelationshipTypeOut)
async def update_relationship_type(type_id: str, payload: CeRelationshipTypeUpdate, svc: CeRelationshipService = Depends(get_service)):
    try:
        return await svc.update_type(type_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relationship_type(type_id: str, svc: CeRelationshipService = Depends(get_service)):
    try:
        await svc.delete_type(type_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
