"""Projects service (workspace-scoped) – CRUD + subscription limits."""
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.workspace import Workspace
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── List (workspace-scoped) ───────────────────────────────────────────────
    async def list_projects(
        self,
        workspace_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Project]:
        """List all projects in a workspace."""
        q = (
            select(Project)
            .where(Project.workspace_id == workspace_id)
            .order_by(Project.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    # ── Get one ───────────────────────────────────────────────────────────────
    async def get_project(self, project_id: uuid.UUID, workspace_id: uuid.UUID) -> Project:
        """Get a single project, ensuring it belongs to the workspace."""
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.workspace_id == workspace_id,
            )
        )
        project = result.scalar_one_or_none()
        if project is None:
            raise ValueError(
                f"Project {project_id} not found in workspace {workspace_id}"
            )
        return project

    # ── Create (with limit enforcement) ───────────────────────────────────────
    async def create_project(
        self, payload: ProjectCreate, workspace_id: uuid.UUID
    ) -> Project:
        """
        Create a project in the workspace.
        Enforces workspace.project_limit before creation.
        """
        # 1. Get workspace to check limit
        ws_result = await self.db.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        workspace = ws_result.scalar_one_or_none()
        if not workspace:
            raise ValueError(f"Workspace {workspace_id} not found")

        # 2. Count active projects
        active_count = await self.db.scalar(
            select(func.count())
            .select_from(Project)
            .where(
                Project.workspace_id == workspace_id,
                Project.status == "active",
            )
        )

        # 3. Enforce limit
        if active_count >= workspace.project_limit:
            raise ValueError(
                f"Project limit reached ({workspace.project_limit}). "
                f"Upgrade subscription or archive existing projects."
            )

        # 4. Create project
        project = Project(
            workspace_id=workspace_id,
            created_by=payload.created_by,
            title=payload.title,
            description=payload.description,
            status=payload.status,
            visibility=payload.visibility,
            storage_mode=payload.storage_mode,
            active_schema_id=payload.active_schema_id,
            settings=payload.settings,
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    # ── Update ────────────────────────────────────────────────────────────────
    async def update_project(
        self, project_id: uuid.UUID, workspace_id: uuid.UUID, payload: ProjectUpdate
    ) -> Project:
        """Update a project (workspace boundary enforced)."""
        project = await self.get_project(project_id, workspace_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    # ── Delete ────────────────────────────────────────────────────────────────
    async def delete_project(self, project_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
        """Delete a project (workspace boundary enforced)."""
        project = await self.get_project(project_id, workspace_id)
        await self.db.delete(project)
        await self.db.commit()
