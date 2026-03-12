"""CE Trait Option repository."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_trait_group import CeTraitOption


class CeTraitOptionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[CeTraitOption]:
        result = await self.db.execute(select(CeTraitOption).order_by(CeTraitOption.display_order))
        return list(result.scalars().all())

    async def list_by_trait_def(self, trait_def_id: str) -> list[CeTraitOption]:
        result = await self.db.execute(
            select(CeTraitOption)
            .where(CeTraitOption.trait_def_id == trait_def_id)
            .order_by(CeTraitOption.display_order)
        )
        return list(result.scalars().all())

    async def get(self, option_id: str) -> CeTraitOption | None:
        return await self.db.get(CeTraitOption, option_id)

    async def create(self, option: CeTraitOption) -> CeTraitOption:
        self.db.add(option)
        await self.db.flush()
        await self.db.refresh(option)
        return option

    async def delete(self, option: CeTraitOption) -> None:
        await self.db.delete(option)
