"""V1 API – aggregated router"""
from fastapi import APIRouter

from app.modules.workspaces.router import router as workspaces_router
from app.modules.projects.router import router as projects_router
from app.modules.tree.router import router as tree_router
from app.modules.entities.router import router as entities_router
from app.modules.timeline.router import router as timeline_router
from app.modules.graph.router import router as graph_router
from app.modules.schemas.router import router as schemas_router

api_router = APIRouter()
api_router.include_router(workspaces_router)
api_router.include_router(projects_router)
api_router.include_router(tree_router)
api_router.include_router(entities_router)
api_router.include_router(timeline_router)
api_router.include_router(graph_router)
api_router.include_router(schemas_router)
