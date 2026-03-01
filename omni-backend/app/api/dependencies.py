"""
RBAC and workspace membership dependencies.

Extracts user_id from request headers (JWT-compatible placeholder).
Validates workspace membership and role.
Returns workspace membership context for service-layer RBAC enforcement.
"""
import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.workspace import WorkspaceMember


class WorkspaceMemberContext:
    """Encapsulates resolved workspace member context for RBAC."""

    def __init__(self, workspace_id: uuid.UUID, user_id: uuid.UUID, role: str):
        self.workspace_id = workspace_id
        self.user_id = user_id
        self.role = role

    def is_owner(self) -> bool:
        return self.role == "owner"

    def is_admin_or_owner(self) -> bool:
        return self.role in ("owner", "admin")

    def can_create_project(self) -> bool:
        return self.role in ("owner", "admin")

    def can_edit(self) -> bool:
        return self.role in ("owner", "admin", "editor")

    def can_delete(self) -> bool:
        return self.role == "owner"

    def can_manage_members(self) -> bool:
        return self.role == "owner"


async def get_current_user_id(
    x_user_id: Annotated[str | None, Header()] = None,
) -> uuid.UUID:
    """
    Extract user_id from X-User-Id header (placeholder for JWT validation).
    In production, replace this with real JWT decode + signature verification.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header (auth not configured)",
        )
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-User-Id format",
        )


async def get_workspace_member(
    workspace_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db),
) -> WorkspaceMemberContext:
    """
    Validates that user_id is a member of workspace_id.
    Returns WorkspaceMemberContext with role for RBAC checks.
    Raises 403 if not a member.
    """
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User {user_id} is not a member of workspace {workspace_id}",
        )
    return WorkspaceMemberContext(
        workspace_id=workspace_id, user_id=user_id, role=member.role
    )
