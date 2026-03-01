"""ORM – Workspace and WorkspaceMember"""
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    type: Mapped[str] = mapped_column(
        String(32), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    subscription_tier: Mapped[str] = mapped_column(
        String(32), nullable=False, default="free"
    )
    storage_quota_mb: Mapped[int] = mapped_column(Integer, nullable=False, default=1024)
    project_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    settings: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    members: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    projects: Mapped[list["Project"]] = relationship(  # type: ignore[name-defined]
        back_populates="workspace", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("type IN ('personal','organization','enterprise')", name="ck_workspace_type"),
        Index("idx_workspace_owner", "owner_user_id"),
    )


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, nullable=False
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)

    # Relationship
    workspace: Mapped["Workspace"] = relationship(back_populates="members")

    __table_args__ = (
        CheckConstraint("role IN ('owner','admin','editor','viewer')", name="ck_member_role"),
        Index("idx_workspace_member_user", "user_id"),
    )
