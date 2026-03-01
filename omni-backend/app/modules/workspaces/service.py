"""Workspace service – CRUD + membership management."""
import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceMemberAdd


class WorkspaceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── List ──────────────────────────────────────────────────────────────────
    async def list_workspaces(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Workspace]:
        """List all workspaces where user is a member."""
        q = (
            select(Workspace)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(WorkspaceMember.user_id == user_id)
            .options(selectinload(Workspace.members))
            .order_by(Workspace.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    # ── Get one ───────────────────────────────────────────────────────────────
    async def get_workspace(self, workspace_id: uuid.UUID) -> Workspace:
        result = await self.db.execute(
            select(Workspace)
            .where(Workspace.id == workspace_id)
            .options(selectinload(Workspace.members))
        )
        workspace = result.scalar_one_or_none()
        if workspace is None:
            raise ValueError(f"Workspace {workspace_id} not found")
        return workspace

    # ── Create ────────────────────────────────────────────────────────────────
    async def create_workspace(self, payload: WorkspaceCreate) -> Workspace:
        workspace = Workspace(
            type=payload.type,
            name=payload.name,
            owner_user_id=payload.owner_user_id,
            subscription_tier=payload.subscription_tier,
            storage_quota_mb=payload.storage_quota_mb,
            project_limit=payload.project_limit,
            settings=payload.settings,
        )
        self.db.add(workspace)
        await self.db.flush()

        # Auto-add owner as member
        owner_member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=payload.owner_user_id,
            role="owner",
        )
        self.db.add(owner_member)
        await self.db.commit()
        
        # Refresh with members relationship loaded
        await self.db.refresh(workspace, attribute_names=["members"])
        return workspace

    # ── Update ────────────────────────────────────────────────────────────────
    async def update_workspace(
        self, workspace_id: uuid.UUID, payload: WorkspaceUpdate
    ) -> Workspace:
        workspace = await self.get_workspace(workspace_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(workspace, field, value)
        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    # ── Delete ────────────────────────────────────────────────────────────────
    async def delete_workspace(self, workspace_id: uuid.UUID) -> None:
        workspace = await self.get_workspace(workspace_id)
        await self.db.delete(workspace)
        await self.db.commit()

    # ── Add member ────────────────────────────────────────────────────────────
    async def add_member(
        self, workspace_id: uuid.UUID, payload: WorkspaceMemberAdd
    ) -> WorkspaceMember:
        # Check workspace exists
        await self.get_workspace(workspace_id)

        # Check if already a member
        existing = await self.db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == payload.user_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(
                f"User {payload.user_id} is already a member of workspace {workspace_id}"
            )

        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=payload.user_id,
            role=payload.role,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    # ── Remove member ─────────────────────────────────────────────────────────
    async def remove_member(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        result = await self.db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise ValueError(
                f"User {user_id} is not a member of workspace {workspace_id}"
            )
        # Prevent removing the last owner
        if member.role == "owner":
            owner_count = await self.db.scalar(
                select(func.count())
                .select_from(WorkspaceMember)
                .where(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.role == "owner",
                )
            )
            if owner_count <= 1:
                raise ValueError("Cannot remove the last owner from workspace")

        await self.db.delete(member)
        await self.db.commit()
