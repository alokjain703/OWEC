"""CE schema repository."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_schema import CeSchema


class CeSchemaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[CeSchema]:
        result = await self.db.execute(select(CeSchema))
        return list(result.scalars().all())

    async def get(self, schema_id: str) -> CeSchema | None:
        return await self.db.get(CeSchema, schema_id)

    async def create(self, schema: CeSchema) -> CeSchema:
        self.db.add(schema)
        await self.db.flush()
        await self.db.refresh(schema)
        return schema

    async def delete(self, schema: CeSchema) -> None:
        await self.db.delete(schema)
