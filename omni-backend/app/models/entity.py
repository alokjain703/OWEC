"""ORM – Entity (Characters, Factions, Items – tree-independent)"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )

    entity_type: Mapped[str] = mapped_column(String, nullable=False)  # character|faction|item|…
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    attributes: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    state: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="entities")  # type: ignore[name-defined]
    event_links: Mapped[list["EventEntity"]] = relationship(back_populates="entity", cascade="all, delete-orphan")  # type: ignore[name-defined]
    outgoing_edges: Mapped[list["Edge"]] = relationship("Edge", foreign_keys="Edge.from_entity", back_populates="source_entity")  # type: ignore[name-defined]
    incoming_edges: Mapped[list["Edge"]] = relationship("Edge", foreign_keys="Edge.to_entity", back_populates="target_entity")  # type: ignore[name-defined]
