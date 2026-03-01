"""
Tree Service – recursive CTE subtree queries and tree mutations.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node
from app.schemas.node import NodeCreate, NodeUpdate, NodeMove, NodeReorder


class TreeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── Create ────────────────────────────────────────────────────────────────
    async def create_node(self, data: NodeCreate) -> Node:
        # Determine depth and order_index
        depth = 0
        if data.parent_id:
            parent = await self.db.get(Node, data.parent_id)
            if not parent:
                raise ValueError(f"Parent node {data.parent_id} not found")
            depth = parent.depth + 1

        max_order = await self._max_order(data.project_id, data.parent_id)
        node = Node(
            project_id=data.project_id,
            parent_id=data.parent_id,
            depth=depth,
            order_index=max_order + 1,
            node_role=data.node_role,
            title=data.title,
            content=data.content,
            metadata_=data.metadata,
        )
        self.db.add(node)
        await self.db.flush()
        await self.db.refresh(node)
        return node

    # ─── Update ────────────────────────────────────────────────────────────────
    async def update_node(self, node_id: uuid.UUID, data: NodeUpdate) -> Node:
        node = await self._get_or_404(node_id)
        if data.title is not None:
            node.title = data.title
        if data.content is not None:
            node.content = data.content
        if data.metadata is not None:
            node.metadata_ = data.metadata
        await self.db.flush()
        await self.db.refresh(node)
        return node

    # ─── Move ──────────────────────────────────────────────────────────────────
    async def move_node(self, node_id: uuid.UUID, move: NodeMove) -> Node:
        node = await self._get_or_404(node_id)
        new_depth = 0
        if move.new_parent_id:
            parent = await self._get_or_404(move.new_parent_id)
            new_depth = parent.depth + 1
        node.parent_id = move.new_parent_id
        node.depth = new_depth
        node.order_index = move.new_order_index
        # Re-depth all descendants
        await self._recompute_descendant_depths(node_id, new_depth)
        await self.db.flush()
        await self.db.refresh(node)
        return node

    # ─── Delete ────────────────────────────────────────────────────────────────
    async def delete_node(self, node_id: uuid.UUID) -> None:
        node = await self._get_or_404(node_id)
        await self.db.delete(node)  # CASCADE handles children via FK

    # ─── Get subtree (recursive CTE) ──────────────────────────────────────────
    async def get_subtree(self, node_id: uuid.UUID) -> dict[str, Any]:
        cte = text("""
            WITH RECURSIVE subtree AS (
                SELECT * FROM nodes WHERE id = :root_id
                UNION ALL
                SELECT n.* FROM nodes n
                JOIN subtree s ON n.parent_id = s.id
            )
            SELECT * FROM subtree ORDER BY depth, order_index
        """)
        result = await self.db.execute(cte, {"root_id": str(node_id)})
        rows = result.mappings().all()
        return self._build_tree(rows)

    # ─── Reorder siblings ──────────────────────────────────────────────────────
    async def reorder_nodes(self, reorder: NodeReorder) -> list[Node]:
        updated = []
        for idx, node_id in enumerate(reorder.ordered_ids):
            await self.db.execute(
                update(Node).where(Node.id == node_id).values(order_index=idx)
            )
            node = await self.db.get(Node, node_id)
            if node:
                updated.append(node)
        await self.db.flush()
        return updated

    # ─── Helpers ───────────────────────────────────────────────────────────────
    async def _get_or_404(self, node_id: uuid.UUID) -> Node:
        node = await self.db.get(Node, node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")
        return node

    async def _max_order(self, project_id: uuid.UUID, parent_id: uuid.UUID | None) -> int:
        q = select(Node.order_index).where(
            Node.project_id == project_id,
            Node.parent_id == parent_id,
        ).order_by(Node.order_index.desc()).limit(1)
        result = await self.db.execute(q)
        val = result.scalar_one_or_none()
        return val if val is not None else -1

    async def _recompute_descendant_depths(
        self, root_id: uuid.UUID, root_depth: int
    ) -> None:
        await self.db.execute(
            text("""
                WITH RECURSIVE sub AS (
                    SELECT id, :root_depth + 1 AS new_depth FROM nodes WHERE parent_id = :root_id
                    UNION ALL
                    SELECT n.id, s.new_depth + 1 FROM nodes n JOIN sub s ON n.parent_id = s.id
                )
                UPDATE nodes SET depth = sub.new_depth FROM sub WHERE nodes.id = sub.id
            """),
            {"root_id": str(root_id), "root_depth": root_depth},
        )

    @staticmethod
    def _build_tree(rows: list) -> dict[str, Any]:
        """Turn a flat list of rows into a nested dict tree."""
        nodes: dict[str, dict] = {}
        for row in rows:
            d = dict(row)
            d["children"] = []
            nodes[str(d["id"])] = d

        roots = []
        for node in nodes.values():
            pid = str(node["parent_id"]) if node["parent_id"] else None
            if pid and pid in nodes:
                nodes[pid]["children"].append(node)
            else:
                roots.append(node)
        return roots[0] if len(roots) == 1 else {"children": roots}
