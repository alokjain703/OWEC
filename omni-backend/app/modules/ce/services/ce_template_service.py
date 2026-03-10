"""CE Template service."""
from __future__ import annotations

from app.modules.ce.models.ce_template import CeTemplate
from app.modules.ce.repositories.ce_template_repository import CeTemplateRepository
from app.modules.ce.schemas import CeTemplateCreate, CeTemplateUpdate


class CeTemplateService:
    def __init__(self, repo: CeTemplateRepository):
        self.repo = repo

    async def list(self) -> list[CeTemplate]:
        return await self.repo.list()

    async def list_by_schema(self, schema_id: str) -> list[CeTemplate]:
        return await self.repo.list_by_schema(schema_id)

    async def get(self, template_id: str) -> CeTemplate:
        template = await self.repo.get(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        return template

    async def create(self, data: CeTemplateCreate) -> CeTemplate:
        template = CeTemplate(
            id=data.id,
            schema_id=data.schema_id,
            template_level=data.template_level,
            inherits_from=data.inherits_from,
        )
        return await self.repo.create(template)

    async def update(self, template_id: str, data: CeTemplateUpdate) -> CeTemplate:
        template = await self.get(template_id)
        if data.template_level is not None:
            template.template_level = data.template_level
        if data.inherits_from is not None:
            template.inherits_from = data.inherits_from
        return template

    async def delete(self, template_id: str) -> None:
        template = await self.get(template_id)
        await self.repo.delete(template)
