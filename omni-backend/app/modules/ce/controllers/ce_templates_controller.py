"""CE Templates controller."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_template_repository import CeTemplateRepository
from app.modules.ce.schemas import CeTemplateCreate, CeTemplateOut, CeTemplateUpdate
from app.modules.ce.services.ce_template_service import CeTemplateService

router = APIRouter(prefix="/templates", tags=["CE Templates"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeTemplateService:
    return CeTemplateService(CeTemplateRepository(db))


@router.get("", response_model=list[CeTemplateOut])
async def list_templates(svc: CeTemplateService = Depends(get_service)):
    return await svc.list()


@router.post("", response_model=CeTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(payload: CeTemplateCreate, svc: CeTemplateService = Depends(get_service)):
    return await svc.create(payload)


@router.put("/{template_id}", response_model=CeTemplateOut)
async def update_template(template_id: str, payload: CeTemplateUpdate, svc: CeTemplateService = Depends(get_service)):
    try:
        return await svc.update(template_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: str, svc: CeTemplateService = Depends(get_service)):
    try:
        await svc.delete(template_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
