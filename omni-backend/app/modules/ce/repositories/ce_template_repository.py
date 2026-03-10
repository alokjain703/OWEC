"""CE template repository."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_template import CeTemplate


class CeTemplateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[CeTemplate]:
        result = await self.db.execute(select(CeTemplate))
        return list(result.scalars().all())

    async def list_by_schema(self, schema_id: str) -> list[CeTemplate]:
        result = await self.db.execute(select(CeTemplate).where(CeTemplate.schema_id == schema_id))
        return list(result.scalars().all())

    async def get(self, template_id: str) -> CeTemplate | None:
        return await self.db.get(CeTemplate, template_id)

    async def create(self, template: CeTemplate) -> CeTemplate:
        self.db.add(template)
        await self.db.flush()
        await self.db.refresh(template)
        return template

    async def delete(self, template: CeTemplate) -> None:
        await self.db.delete(template)
