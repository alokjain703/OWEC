"""CE Schemas controller."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_schema_repository import CeSchemaRepository
from app.modules.ce.schemas import CeSchemaCreate, CeSchemaOut, CeSchemaUpdate
from app.modules.ce.services.ce_schema_service import CeSchemaService

router = APIRouter(prefix="/schemas", tags=["CE Schemas"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeSchemaService:
    return CeSchemaService(CeSchemaRepository(db))


@router.get("", response_model=list[CeSchemaOut])
async def list_schemas(svc: CeSchemaService = Depends(get_service)):
    return await svc.list()


@router.get("/{schema_id}", response_model=CeSchemaOut)
async def get_schema(schema_id: str, svc: CeSchemaService = Depends(get_service)):
    try:
        return await svc.get(schema_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("", response_model=CeSchemaOut, status_code=status.HTTP_201_CREATED)
async def create_schema(payload: CeSchemaCreate, svc: CeSchemaService = Depends(get_service)):
    return await svc.create(payload)


@router.put("/{schema_id}", response_model=CeSchemaOut)
async def update_schema(schema_id: str, payload: CeSchemaUpdate, svc: CeSchemaService = Depends(get_service)):
    try:
        return await svc.update(schema_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(schema_id: str, svc: CeSchemaService = Depends(get_service)):
    try:
        await svc.delete(schema_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
