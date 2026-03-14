"""
Node Writer
Converts ImportTreeNode objects to OMNI Node records and persists them
under a target parent node.
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.node import Node
from app.modules.document_to_nodes.models.import_tree_models import ImportTreeNode
from app.modules.tree.service import calculate_text_stats, _set_stats


async def write_tree(
    db: AsyncSession,
    project_id: str,
    target_node_id: str,
    tree: list[ImportTreeNode],
) -> list[str]:
    """
    Persist the import tree under *target_node_id*.
    Returns the list of created root node IDs.
    """
    # Load the target node to get depth / path context
    result = await db.execute(
        select(Node).where(Node.id == uuid.UUID(target_node_id))
    )
    target: Node | None = result.scalar_one_or_none()
    if target is None:
        raise ValueError(f"Target node {target_node_id} not found")

    base_depth = target.depth + 1
    base_path = (target.path or str(target.id))

    # Determine starting order_key for new children
    sibling_result = await db.execute(
        select(Node.order_key)
        .where(Node.parent_id == target.id)
        .order_by(Node.order_key.desc().nullslast())
        .limit(1)
    )
    last_key_row = sibling_result.scalar_one_or_none()
    next_key = float(Decimal(str(last_key_row or 0)) + 100)

    root_ids: list[str] = []

    async def _create(
        imp: ImportTreeNode,
        parent_id: uuid.UUID,
        depth: int,
        path: str,
        order_key: float,
    ) -> Node:
        node_id = uuid.uuid4()
        stats = calculate_text_stats(imp.content)
        meta = _set_stats({}, stats)
        node = Node(
            id=node_id,
            project_id=uuid.UUID(project_id),
            parent_id=parent_id,
            depth=depth,
            order_index=0,
            order_key=order_key,
            node_role=imp.role,
            title=imp.title or "(untitled)",
            content=imp.content,
            content_format=imp.content_format,
            path=f"{path}/{node_id}",
            has_children=bool(imp.children),
            metadata_=meta,
        )
        db.add(node)
        await db.flush()

        # Recurse into children
        child_key = 100.0
        for child_imp in imp.children:
            await _create(
                child_imp,
                parent_id=node.id,
                depth=depth + 1,
                path=node.path or str(node.id),
                order_key=child_key,
            )
            child_key += 100.0

        return node

    key = next_key
    for imp_node in tree:
        node = await _create(
            imp_node,
            parent_id=target.id,
            depth=base_depth,
            path=base_path,
            order_key=key,
        )
        root_ids.append(str(node.id))
        key += 100.0

    # Mark target as having children
    target.has_children = True
    await db.flush()

    return root_ids
