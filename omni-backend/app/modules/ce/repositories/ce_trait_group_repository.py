"""CE Trait Group repository."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_trait_group import CeTraitGroup


class CeTraitGroupRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[CeTraitGroup]:
        result = await self.db.execute(select(CeTraitGroup).order_by(CeTraitGroup.display_order))
        return list(result.scalars().all())

    async def list_by_schema(self, schema_id: str) -> list[CeTraitGroup]:
        result = await self.db.execute(
            select(CeTraitGroup)
            .where(CeTraitGroup.schema_id == schema_id)
            .order_by(CeTraitGroup.display_order)
        )
        return list(result.scalars().all())

    async def get(self, group_id: str) -> CeTraitGroup | None:
        return await self.db.get(CeTraitGroup, group_id)

    async def create(self, group: CeTraitGroup) -> CeTraitGroup:
        self.db.add(group)
        await self.db.flush()
        await self.db.refresh(group)
        return group

    async def delete(self, group: CeTraitGroup) -> None:
        await self.db.delete(group)
