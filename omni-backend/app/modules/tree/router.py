"""Tree API Router"""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.tree.service import TreeService
from app.schemas.node import (
    NodeCreate, NodeUpdate, NodeMove, NodeReorder, NodeOut,
    NodeDuplicate, NodeSplit, NodeMerge,
)

router = APIRouter(prefix="/tree", tags=["Tree"])


def get_service(db: AsyncSession = Depends(get_db)) -> TreeService:
    return TreeService(db)


@router.post("/nodes", response_model=NodeOut, status_code=status.HTTP_201_CREATED,
             summary="Create a new node in the tree")
async def create_node(
    payload: NodeCreate,
    svc: TreeService = Depends(get_service),
):
    """Create a node. Assign parent_id to nest; leave None for a root node."""
    try:
        node = await svc.create_node(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return node


@router.patch("/nodes/{node_id}", response_model=NodeOut,
              summary="Update node title / content / metadata")
async def update_node(
    node_id: uuid.UUID,
    payload: NodeUpdate,
    svc: TreeService = Depends(get_service),
):
    try:
        return await svc.update_node(node_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nodes/{node_id}/move", response_model=NodeOut,
             summary="Move node to a new parent / order position")
async def move_node(
    node_id: uuid.UUID,
    payload: NodeMove,
    svc: TreeService = Depends(get_service),
):
    try:
        return await svc.move_node(node_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a node and all its descendants")
async def delete_node(
    node_id: uuid.UUID,
    svc: TreeService = Depends(get_service),
):
    try:
        await svc.delete_node(node_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/nodes/{node_id}/subtree", summary="Get recursive subtree rooted at node")
async def get_subtree(
    node_id: uuid.UUID,
    svc: TreeService = Depends(get_service),
) -> Any:
    return await svc.get_subtree(node_id)


@router.post("/nodes/reorder", summary="Reorder sibling nodes")
async def reorder_nodes(
    payload: NodeReorder,
    svc: TreeService = Depends(get_service),
) -> list[NodeOut]:
    return await svc.reorder_nodes(payload)


@router.post("/nodes/{node_id}/duplicate", response_model=NodeOut,
             summary="Duplicate a node as the next sibling")
async def duplicate_node(
    node_id: uuid.UUID,
    payload: NodeDuplicate = NodeDuplicate(),
    svc: TreeService = Depends(get_service),
):
    try:
        return await svc.duplicate_node(node_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nodes/{node_id}/split", response_model=NodeOut,
             summary="Insert a new sibling node immediately below this one (split)")
async def split_node(
    node_id: uuid.UUID,
    payload: NodeSplit = NodeSplit(),
    svc: TreeService = Depends(get_service),
):
    try:
        return await svc.split_node(node_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nodes/{node_id}/merge", response_model=NodeOut,
             summary="Merge this node into its previous sibling")
async def merge_node(
    node_id: uuid.UUID,
    svc: TreeService = Depends(get_service),
):
    try:
        return await svc.merge_node(node_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/projects/{project_id}/backfill-stats",
             summary="Backfill metadata.stats for all nodes in a project that lack them")
async def backfill_project_stats(
    project_id: uuid.UUID,
    svc: TreeService = Depends(get_service),
) -> dict:
    """One-time / idempotent call to populate metadata.stats for existing nodes."""
    updated = await svc.backfill_project_stats(project_id)
    return {"updated": updated, "project_id": str(project_id)}
