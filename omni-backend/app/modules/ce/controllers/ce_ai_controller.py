"""CE AI controller."""
from fastapi import APIRouter, Depends

from app.modules.ce.schemas import CeAiRequest
from app.modules.ce.services.ce_ai_service import CeAiService

router = APIRouter(prefix="/ai", tags=["CE AI"])


def get_service() -> CeAiService:
    return CeAiService()


@router.post("/generate-traits")
async def generate_traits(payload: CeAiRequest, svc: CeAiService = Depends(get_service)):
    return await svc.generate_traits(payload)


@router.post("/generate-backstory")
async def generate_backstory(payload: CeAiRequest, svc: CeAiService = Depends(get_service)):
    return await svc.generate_backstory(payload)


@router.post("/suggest-relationships")
async def suggest_relationships(payload: CeAiRequest, svc: CeAiService = Depends(get_service)):
    return await svc.suggest_relationships(payload)
