"""ORM – Project"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    active_schema_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schemas.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    nodes: Mapped[list["Node"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
    entities: Mapped[list["Entity"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
    events: Mapped[list["Event"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
    edges: Mapped[list["Edge"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]
