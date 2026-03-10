"""ORM – CE Relationships."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeRelationshipType(Base):
    __tablename__ = "ce_relationship_types"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    schema_id: Mapped[str] = mapped_column(String, ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    schema: Mapped["CeSchema"] = relationship(back_populates="relationship_types")  # type: ignore[name-defined]
    relationships: Mapped[list["CeRelationship"]] = relationship(back_populates="relationship_type", cascade="all, delete-orphan")  # type: ignore[name-defined]


class CeRelationship(Base):
    __tablename__ = "ce_relationships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_id: Mapped[str] = mapped_column(String, ForeignKey("ce_relationship_types.id", ondelete="CASCADE"), nullable=False)
    source_entity_id: Mapped[str] = mapped_column(String, ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False)
    target_entity_id: Mapped[str] = mapped_column(String, ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    relationship_type: Mapped[CeRelationshipType] = relationship(back_populates="relationships")
    source_entity: Mapped["CeEntity"] = relationship("CeEntity", foreign_keys=[source_entity_id], back_populates="outgoing")  # type: ignore[name-defined]
    target_entity: Mapped["CeEntity"] = relationship("CeEntity", foreign_keys=[target_entity_id], back_populates="incoming")  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_ce_relationships_type", "type_id"),
        Index("idx_ce_relationships_source", "source_entity_id"),
        Index("idx_ce_relationships_target", "target_entity_id"),
    )
