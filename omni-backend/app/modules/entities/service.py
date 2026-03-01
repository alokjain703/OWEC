"""
Entity Service – characters, factions, items (fully tree-independent).
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity import Entity
from app.models.edge import Edge
from app.schemas.entity import EntityCreate, EntityUpdateAttributes, EntityUpdateState


class EntityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_entity(self, data: EntityCreate) -> Entity:
        entity = Entity(
            project_id=data.project_id,
            entity_type=data.entity_type,
            name=data.name,
            description=data.description,
            attributes=data.attributes,
            state=data.state,
        )
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update_attributes(self, entity_id: uuid.UUID, data: EntityUpdateAttributes) -> Entity:
        entity = await self._get_or_404(entity_id)
        entity.attributes = {**entity.attributes, **data.attributes}
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update_state(self, entity_id: uuid.UUID, data: EntityUpdateState) -> Entity:
        entity = await self._get_or_404(entity_id)
        entity.state = {**entity.state, **data.state}
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def get_entity_graph(self, entity_id: uuid.UUID) -> dict:
        """Return edges connected to this entity (in + out)."""
        q = select(Edge).where(
            (Edge.from_entity == entity_id) | (Edge.to_entity == entity_id)
        )
        result = await self.db.execute(q)
        edges = result.scalars().all()
        return {
            "entity_id": str(entity_id),
            "edges": [
                {
                    "id": str(e.id),
                    "from_entity": str(e.from_entity),
                    "to_entity": str(e.to_entity),
                    "relation_type": e.relation_type,
                    "metadata": e.metadata_,
                }
                for e in edges
            ],
        }

    async def list_by_project(self, project_id: uuid.UUID) -> list[Entity]:
        result = await self.db.execute(
            select(Entity).where(Entity.project_id == project_id)
        )
        return list(result.scalars().all())

    async def _get_or_404(self, entity_id: uuid.UUID) -> Entity:
        entity = await self.db.get(Entity, entity_id)
        if not entity:
            raise ValueError(f"Entity {entity_id} not found")
        return entity
