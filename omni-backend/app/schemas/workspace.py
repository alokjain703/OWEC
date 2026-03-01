"""Pydantic v2 schemas – Workspace & WorkspaceMember"""
import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

WorkspaceType = Literal["personal", "organization", "enterprise"]
MemberRole = Literal["owner", "admin", "editor", "viewer"]
SubscriptionTier = Literal["free", "pro", "enterprise"]


# ── WorkspaceMember ──────────────────────────────────────────────────────────

class WorkspaceMemberAdd(BaseModel):
    user_id: uuid.UUID
    role: MemberRole


class WorkspaceMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: MemberRole


# ── Workspace ────────────────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    type: WorkspaceType = "personal"
    name: str = Field(..., min_length=1, max_length=120)
    owner_user_id: uuid.UUID
    subscription_tier: SubscriptionTier = "free"
    storage_quota_mb: int = Field(default=1024, ge=0)
    project_limit: int = Field(default=5, ge=1)
    settings: dict[str, Any] = Field(default_factory=dict)


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    subscription_tier: Optional[SubscriptionTier] = None
    storage_quota_mb: Optional[int] = Field(None, ge=0)
    project_limit: Optional[int] = Field(None, ge=1)
    settings: Optional[dict[str, Any]] = None


class WorkspaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: WorkspaceType
    name: str
    owner_user_id: uuid.UUID
    subscription_tier: str
    storage_quota_mb: int
    project_limit: int
    settings: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    members: list[WorkspaceMemberOut] = []
