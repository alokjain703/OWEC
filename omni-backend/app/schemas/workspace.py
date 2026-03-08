"""Pydantic schemas for workspace cache"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    """Base workspace schema"""
    name: str
    description: str | None = None
    workspace_type: str | None = None
    status: str = "active"


class WorkspaceOut(WorkspaceBase):
    """Workspace output schema"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    synced_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProjectCacheBase(BaseModel):
    """Base project cache schema"""
    name: str
    workspace_id: UUID
    description: str | None = None
    project_type: str | None = None
    status: str = "active"


class ProjectCacheOut(ProjectCacheBase):
    """Project cache output schema"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    synced_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserWorkspaceAccessOut(BaseModel):
    """User workspace access output schema"""
    user_id: UUID
    workspace_id: UUID
    role: str
    granted_at: datetime
    synced_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class WorkspaceWithProjects(WorkspaceOut):
    """Workspace with projects"""
    projects: list[ProjectCacheOut] = []


class SyncWorkspacesRequest(BaseModel):
    """Request to sync workspaces from RAMPS"""
    force: bool = False  # Force re-sync even if recently synced


class SyncWorkspacesResponse(BaseModel):
    """Response from syncing workspaces"""
    workspaces_synced: int
    projects_synced: int
    message: str
