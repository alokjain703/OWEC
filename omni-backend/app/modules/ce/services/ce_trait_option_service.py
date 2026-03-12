"""CE Trait Option service."""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_trait_group import CeTraitOption
from app.modules.ce.repositories.ce_trait_option_repository import CeTraitOptionRepository
from app.modules.ce.schemas import CeTraitOptionCreate, CeTraitOptionUpdate


class CeTraitOptionService:
    def __init__(self, repo: CeTraitOptionRepository, db: AsyncSession):
        self.repo = repo
        self.db = db

    async def list(self) -> list[CeTraitOption]:
        return await self.repo.list()

    async def list_by_trait_def(self, trait_def_id: str) -> list[CeTraitOption]:
        return await self.repo.list_by_trait_def(trait_def_id)

    async def get(self, option_id: str) -> CeTraitOption:
        option = await self.repo.get(option_id)
        if not option:
            raise ValueError(f"Trait option {option_id} not found")
        return option

    async def create(self, data: CeTraitOptionCreate) -> CeTraitOption:
        option = CeTraitOption(
            id=data.id or str(uuid.uuid4()),
            trait_def_id=data.trait_def_id,
            value=data.value,
            label=data.label,
            display_order=data.display_order,
        )
        return await self.repo.create(option)

    async def update(self, option_id: str, data: CeTraitOptionUpdate) -> CeTraitOption:
        option = await self.get(option_id)
        if data.value is not None:
            option.value = data.value
        if data.label is not None:
            option.label = data.label
        if data.display_order is not None:
            option.display_order = data.display_order
        return option

    async def delete(self, option_id: str) -> None:
        option = await self.get(option_id)
        await self.repo.delete(option)
