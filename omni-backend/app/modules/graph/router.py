"""Graph API Router"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.graph.service import GraphService
from app.schemas.edge import EdgeCreate, EdgeOut, RelationshipPath

router = APIRouter(prefix="/graph", tags=["Graph"])


def get_service(db: AsyncSession = Depends(get_db)) -> GraphService:
    return GraphService(db)


@router.post("/edges", response_model=EdgeOut, status_code=status.HTTP_201_CREATED,
             summary="Create a directed relationship edge")
async def create_edge(
    payload: EdgeCreate,
    svc: GraphService = Depends(get_service),
):
    return await svc.create_edge(payload)


@router.delete("/edges/{edge_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a relationship edge")
async def delete_edge(
    edge_id: uuid.UUID,
    svc: GraphService = Depends(get_service),
):
    try:
        await svc.delete_edge(edge_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/project/{project_id}/relations", response_model=list[EdgeOut],
            summary="Get all edges / relationships in a project")
async def get_relations(
    project_id: uuid.UUID,
    svc: GraphService = Depends(get_service),
):
    return await svc.get_relations(project_id)


@router.get("/path", response_model=RelationshipPath,
            summary="Find shortest relationship path between two entities")
async def query_path(
    project_id: uuid.UUID,
    source: uuid.UUID,
    target: uuid.UUID,
    svc: GraphService = Depends(get_service),
):
    return await svc.query_path(project_id, source, target)
