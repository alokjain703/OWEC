"""CE Traits controller."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_trait_repository import CeTraitRepository
from app.modules.ce.schemas import CeTraitDefCreate, CeTraitDefOut, CeTraitDefUpdate
from app.modules.ce.services.ce_trait_service import CeTraitService

router = APIRouter(prefix="/traits", tags=["CE Traits"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeTraitService:
    return CeTraitService(CeTraitRepository(db))


@router.get("", response_model=list[CeTraitDefOut])
async def list_traits(svc: CeTraitService = Depends(get_service)):
    return await svc.list_defs()


@router.post("", response_model=CeTraitDefOut, status_code=status.HTTP_201_CREATED)
async def create_trait(payload: CeTraitDefCreate, svc: CeTraitService = Depends(get_service)):
    return await svc.create_def(payload)


@router.put("/{trait_def_id}", response_model=CeTraitDefOut)
async def update_trait(trait_def_id: str, payload: CeTraitDefUpdate, svc: CeTraitService = Depends(get_service)):
    try:
        return await svc.update_def(trait_def_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{trait_def_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trait(trait_def_id: str, svc: CeTraitService = Depends(get_service)):
    try:
        await svc.delete_def(trait_def_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
