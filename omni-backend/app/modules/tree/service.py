"""
Tree Service – recursive CTE subtree queries and tree mutations.
"""
from __future__ import annotations

import math
import re
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.models.node import Node
from app.schemas.node import (
    NodeCreate, NodeUpdate, NodeMove, NodeReorder,
    NodeDuplicate, NodeSplit, NodeMerge,
)


# ── Fractional ordering helper ─────────────────────────────────────────────────

def generate_order_key(
    prev: float | None,
    nxt: float | None,
) -> float:
    """Return a new order_key positioned between prev and nxt siblings."""
    if prev is not None and nxt is not None:
        return float(Decimal(str(prev)) + (Decimal(str(nxt)) - Decimal(str(prev))) / 2)
    if prev is not None:
        return float(Decimal(str(prev)) + 100)
    if nxt is not None:
        return float(Decimal(str(nxt)) / 2)
    return 100.0


# ── Content stats helpers ─────────────────────────────────────────────────

_RE_HTML_TAG = re.compile(r"<[^>]+>")


def default_stats() -> dict:
    """Zero-filled stats object used as the default when no content exists."""
    return {"word_count": 0, "char_count": 0, "sentence_count": 0,
            "paragraph_count": 0, "reading_time_minutes": 0}


def calculate_text_stats(content: str | None) -> dict:
    """
    Compute stats from raw node content (HTML tags stripped before counting).
    stats_behavior == 'generate': leaf nodes call this directly.
    Reading speed: 200 wpm  →  reading_time_minutes = ceil(word_count / 200)
    """
    if not content:
        return default_stats()
    plain = _RE_HTML_TAG.sub(" ", content) if "<" in content else content
    plain = plain.strip()
    if not plain:
        return default_stats()
    words = [w for w in re.split(r"\s+", plain) if w]
    sentences = [s for s in re.split(r"[.!?]+", plain) if s.strip()]
    paragraphs = [p for p in re.split(r"\n\s*\n", plain) if p.strip()]
    wc = len(words)
    return {
        "word_count": wc,
        "char_count": len(plain),
        "sentence_count": len(sentences),
        "paragraph_count": max(len(paragraphs), 1),
        "reading_time_minutes": math.ceil(wc / 200) if wc > 0 else 0,
    }


def _set_stats(meta: dict | None, stats: dict) -> dict:
    """Return a copy of *meta* with the ``stats`` key set to *stats*.
    Users must never be able to overwrite system-computed stats."""
    result = dict(meta or {})
    result["stats"] = stats
    return result


class TreeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── Create ────────────────────────────────────────────────────────────────
    async def create_node(self, data: NodeCreate) -> Node:
        # Determine depth
        depth = 0
        parent_path: str | None = None
        if data.parent_id:
            parent = await self.db.get(Node, data.parent_id)
            if not parent:
                raise ValueError(f"Parent node {data.parent_id} not found")
            depth = parent.depth + 1
            parent_path = parent.path

        # Position: use explicit key if provided, otherwise append at end
        if data.order_key is not None:
            order_key = data.order_key
        else:
            order_key = await self._append_order_key(data.project_id, data.parent_id)

        node = Node(
            project_id=data.project_id,
            parent_id=data.parent_id,
            depth=depth,
            order_index=0,        # legacy column – kept for DB compat
            order_key=order_key,
            node_role=data.node_role,
            title=data.title,
            content=data.content,
            content_format=data.content_format,
            metadata_=_set_stats(data.metadata, calculate_text_stats(data.content)),
        )
        self.db.add(node)
        await self.db.flush()
        await self.db.refresh(node)

        # Set path now that we have the UUID
        node.path = f"{parent_path}/{node.id}" if parent_path else str(node.id)
        await self.db.flush()

        # Mark parent as having children and propagate stats up the ancestor chain
        if data.parent_id:
            await self.db.execute(
                update(Node).where(Node.id == data.parent_id).values(has_children=True)
            )
            await self.db.flush()
            await self._aggregate_stats_to_root(data.parent_id)

        await self.db.refresh(node)
        return node

    # ─── Update ────────────────────────────────────────────────────────────────
    async def update_node(self, node_id: uuid.UUID, data: NodeUpdate) -> Node:
        node = await self._get_or_404(node_id)
        content_changed = False
        if data.title is not None:
            node.title = data.title
        if data.content is not None:
            node.content = data.content
            content_changed = True
        if data.content_format is not None:
            node.content_format = data.content_format
        if data.metadata is not None:
            # Preserve system-computed stats; user must not overwrite them
            current_stats = (node.metadata_ or {}).get("stats", default_stats())
            merged = dict(data.metadata)
            merged["stats"] = current_stats
            node.metadata_ = merged
            flag_modified(node, "metadata_")
        if content_changed:
            node.metadata_ = _set_stats(node.metadata_, calculate_text_stats(node.content))
            flag_modified(node, "metadata_")
        await self.db.flush()
        await self.db.refresh(node)
        if content_changed and node.parent_id:
            await self._aggregate_stats_to_root(node.parent_id)
            await self.db.refresh(node)
        return node

    # ─── Move ──────────────────────────────────────────────────────────────────
    async def move_node(self, node_id: uuid.UUID, move: NodeMove) -> Node:
        node = await self._get_or_404(node_id)
        old_parent_id = node.parent_id

        # New depth
        new_depth = 0
        new_parent_path: str | None = None
        if move.new_parent_id:
            parent = await self._get_or_404(move.new_parent_id)
            new_depth = parent.depth + 1
            new_parent_path = parent.path

        # Position
        if move.new_order_key is not None:
            new_order_key = move.new_order_key
        else:
            new_order_key = await self._append_order_key(
                node.project_id, move.new_parent_id
            )

        node.parent_id = move.new_parent_id
        node.depth = new_depth
        node.order_key = new_order_key
        node.path = f"{new_parent_path}/{node.id}" if new_parent_path else str(node.id)

        await self.db.flush()

        # Re-depth and re-path all descendants
        await self._recompute_descendant_depths(node_id, new_depth)
        await self._update_subtree_paths(node_id, node.path)

        # Update has_children for old and new parents
        if old_parent_id:
            await self._refresh_has_children(old_parent_id)
        if move.new_parent_id:
            await self.db.execute(
                update(Node).where(Node.id == move.new_parent_id).values(has_children=True)
            )

        await self.db.refresh(node)
        # Propagate stats for both affected ancestor chains
        if old_parent_id:
            await self._aggregate_stats_to_root(old_parent_id)
        if move.new_parent_id:
            await self._aggregate_stats_to_root(move.new_parent_id)
        await self.db.refresh(node)
        return node

    # ─── Delete ────────────────────────────────────────────────────────────────
    async def delete_node(self, node_id: uuid.UUID) -> None:
        node = await self._get_or_404(node_id)
        parent_id = node.parent_id
        await self.db.delete(node)  # CASCADE handles children via FK
        await self.db.flush()
        # Refresh has_children and propagate stats up the former parent chain
        if parent_id:
            await self._refresh_has_children(parent_id)
            await self._aggregate_stats_to_root(parent_id)

    # ─── Get subtree (recursive CTE) ──────────────────────────────────────────
    async def get_subtree(self, node_id: uuid.UUID) -> dict[str, Any]:
        cte = text("""
            WITH RECURSIVE subtree AS (
                SELECT * FROM nodes WHERE id = :root_id
                UNION ALL
                SELECT n.* FROM nodes n
                JOIN subtree s ON n.parent_id = s.id
            )
            SELECT * FROM subtree ORDER BY depth, order_key
        """)
        result = await self.db.execute(cte, {"root_id": str(node_id)})
        rows = result.mappings().all()
        return self._build_tree(rows)

    # ─── Duplicate ─────────────────────────────────────────────────────────────
    async def duplicate_node(self, node_id: uuid.UUID, data: NodeDuplicate) -> Node:
        """Copy a node (and optionally its full subtree) as an immediate next sibling."""
        source = await self._get_or_404(node_id)

        # Place the copy right after the source
        next_q = (
            select(Node.order_key)
            .where(
                Node.project_id == source.project_id,
                Node.parent_id == source.parent_id,
                Node.order_key > (source.order_key or 0),
            )
            .order_by(Node.order_key.asc().nullslast())
            .limit(1)
        )
        result = await self.db.execute(next_q)
        next_key = result.scalar_one_or_none()
        new_key = generate_order_key(
            float(source.order_key or 0),
            float(next_key) if next_key is not None else None,
        )

        copy = Node(
            project_id=source.project_id,
            parent_id=source.parent_id,
            depth=source.depth,
            order_index=0,
            order_key=new_key,
            node_role=source.node_role,
            title=f"{source.title} (copy)" if source.title else "(copy)",
            content=source.content,
            content_format=source.content_format,
            metadata_=_set_stats(dict(source.metadata_ or {}), calculate_text_stats(source.content)),
        )
        self.db.add(copy)
        await self.db.flush()
        await self.db.refresh(copy)

        # Build path
        if source.parent_id:
            parent = await self.db.get(Node, source.parent_id)
            copy.path = f"{parent.path}/{copy.id}" if parent else str(copy.id)
        else:
            copy.path = str(copy.id)
        await self.db.flush()

        # Mark parent has_children and propagate stats up
        if source.parent_id:
            await self.db.execute(
                update(Node).where(Node.id == source.parent_id).values(has_children=True)
            )
            await self._aggregate_stats_to_root(source.parent_id)

        await self.db.refresh(copy)
        return copy

    # ─── Split (insert sibling below) ─────────────────────────────────────────
    async def split_node(self, node_id: uuid.UUID, data: NodeSplit) -> Node:
        """Create a new sibling node immediately below the given node."""
        source = await self._get_or_404(node_id)

        # Find the next sibling to compute a midpoint key
        next_q = (
            select(Node.order_key)
            .where(
                Node.project_id == source.project_id,
                Node.parent_id == source.parent_id,
                Node.order_key > (source.order_key or 0),
            )
            .order_by(Node.order_key.asc().nullslast())
            .limit(1)
        )
        result = await self.db.execute(next_q)
        next_key = result.scalar_one_or_none()
        new_key = generate_order_key(
            float(source.order_key or 0),
            float(next_key) if next_key is not None else None,
        )

        new_node = Node(
            project_id=source.project_id,
            parent_id=source.parent_id,
            depth=source.depth,
            order_index=0,
            order_key=new_key,
            node_role=data.node_role or source.node_role,
            title=data.title,
            content=data.content,
            content_format=source.content_format,
            metadata_={"stats": calculate_text_stats(data.content)},
        )
        self.db.add(new_node)
        await self.db.flush()
        await self.db.refresh(new_node)

        # Build path
        if source.parent_id:
            parent = await self.db.get(Node, source.parent_id)
            new_node.path = f"{parent.path}/{new_node.id}" if parent else str(new_node.id)
        else:
            new_node.path = str(new_node.id)
        await self.db.flush()

        # Mark parent has_children and propagate stats up
        if source.parent_id:
            await self.db.execute(
                update(Node).where(Node.id == source.parent_id).values(has_children=True)
            )
            await self._aggregate_stats_to_root(source.parent_id)

        await self.db.refresh(new_node)
        return new_node

    # ─── Merge ─────────────────────────────────────────────────────────────────
    async def merge_node(self, node_id: uuid.UUID) -> Node:
        """Merge this node into its previous sibling (append content, delete this node)."""
        source = await self._get_or_404(node_id)

        prev_q = (
            select(Node)
            .where(
                Node.project_id == source.project_id,
                Node.parent_id == source.parent_id,
                Node.order_key < (source.order_key or 0),
            )
            .order_by(Node.order_key.desc().nullslast())
            .limit(1)
        )
        result = await self.db.execute(prev_q)
        prev_node = result.scalar_one_or_none()

        if not prev_node:
            raise ValueError("No previous sibling to merge with")

        # Append content and recompute stats for the merged node
        sep = "\n"
        merged_content = ((prev_node.content or "") + sep + (source.content or "")).strip()
        prev_node.content = merged_content
        prev_node.metadata_ = _set_stats(prev_node.metadata_, calculate_text_stats(merged_content))
        flag_modified(prev_node, "metadata_")
        await self.db.flush()

        # Delete source (CASCADE handles its children)
        parent_id = source.parent_id
        await self.db.delete(source)
        await self.db.flush()

        if parent_id:
            await self._refresh_has_children(parent_id)
            await self._aggregate_stats_to_root(parent_id)

        await self.db.refresh(prev_node)
        return prev_node

    # ─── Reorder siblings ──────────────────────────────────────────────────────
    async def reorder_nodes(self, reorder: NodeReorder) -> list[Node]:
        """Assign evenly-spaced fractional order_keys to the supplied sibling list."""
        updated = []
        for idx, node_id in enumerate(reorder.ordered_ids):
            new_key = float((idx + 1) * 100)
            await self.db.execute(
                update(Node).where(Node.id == node_id).values(order_key=new_key)
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

    async def _append_order_key(
        self, project_id: uuid.UUID, parent_id: uuid.UUID | None
    ) -> float:
        """Return an order_key that places a node at the end of its siblings."""
        q = (
            select(Node.order_key)
            .where(
                Node.project_id == project_id,
                Node.parent_id == parent_id,
            )
            .order_by(Node.order_key.desc().nullslast())
            .limit(1)
        )
        result = await self.db.execute(q)
        val = result.scalar_one_or_none()
        return generate_order_key(float(val) if val is not None else None, None)

    async def _refresh_has_children(self, parent_id: uuid.UUID) -> None:
        """Recompute has_children for a single node based on actual child count."""
        q = select(Node.id).where(Node.parent_id == parent_id).limit(1)
        result = await self.db.execute(q)
        has_any = result.scalar_one_or_none() is not None
        await self.db.execute(
            update(Node).where(Node.id == parent_id).values(has_children=has_any)
        )

    # ── Stats aggregation ───────────────────────────────────────────────────

    async def _recalculate_node_stats(self, node_id: uuid.UUID) -> None:
        """
        Recalculate metadata.stats for one node:
        - Leaf (no children) → stats_behavior='generate': compute from own content.
        - Parent (has children) → stats_behavior='aggregate': sum children's stats.
        """
        node = await self.db.get(Node, node_id)
        if not node:
            return
        q = (select(Node).where(Node.parent_id == node_id)
             .order_by(Node.order_key.asc().nullslast()))
        result = await self.db.execute(q)
        children = result.scalars().all()

        if not children:
            stats = calculate_text_stats(node.content)
        else:
            def _s(c: Node, k: str) -> int:
                return int((c.metadata_ or {}).get("stats", {}).get(k, 0))
            wc = sum(_s(c, "word_count") for c in children)
            cc = sum(_s(c, "char_count") for c in children)
            sc = sum(_s(c, "sentence_count") for c in children)
            pc = sum(_s(c, "paragraph_count") for c in children)
            stats = {
                "word_count": wc,
                "char_count": cc,
                "sentence_count": sc,
                "paragraph_count": pc,
                "reading_time_minutes": math.ceil(wc / 200) if wc > 0 else 0,
            }

        node.metadata_ = _set_stats(node.metadata_, stats)
        flag_modified(node, "metadata_")
        await self.db.flush()

    async def _aggregate_stats_to_root(self, start_node_id: uuid.UUID) -> None:
        """Walk from start_node_id up through every ancestor recalculating stats.
        Only the affected chain is touched — no full-tree recalculation."""
        current_id: uuid.UUID | None = start_node_id
        while current_id is not None:
            await self._recalculate_node_stats(current_id)
            node = await self.db.get(Node, current_id)
            current_id = node.parent_id if node else None

    async def backfill_project_stats(self, project_id: uuid.UUID) -> int:
        """
        Backfill metadata.stats for nodes in a project that do not have them yet.
        Processes deepest nodes first so parent aggregation is correct.
        Returns the count of nodes updated.
        """
        q = (select(Node)
             .where(Node.project_id == project_id)
             .order_by(Node.depth.desc(), Node.order_key.asc().nullslast()))
        result = await self.db.execute(q)
        nodes = result.scalars().all()

        updated = 0
        for node in nodes:
            if (node.metadata_ or {}).get("stats"):
                continue  # already has stats
            await self._recalculate_node_stats(node.id)
            updated += 1
        return updated

    async def _update_subtree_paths(
        self, root_id: uuid.UUID, root_path: str
    ) -> None:
        """Recursively update path for all descendants of root_id."""
        await self.db.execute(
            text("""
                WITH RECURSIVE sub AS (
                    SELECT id, parent_id, CAST(:root_path AS TEXT) AS path
                    FROM nodes WHERE id = :root_id

                    UNION ALL

                    SELECT n.id, n.parent_id, s.path || '/' || n.id
                    FROM nodes n
                    JOIN sub s ON n.parent_id = s.id
                )
                UPDATE nodes
                SET path = sub.path
                FROM sub
                WHERE nodes.id = sub.id
            """),
            {"root_id": str(root_id), "root_path": root_path},
        )

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
