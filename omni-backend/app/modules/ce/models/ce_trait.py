"""ORM – CE Trait Definitions and Packs."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeTraitDef(Base):
    __tablename__ = "ce_trait_defs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    schema_id: Mapped[str] = mapped_column(String, ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False)
    trait_key: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    group_name: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    schema: Mapped["CeSchema"] = relationship(back_populates="trait_defs")  # type: ignore[name-defined]
    pack_links: Mapped[list["CeTraitPackTrait"]] = relationship(back_populates="trait_def", cascade="all, delete-orphan")  # type: ignore[name-defined]
    entity_values: Mapped[list["CeEntityTrait"]] = relationship(back_populates="trait_def", cascade="all, delete-orphan")  # type: ignore[name-defined]


class CeTraitPack(Base):
    __tablename__ = "ce_trait_packs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    schema_id: Mapped[str] = mapped_column(String, ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    schema: Mapped["CeSchema"] = relationship(back_populates="trait_packs")  # type: ignore[name-defined]
    traits: Mapped[list["CeTraitPackTrait"]] = relationship(back_populates="pack", cascade="all, delete-orphan")  # type: ignore[name-defined]


class CeTraitPackTrait(Base):
    __tablename__ = "ce_trait_pack_traits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pack_id: Mapped[str] = mapped_column(String, ForeignKey("ce_trait_packs.id", ondelete="CASCADE"), nullable=False)
    trait_def_id: Mapped[str] = mapped_column(String, ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False)

    pack: Mapped[CeTraitPack] = relationship(back_populates="traits")
    trait_def: Mapped[CeTraitDef] = relationship(back_populates="pack_links")
