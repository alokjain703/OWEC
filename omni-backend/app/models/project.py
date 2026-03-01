"""ORM – Project (workspace-scoped)"""
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ── Ownership ─────────────────────────────────────────────────────────────
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    # ── Core fields ───────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Status / visibility ───────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    visibility: Mapped[str] = mapped_column(String(16), nullable=False, default="private")
    storage_mode: Mapped[str] = mapped_column(String(16), nullable=False, default="local")

    # ── Schema link ───────────────────────────────────────────────────────────
    active_schema_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schemas.id", ondelete="SET NULL"), nullable=True
    )

    # ── Flexible metadata ─────────────────────────────────────────────────────
    settings: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    workspace: Mapped["Workspace"] = relationship(back_populates="projects")  # type: ignore[name-defined]
    nodes: Mapped[list["Node"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
    entities: Mapped[list["Entity"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
    events: Mapped[list["Event"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
    edges: Mapped[list["Edge"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("status IN ('active','archived','deleted')", name="ck_project_status"),
        CheckConstraint("visibility IN ('private','workspace','public')", name="ck_project_visibility"),
        CheckConstraint("storage_mode IN ('local','s3')", name="ck_project_storage_mode"),
        Index("idx_project_workspace_id", "workspace_id"),
        Index("idx_project_created_by", "created_by"),
    )
