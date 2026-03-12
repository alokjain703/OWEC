"""CE Trait Group service."""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_trait_group import CeTraitGroup
from app.modules.ce.repositories.ce_trait_group_repository import CeTraitGroupRepository
from app.modules.ce.schemas import CeTraitGroupCreate, CeTraitGroupUpdate


class CeTraitGroupService:
    def __init__(self, repo: CeTraitGroupRepository, db: AsyncSession):
        self.repo = repo
        self.db = db

    async def list(self) -> list[CeTraitGroup]:
        return await self.repo.list()

    async def list_by_schema(self, schema_id: str) -> list[CeTraitGroup]:
        return await self.repo.list_by_schema(schema_id)

    async def get(self, group_id: str) -> CeTraitGroup:
        group = await self.repo.get(group_id)
        if not group:
            raise ValueError(f"Trait group {group_id} not found")
        return group

    async def create(self, data: CeTraitGroupCreate) -> CeTraitGroup:
        group = CeTraitGroup(
            id=data.id or str(uuid.uuid4()),
            schema_id=data.schema_id,
            name=data.name,
            label=data.label,
            display_order=data.display_order,
            description=data.description,
        )
        return await self.repo.create(group)

    async def update(self, group_id: str, data: CeTraitGroupUpdate) -> CeTraitGroup:
        group = await self.get(group_id)
        if data.name is not None:
            group.name = data.name
        if data.label is not None:
            group.label = data.label
        if data.display_order is not None:
            group.display_order = data.display_order
        if data.description is not None:
            group.description = data.description
        return group

    async def delete(self, group_id: str) -> None:
        group = await self.get(group_id)
        await self.repo.delete(group)
