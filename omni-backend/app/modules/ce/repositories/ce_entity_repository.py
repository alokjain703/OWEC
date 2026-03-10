"""CE entity repository."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_entity import CeEntity, CeEntityTrait


class CeEntityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[CeEntity]:
        result = await self.db.execute(select(CeEntity))
        return list(result.scalars().all())

    async def get(self, entity_id: str) -> CeEntity | None:
        return await self.db.get(CeEntity, entity_id)

    async def create(self, entity: CeEntity) -> CeEntity:
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete(self, entity: CeEntity) -> None:
        await self.db.delete(entity)

    async def list_traits(self, entity_id: str) -> list[CeEntityTrait]:
        result = await self.db.execute(select(CeEntityTrait).where(CeEntityTrait.entity_id == entity_id))
        return list(result.scalars().all())

    async def get_trait(self, entity_id: str, trait_def_id: str) -> CeEntityTrait | None:
        result = await self.db.execute(
            select(CeEntityTrait).where(
                CeEntityTrait.entity_id == entity_id,
                CeEntityTrait.trait_def_id == trait_def_id,
            )
        )
        return result.scalars().first()

    async def create_trait(self, trait: CeEntityTrait) -> CeEntityTrait:
        self.db.add(trait)
        await self.db.flush()
        await self.db.refresh(trait)
        return trait
