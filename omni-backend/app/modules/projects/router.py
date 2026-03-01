"""Projects API Router (workspace-scoped) – full CRUD with RBAC."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_workspace_member, WorkspaceMemberContext
from app.db.session import get_db
from app.modules.projects.service import ProjectService
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/workspaces/{workspace_id}/projects", tags=["Projects"])


def _svc(db: AsyncSession = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


@router.get("", response_model=list[ProjectOut], summary="List all projects in workspace")
async def list_projects(
    workspace_id: uuid.UUID,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    svc: ProjectService = Depends(_svc),
):
    """List projects in workspace. Requires membership."""
    return await svc.list_projects(workspace_id=workspace_id, skip=skip, limit=limit)


@router.post(
    "",
    response_model=ProjectOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
async def create_project(
    workspace_id: uuid.UUID,
    payload: ProjectCreate,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: ProjectService = Depends(_svc),
):
    """
    Create a project in workspace. Requires owner/admin role.
    Enforces workspace.project_limit.
    """
    if not member_ctx.can_create_project():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner/admin can create projects",
        )
    
    # Ensure payload workspace_id matches path
    if payload.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload workspace_id must match path workspace_id",
        )
    
    # Ensure created_by matches current user
    if payload.created_by != member_ctx.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create project on behalf of another user",
        )
    
    try:
        return await svc.create_project(payload, workspace_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get(
    "/{project_id}", response_model=ProjectOut, summary="Get a single project"
)
async def get_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: ProjectService = Depends(_svc),
):
    """Get project details. Requires membership."""
    try:
        return await svc.get_project(project_id, workspace_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch(
    "/{project_id}", response_model=ProjectOut, summary="Update project fields"
)
async def update_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: ProjectService = Depends(_svc),
):
    """Update project. Requires owner/admin/editor role."""
    if not member_ctx.can_edit():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner/admin/editor can update projects",
        )
    try:
        return await svc.update_project(project_id, workspace_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
)
async def delete_project(
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: ProjectService = Depends(_svc),
):
    """Delete project. Requires owner role."""
    if not member_ctx.can_delete():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can delete projects",
        )
    try:
        await svc.delete_project(project_id, workspace_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
