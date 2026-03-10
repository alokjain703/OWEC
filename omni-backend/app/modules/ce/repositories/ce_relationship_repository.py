"""CE relationship repository."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_relationship import CeRelationship, CeRelationshipType


class CeRelationshipRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[CeRelationship]:
        result = await self.db.execute(select(CeRelationship))
        return list(result.scalars().all())

    async def get(self, relationship_id: str) -> CeRelationship | None:
        return await self.db.get(CeRelationship, relationship_id)

    async def create(self, relationship: CeRelationship) -> CeRelationship:
        self.db.add(relationship)
        await self.db.flush()
        await self.db.refresh(relationship)
        return relationship

    async def delete(self, relationship: CeRelationship) -> None:
        await self.db.delete(relationship)

    async def list_types(self) -> list[CeRelationshipType]:
        result = await self.db.execute(select(CeRelationshipType))
        return list(result.scalars().all())

    async def get_type(self, type_id: str) -> CeRelationshipType | None:
        return await self.db.get(CeRelationshipType, type_id)

    async def create_type(self, rel_type: CeRelationshipType) -> CeRelationshipType:
        self.db.add(rel_type)
        await self.db.flush()
        await self.db.refresh(rel_type)
        return rel_type

    async def delete_type(self, rel_type: CeRelationshipType) -> None:
        await self.db.delete(rel_type)
