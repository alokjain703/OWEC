"""Project API Router"""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.projects.service import ProjectService
from app.modules.projects.schema_loader import SchemaLoaderService
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.node import NodeOut

router = APIRouter(prefix="/projects", tags=["Projects"])


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_schema_loader_service(db: AsyncSession = Depends(get_db)) -> SchemaLoaderService:
    return SchemaLoaderService(db)


@router.get("/{project_id}", response_model=ProjectOut,
            summary="Get a project by ID")
async def get_project(
    project_id: uuid.UUID,
    svc: ProjectService = Depends(get_project_service),
):
    """Get project details by ID."""
    project = await svc.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED,
             summary="Create a new project")
async def create_project(
    payload: ProjectCreate,
    svc: ProjectService = Depends(get_project_service),
    loader: SchemaLoaderService = Depends(get_schema_loader_service),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project and optionally initialize with schema-based starter nodes.
    
    If active_schema_id is provided, will create starter nodes based on the schema.
    """
    project = await svc.create_project(payload)
    
    # If schema is provided, initialize starter nodes
    if project.active_schema_id:
        try:
            await loader.initialize_project_from_schema(
                project.id,
                project.active_schema_id
            )
        except ValueError as e:
            # If schema loading fails, log but don't fail the project creation
            print(f"Warning: Could not initialize project from schema: {e}")
    
    await db.commit()
    return project


@router.patch("/{project_id}", response_model=ProjectOut,
              summary="Update project details")
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    svc: ProjectService = Depends(get_project_service),
):
    """Update project title or schema."""
    try:
        project = await svc.update_project(project_id, payload)
        return project
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a project")
async def delete_project(
    project_id: uuid.UUID,
    svc: ProjectService = Depends(get_project_service),
):
    """Delete project and all its nodes (cascaded)."""
    try:
        await svc.delete_project(project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{project_id}/nodes",
            summary="Get all nodes for a project as a tree")
async def get_project_nodes(
    project_id: uuid.UUID,
    svc: ProjectService = Depends(get_project_service),
) -> Any:
    """
    Get all nodes for a project in hierarchical tree structure.
    
    Returns a list of root nodes, each with nested children.
    """
    return await svc.get_project_nodes(project_id)

@router.post("/{project_id}/initialize-schema",
             status_code=status.HTTP_200_OK,
             summary="Initialize project with schema template")
async def initialize_project_with_schema(
    project_id: uuid.UUID,
    schema_id: uuid.UUID = Body(..., embed=True),
    svc: ProjectService = Depends(get_project_service),
    loader: SchemaLoaderService = Depends(get_schema_loader_service),
):
    """
    Initialize an existing project with a schema template.
    This will create starter nodes based on the schema definition.
    """
    try:
        # Verify project exists
        project = await svc.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Initialize with schema
        await loader.initialize_project_from_schema(project_id, schema_id)
        
        # Update project's active_schema_id
        await svc.update_project(project_id, ProjectUpdate(active_schema_id=schema_id))
        
        return {"message": "Project initialized successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))