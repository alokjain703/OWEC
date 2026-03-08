"""ORM – Workspace Cache (from RAMPS)"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class WorkspaceCache(Base):
    """
    Cached workspace metadata from RAMPS.
    Workspaces are managed in RAMPS and cached here for performance.
    This is read-only data in Omni - modifications must go through RAMPS.
    """
    __tablename__ = "workspace_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_workspace_cache_status", "status"),
    )


class ProjectCache(Base):
    """
    Cached project metadata from RAMPS.
    Stores basic project info (id, name, workspace, type) from RAMPS.
    Detailed project data (nodes, entities, events, edges, schemas) stored in local Project model.
    """
    __tablename__ = "project_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    project_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_project_cache_workspace_id", "workspace_id"),
        Index("idx_project_cache_status", "status"),
    )


class UserWorkspaceAccess(Base):
    """
    Cached user workspace access from RAMPS.
    Tracks which users have access to which workspaces.
    """
    __tablename__ = "user_workspace_access"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Timestamps
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_user_workspace_access_user_id", "user_id"),
        Index("idx_user_workspace_access_workspace_id", "workspace_id"),
    )
