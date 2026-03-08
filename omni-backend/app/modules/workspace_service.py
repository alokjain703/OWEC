"""Workspace cache service for syncing data from RAMPS"""
import logging
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.models.workspace_cache import WorkspaceCache, ProjectCache, UserWorkspaceAccess

logger = logging.getLogger(__name__)


class WorkspaceSyncService:
    """Service for syncing workspace and project metadata from RAMPS"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ramps_base_url = settings.RAMPS_API_URL or "http://localhost:8001/api"
    
    async def sync_user_workspaces(
        self, 
        user_id: UUID, 
        access_token: str,
        force: bool = False
    ) -> tuple[int, int]:
        """
        Sync workspaces and projects for a user from RAMPS.
        Returns tuple of (workspaces_synced, projects_synced)
        """
        # Check if we need to sync (skip if recently synced and not forced)
        if not force:
            # Check last sync time
            result = await self.db.execute(
                select(UserWorkspaceAccess.synced_at)
                .where(UserWorkspaceAccess.user_id == user_id)
                .order_by(UserWorkspaceAccess.synced_at.desc())
                .limit(1)
            )
            last_sync = result.scalar_one_or_none()
            
            if last_sync and datetime.now() - last_sync < timedelta(minutes=5):
                logger.info(f"Skipping sync for user {user_id} - recently synced")
                return (0, 0)
        
        try:
            # Fetch workspaces from RAMPS
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {access_token}"}
                
                # Get user's workspaces
                response = await client.get(
                    f"{self.ramps_base_url}/users/{user_id}/workspaces",
                    headers=headers,
                    timeout=10.0
                )
                response.raise_for_status()
                workspaces_data = response.json()
            
            workspaces_synced = 0
            projects_synced = 0
            
            # Clear old access records for this user
            await self.db.execute(
                delete(UserWorkspaceAccess).where(UserWorkspaceAccess.user_id == user_id)
            )
            
            # Process each workspace
            for ws_data in workspaces_data.get("workspaces", []):
                # Upsert workspace
                workspace = await self._upsert_workspace(ws_data)
                workspaces_synced += 1
                
                # Create access record
                access = UserWorkspaceAccess(
                    user_id=user_id,
                    workspace_id=workspace.id,
                    role=ws_data.get("user_role", "member"),
                    granted_at=datetime.fromisoformat(ws_data.get("granted_at", datetime.now().isoformat())),
                    synced_at=datetime.now()
                )
                self.db.add(access)
                
                # Sync projects for this workspace
                projects = await self._sync_workspace_projects(
                    workspace.id, 
                    access_token
                )
                projects_synced += len(projects)
            
            await self.db.commit()
            logger.info(f"Synced {workspaces_synced} workspaces and {projects_synced} projects for user {user_id}")
            
            return (workspaces_synced, projects_synced)
            
        except httpx.HTTPError as e:
            logger.error(f"Error syncing workspaces from RAMPS: {e}")
            await self.db.rollback()
            raise
        except Exception as e:
            logger.error(f"Unexpected error syncing workspaces: {e}")
            await self.db.rollback()
            raise
    
    async def _upsert_workspace(self, ws_data: dict[str, Any]) -> WorkspaceCache:
        """Upsert a workspace from RAMPS data"""
        workspace_id = UUID(ws_data["id"])
        
        # Check if exists
        result = await self.db.execute(
            select(WorkspaceCache).where(WorkspaceCache.id == workspace_id)
        )
        workspace = result.scalar_one_or_none()
        
        if workspace:
            # Update existing
            workspace.name = ws_data["name"]
            workspace.description = ws_data.get("description")
            workspace.workspace_type = ws_data.get("workspace_type")
            workspace.status = ws_data.get("status", "active")
            workspace.updated_at = datetime.fromisoformat(ws_data["updated_at"])
            workspace.synced_at = datetime.now()
        else:
            # Create new
            workspace = WorkspaceCache(
                id=workspace_id,
                name=ws_data["name"],
                description=ws_data.get("description"),
                workspace_type=ws_data.get("workspace_type"),
                status=ws_data.get("status", "active"),
                created_at=datetime.fromisoformat(ws_data["created_at"]),
                updated_at=datetime.fromisoformat(ws_data["updated_at"]),
                synced_at=datetime.now()
            )
            self.db.add(workspace)
        
        return workspace
    
    async def _sync_workspace_projects(
        self, 
        workspace_id: UUID, 
        access_token: str
    ) -> list[ProjectCache]:
        """Sync projects for a workspace from RAMPS"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {access_token}"}
                response = await client.get(
                    f"{self.ramps_base_url}/workspaces/{workspace_id}/projects",
                    headers=headers,
                    timeout=10.0
                )
                response.raise_for_status()
                projects_data = response.json()
            
            projects = []
            for proj_data in projects_data.get("projects", []):
                project = await self._upsert_project(proj_data, workspace_id)
                projects.append(project)
            
            return projects
            
        except httpx.HTTPError as e:
            logger.error(f"Error syncing projects for workspace {workspace_id}: {e}")
            return []
    
    async def _upsert_project(
        self, 
        proj_data: dict[str, Any], 
        workspace_id: UUID
    ) -> ProjectCache:
        """Upsert a project from RAMPS data"""
        project_id = UUID(proj_data["id"])
        
        # Check if exists
        result = await self.db.execute(
            select(ProjectCache).where(ProjectCache.id == project_id)
        )
        project = result.scalar_one_or_none()
        
        if project:
            # Update existing
            project.workspace_id = workspace_id
            project.name = proj_data["name"]
            project.description = proj_data.get("description")
            project.project_type = proj_data.get("project_type")
            project.status = proj_data.get("status", "active")
            project.updated_at = datetime.fromisoformat(proj_data["updated_at"])
            project.synced_at = datetime.now()
        else:
            # Create new
            project = ProjectCache(
                id=project_id,
                workspace_id=workspace_id,
                name=proj_data["name"],
                description=proj_data.get("description"),
                project_type=proj_data.get("project_type"),
                status=proj_data.get("status", "active"),
                created_at=datetime.fromisoformat(proj_data["created_at"]),
                updated_at=datetime.fromisoformat(proj_data["updated_at"]),
                synced_at=datetime.now()
            )
            self.db.add(project)
        
        return project
    
    async def get_user_workspaces(self, user_id: UUID) -> list[WorkspaceCache]:
        """Get cached workspaces for a user"""
        result = await self.db.execute(
            select(WorkspaceCache)
            .join(
                UserWorkspaceAccess,
                WorkspaceCache.id == UserWorkspaceAccess.workspace_id
            )
            .where(UserWorkspaceAccess.user_id == user_id)
            .where(WorkspaceCache.status == "active")
            .order_by(WorkspaceCache.name)
        )
        return list(result.scalars().all())
    
    async def get_workspace_projects(self, workspace_id: UUID) -> list[ProjectCache]:
        """Get cached projects for a workspace"""
        result = await self.db.execute(
            select(ProjectCache)
            .where(ProjectCache.workspace_id == workspace_id)
            .where(ProjectCache.status == "active")
            .order_by(ProjectCache.name)
        )
        return list(result.scalars().all())
