"""
Graph Service – edge creation, querying, and BFS path finding.
"""
from __future__ import annotations

import uuid
from collections import deque
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.edge import Edge
from app.schemas.edge import EdgeCreate, RelationshipPath


class GraphService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_edge(self, data: EdgeCreate) -> Edge:
        edge = Edge(
            project_id=data.project_id,
            from_node=data.from_node,
            to_node=data.to_node,
            from_entity=data.from_entity,
            to_entity=data.to_entity,
            relation_type=data.relation_type,
            metadata_=data.metadata,
        )
        self.db.add(edge)
        await self.db.flush()
        await self.db.refresh(edge)
        return edge

    async def delete_edge(self, edge_id: uuid.UUID) -> None:
        edge = await self.db.get(Edge, edge_id)
        if not edge:
            raise ValueError(f"Edge {edge_id} not found")
        await self.db.delete(edge)

    async def get_relations(self, project_id: uuid.UUID) -> list[Edge]:
        result = await self.db.execute(
            select(Edge).where(Edge.project_id == project_id)
        )
        return list(result.scalars().all())

    async def query_path(
        self,
        project_id: uuid.UUID,
        source_entity: uuid.UUID,
        target_entity: uuid.UUID,
    ) -> RelationshipPath:
        """BFS over entity edges to find shortest relationship path."""
        # Load all entity edges in project
        result = await self.db.execute(
            select(Edge).where(
                Edge.project_id == project_id,
                Edge.from_entity.isnot(None),
                Edge.to_entity.isnot(None),
            )
        )
        edges = result.scalars().all()

        adj: dict[str, list[tuple[str, str]]] = {}
        for e in edges:
            f, t, rt = str(e.from_entity), str(e.to_entity), e.relation_type
            adj.setdefault(f, []).append((t, rt))
            adj.setdefault(t, []).append((f, rt))  # undirected BFS

        # BFS
        src, tgt = str(source_entity), str(target_entity)
        queue: deque[tuple[list[str], list[str]]] = deque([([src], [])])
        visited = {src}

        while queue:
            path, rels = queue.popleft()
            current = path[-1]
            if current == tgt:
                return RelationshipPath(
                    path=[uuid.UUID(n) for n in path],
                    edge_types=rels,
                    length=len(rels),
                )
            for neighbor, rel in adj.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((path + [neighbor], rels + [rel]))

        return RelationshipPath(path=[], edge_types=[], length=0)
