"""ORM – Edge (Graph layer: entity↔entity, node↔entity, node↔node)"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )

    # Node endpoints (optional)
    from_node: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True
    )
    to_node: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True
    )

    # Entity endpoints (optional)
    from_entity: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id", ondelete="CASCADE"), nullable=True
    )
    to_entity: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id", ondelete="CASCADE"), nullable=True
    )

    relation_type: Mapped[str] = mapped_column(String, nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="edges")  # type: ignore[name-defined]
    source_node: Mapped["Node | None"] = relationship("Node", foreign_keys=[from_node], back_populates="outgoing_edges")  # type: ignore[name-defined]
    target_node: Mapped["Node | None"] = relationship("Node", foreign_keys=[to_node], back_populates="incoming_edges")  # type: ignore[name-defined]
    source_entity: Mapped["Entity | None"] = relationship("Entity", foreign_keys=[from_entity], back_populates="outgoing_edges")  # type: ignore[name-defined]
    target_entity: Mapped["Entity | None"] = relationship("Entity", foreign_keys=[to_entity], back_populates="incoming_edges")  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_edges_project_id",  "project_id"),
        Index("idx_edges_from_node",   "from_node"),
        Index("idx_edges_to_node",     "to_node"),
        Index("idx_edges_from_entity", "from_entity"),
        Index("idx_edges_to_entity",   "to_entity"),
    )
