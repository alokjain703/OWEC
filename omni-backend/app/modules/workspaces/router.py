"""Workspaces API Router – CRUD + membership management."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user_id, get_workspace_member, WorkspaceMemberContext
from app.db.session import get_db
from app.modules.workspaces.service import WorkspaceService
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceOut,
    WorkspaceUpdate,
    WorkspaceMemberAdd,
    WorkspaceMemberOut,
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


def _svc(db: AsyncSession = Depends(get_db)) -> WorkspaceService:
    return WorkspaceService(db)


@router.get("", response_model=list[WorkspaceOut], summary="List user's workspaces")
async def list_workspaces(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    svc: WorkspaceService = Depends(_svc),
):
    """List all workspaces where the current user is a member."""
    return await svc.list_workspaces(user_id=user_id, skip=skip, limit=limit)


@router.post(
    "",
    response_model=WorkspaceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace",
)
async def create_workspace(
    payload: WorkspaceCreate,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    svc: WorkspaceService = Depends(_svc),
):
    """
    Create a workspace. Owner is auto-added as a member with 'owner' role.
    Ensure payload.owner_user_id matches the authenticated user.
    """
    if payload.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create workspace for another user",
        )
    return await svc.create_workspace(payload)


@router.get(
    "/{workspace_id}", response_model=WorkspaceOut, summary="Get a single workspace"
)
async def get_workspace(
    workspace_id: uuid.UUID,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: WorkspaceService = Depends(_svc),
):
    """Get workspace details. Requires membership."""
    try:
        return await svc.get_workspace(workspace_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch(
    "/{workspace_id}", response_model=WorkspaceOut, summary="Update workspace fields"
)
async def update_workspace(
    workspace_id: uuid.UUID,
    payload: WorkspaceUpdate,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: WorkspaceService = Depends(_svc),
):
    """Update workspace. Requires owner or admin role."""
    if not member_ctx.is_admin_or_owner():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner/admin can update workspace",
        )
    try:
        return await svc.update_workspace(workspace_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workspace",
)
async def delete_workspace(
    workspace_id: uuid.UUID,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: WorkspaceService = Depends(_svc),
):
    """Delete workspace. Requires owner role."""
    if not member_ctx.is_owner():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can delete workspace",
        )
    try:
        await svc.delete_workspace(workspace_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post(
    "/{workspace_id}/members",
    response_model=WorkspaceMemberOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a member to workspace",
)
async def add_member(
    workspace_id: uuid.UUID,
    payload: WorkspaceMemberAdd,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: WorkspaceService = Depends(_svc),
):
    """Add a member to workspace. Requires owner role."""
    if not member_ctx.can_manage_members():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can manage members",
        )
    try:
        return await svc.add_member(workspace_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete(
    "/{workspace_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a member from workspace",
)
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    member_ctx: Annotated[WorkspaceMemberContext, Depends(get_workspace_member)],
    svc: WorkspaceService = Depends(_svc),
):
    """Remove a member from workspace. Requires owner role. Cannot remove last owner."""
    if not member_ctx.can_manage_members():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can manage members",
        )
    try:
        await svc.remove_member(workspace_id, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
