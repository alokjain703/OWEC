"""ORM – CE Trait Groups and Trait Options."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeTraitGroup(Base):
    __tablename__ = "ce_trait_groups"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    schema_id: Mapped[str] = mapped_column(
        String, ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    schema: Mapped["CeSchema"] = relationship(back_populates="trait_groups_v2")  # type: ignore[name-defined]
    trait_defs: Mapped[list["CeTraitDef"]] = relationship(  # type: ignore[name-defined]
        back_populates="trait_group", cascade="all, delete-orphan"
    )


class CeTraitOption(Base):
    __tablename__ = "ce_trait_options"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    trait_def_id: Mapped[str] = mapped_column(
        String, ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False
    )
    value: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    trait_def: Mapped["CeTraitDef"] = relationship(back_populates="options")  # type: ignore[name-defined]
