"""CE Graph controller."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.ce.repositories.ce_relationship_repository import CeRelationshipRepository
from app.modules.ce.schemas import CeGraphOut
from app.modules.ce.services.ce_relationship_service import CeRelationshipService

router = APIRouter(prefix="/graph", tags=["CE Graph"])


def get_service(db: AsyncSession = Depends(get_db)) -> CeRelationshipService:
    return CeRelationshipService(CeRelationshipRepository(db), db)


@router.get("", response_model=CeGraphOut)
async def get_graph(svc: CeRelationshipService = Depends(get_service)):
    return await svc.get_graph()
