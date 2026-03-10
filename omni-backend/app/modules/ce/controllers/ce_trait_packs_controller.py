"""CE Trait Packs controller."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_trait_repository import CeTraitRepository
from app.modules.ce.schemas import CeTraitPackCreate, CeTraitPackOut, CeTraitPackUpdate
from app.modules.ce.services.ce_trait_service import CeTraitService

router = APIRouter(prefix="/trait-packs", tags=["CE Trait Packs"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeTraitService:
    return CeTraitService(CeTraitRepository(db))


@router.get("", response_model=list[CeTraitPackOut])
async def list_trait_packs(svc: CeTraitService = Depends(get_service)):
    return await svc.list_packs()


@router.post("", response_model=CeTraitPackOut, status_code=status.HTTP_201_CREATED)
async def create_trait_pack(payload: CeTraitPackCreate, svc: CeTraitService = Depends(get_service)):
    return await svc.create_pack(payload)


@router.put("/{pack_id}", response_model=CeTraitPackOut)
async def update_trait_pack(pack_id: str, payload: CeTraitPackUpdate, svc: CeTraitService = Depends(get_service)):
    try:
        return await svc.update_pack(pack_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{pack_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trait_pack(pack_id: str, svc: CeTraitService = Depends(get_service)):
    try:
        await svc.delete_pack(pack_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
