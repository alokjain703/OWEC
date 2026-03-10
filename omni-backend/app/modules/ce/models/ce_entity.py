"""ORM – CE Entities and Traits."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeEntity(Base):
    __tablename__ = "ce_entities"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    schema_id: Mapped[str] = mapped_column(String, ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False)
    template_level: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    schema: Mapped["CeSchema"] = relationship(back_populates="entities")  # type: ignore[name-defined]
    traits: Mapped[list["CeEntityTrait"]] = relationship(back_populates="entity", cascade="all, delete-orphan")  # type: ignore[name-defined]
    outgoing: Mapped[list["CeRelationship"]] = relationship("CeRelationship", foreign_keys="CeRelationship.source_entity_id", back_populates="source_entity")  # type: ignore[name-defined]
    incoming: Mapped[list["CeRelationship"]] = relationship("CeRelationship", foreign_keys="CeRelationship.target_entity_id", back_populates="target_entity")  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_ce_entities_schema", "schema_id"),
    )


class CeEntityTrait(Base):
    __tablename__ = "ce_entity_traits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[str] = mapped_column(String, ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False)
    trait_def_id: Mapped[str] = mapped_column(String, ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False)
    value: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    entity: Mapped[CeEntity] = relationship(back_populates="traits")
    trait_def: Mapped["CeTraitDef"] = relationship(back_populates="entity_values")  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_ce_entity_traits_entity", "entity_id"),
        Index("uq_ce_entity_traits_entity_trait", "entity_id", "trait_def_id", unique=True),
    )
