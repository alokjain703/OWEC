"""CE Relationship service."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_relationship import CeRelationship, CeRelationshipType
from app.modules.ce.models.ce_entity import CeEntity
from app.modules.ce.repositories.ce_relationship_repository import CeRelationshipRepository
from app.modules.ce.schemas import (
    CeRelationshipCreate,
    CeRelationshipUpdate,
    CeRelationshipTypeCreate,
    CeRelationshipTypeUpdate,
)


class CeRelationshipService:
    def __init__(self, repo: CeRelationshipRepository, db: AsyncSession):
        self.repo = repo
        self.db = db

    async def list(self) -> list[CeRelationship]:
        return await self.repo.list()

    async def get(self, relationship_id: str) -> CeRelationship:
        relationship = await self.repo.get(relationship_id)
        if not relationship:
            raise ValueError(f"Relationship {relationship_id} not found")
        return relationship

    async def create(self, data: CeRelationshipCreate) -> CeRelationship:
        relationship = CeRelationship(
            type_id=data.type_id,
            source_entity_id=data.source_entity_id,
            target_entity_id=data.target_entity_id,
            metadata_=data.metadata,
        )
        return await self.repo.create(relationship)

    async def update(self, relationship_id: str, data: CeRelationshipUpdate) -> CeRelationship:
        relationship = await self.get(relationship_id)
        if data.type_id is not None:
            relationship.type_id = data.type_id
        if data.source_entity_id is not None:
            relationship.source_entity_id = data.source_entity_id
        if data.target_entity_id is not None:
            relationship.target_entity_id = data.target_entity_id
        if data.metadata is not None:
            relationship.metadata_ = data.metadata
        return relationship

    async def delete(self, relationship_id: str) -> None:
        relationship = await self.get(relationship_id)
        await self.repo.delete(relationship)

    async def list_types(self) -> list[CeRelationshipType]:
        return await self.repo.list_types()

    async def get_type(self, type_id: str) -> CeRelationshipType:
        rel_type = await self.repo.get_type(type_id)
        if not rel_type:
            raise ValueError(f"Relationship type {type_id} not found")
        return rel_type

    async def create_type(self, data: CeRelationshipTypeCreate) -> CeRelationshipType:
        rel_type = CeRelationshipType(
            id=data.id,
            schema_id=data.schema_id,
            name=data.name,
            description=data.description,
        )
        return await self.repo.create_type(rel_type)

    async def update_type(self, type_id: str, data: CeRelationshipTypeUpdate) -> CeRelationshipType:
        rel_type = await self.get_type(type_id)
        if data.name is not None:
            rel_type.name = data.name
        if data.description is not None:
            rel_type.description = data.description
        return rel_type

    async def delete_type(self, type_id: str) -> None:
        rel_type = await self.get_type(type_id)
        await self.repo.delete_type(rel_type)

    async def get_graph(self) -> dict:
        nodes_result = await self.db.execute(select(CeEntity))
        entities = list(nodes_result.scalars().all())

        edges_result = await self.db.execute(
            select(CeRelationship, CeRelationshipType)
            .join(CeRelationshipType, CeRelationship.type_id == CeRelationshipType.id)
        )
        edges_rows = edges_result.all()

        return {
            "nodes": [
                {
                    "id": e.id,
                    "label": e.name,
                    "type": e.schema_id,
                }
                for e in entities
            ],
            "edges": [
                {
                    "source": rel.source_entity_id,
                    "target": rel.target_entity_id,
                    "type": rel_type.name,
                }
                for rel, rel_type in edges_rows
            ],
        }
