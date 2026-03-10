"""ORM – CE Schema."""
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeSchema(Base):
    __tablename__ = "ce_schemas"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    templates: Mapped[list["CeTemplate"]] = relationship(back_populates="schema", cascade="all, delete-orphan")  # type: ignore[name-defined]
    trait_defs: Mapped[list["CeTraitDef"]] = relationship(back_populates="schema", cascade="all, delete-orphan")  # type: ignore[name-defined]
    trait_packs: Mapped[list["CeTraitPack"]] = relationship(back_populates="schema", cascade="all, delete-orphan")  # type: ignore[name-defined]
    entities: Mapped[list["CeEntity"]] = relationship(back_populates="schema", cascade="all, delete-orphan")  # type: ignore[name-defined]
    relationship_types: Mapped[list["CeRelationshipType"]] = relationship(back_populates="schema", cascade="all, delete-orphan")  # type: ignore[name-defined]
