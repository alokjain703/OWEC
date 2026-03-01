"""Pydantic v2 schemas – Project (workspace-scoped)"""
import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ProjectStatus     = Literal["active", "archived", "deleted"]
ProjectVisibility = Literal["private", "workspace", "public"]
StorageMode       = Literal["local", "s3"]


class ProjectCreate(BaseModel):
    workspace_id: uuid.UUID
    created_by: uuid.UUID
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: ProjectStatus = "active"
    visibility: ProjectVisibility = "private"
    storage_mode: StorageMode = "local"
    active_schema_id: Optional[uuid.UUID] = None
    settings: dict[str, Any] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    visibility: Optional[ProjectVisibility] = None
    storage_mode: Optional[StorageMode] = None
    active_schema_id: Optional[uuid.UUID] = None
    settings: Optional[dict[str, Any]] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    created_by: uuid.UUID
    title: str
    description: Optional[str]
    status: str
    visibility: str
    storage_mode: str
    active_schema_id: Optional[uuid.UUID]
    settings: dict[str, Any]
    created_at: datetime
    updated_at: datetime
