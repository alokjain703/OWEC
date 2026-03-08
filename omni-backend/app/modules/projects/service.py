"""
Project Service – CRUD for projects and related node operations.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.node import Node
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_project(self, project_id: uuid.UUID) -> Optional[Project]:
        """Get a project by ID."""
        return await self.db.get(Project, project_id)

    async def create_project(self, data: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            id=data.id,
            owner_id=data.owner_id,
            title=data.title,
            active_schema_id=data.active_schema_id,
            schema_version_id=data.schema_version_id,
        )
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def update_project(self, project_id: uuid.UUID, data: ProjectUpdate) -> Project:
        """Update an existing project."""
        project = await self.db.get(Project, project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        if data.title is not None:
            project.title = data.title
        if data.active_schema_id is not None:
            project.active_schema_id = data.active_schema_id
        if data.schema_version_id is not None:
            project.schema_version_id = data.schema_version_id
        
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete_project(self, project_id: uuid.UUID) -> None:
        """Delete a project and all its nodes (cascaded)."""
        project = await self.db.get(Project, project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        await self.db.delete(project)

    async def get_project_nodes(self, project_id: uuid.UUID) -> list[dict]:
        """Get all nodes for a project as a hierarchical tree."""
        # Use recursive CTE to build tree structure
        cte = text("""
            WITH RECURSIVE tree AS (
                -- Root nodes (no parent)
                SELECT * FROM nodes WHERE project_id = :project_id AND parent_id IS NULL
                UNION ALL
                -- Recursive join to get children
                SELECT n.* FROM nodes n
                JOIN tree t ON n.parent_id = t.id
            )
            SELECT * FROM tree ORDER BY depth, order_index
        """)
        result = await self.db.execute(cte, {"project_id": str(project_id)})
        rows = result.mappings().all()
        return self._build_tree(rows)

    @staticmethod
    def _build_tree(rows: list) -> list[dict]:
        """Convert flat list of nodes into nested tree structure."""
        nodes: dict[str, dict] = {}
        
        # First pass: create all nodes
        for row in rows:
            d = dict(row)
            d["children"] = []
            nodes[str(d["id"])] = d

        # Second pass: build parent-child relationships
        roots = []
        for node in nodes.values():
            pid = str(node["parent_id"]) if node["parent_id"] else None
            if pid and pid in nodes:
                nodes[pid]["children"].append(node)
            else:
                roots.append(node)
        
        return roots
