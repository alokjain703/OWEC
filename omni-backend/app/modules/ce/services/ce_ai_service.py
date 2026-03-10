"""CE AI service (stub)."""
from app.modules.ce.schemas import CeAiRequest


class CeAiService:
    async def generate_traits(self, request: CeAiRequest) -> dict:
        return {
            "entityId": request.entityId,
            "traits": [],
            "message": "AI trait generation stub"
        }

    async def generate_backstory(self, request: CeAiRequest) -> dict:
        return {
            "entityId": request.entityId,
            "backstory": "",
            "message": "AI backstory generation stub"
        }

    async def suggest_relationships(self, request: CeAiRequest) -> dict:
        return {
            "entityId": request.entityId,
            "relationships": [],
            "message": "AI relationship suggestion stub"
        }
