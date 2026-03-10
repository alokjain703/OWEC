"""ORM – CE AI Trait Suggestions."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Float, func, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeAiTrait(Base):
    __tablename__ = "ce_ai_traits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[str] = mapped_column(String, ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False)
    trait_def_id: Mapped[str] = mapped_column(String, ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False)
    value: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    generated_by: Mapped[str] = mapped_column(String, nullable=False, default="ce-ai")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entity: Mapped["CeEntity"] = relationship()  # type: ignore[name-defined]
    trait_def: Mapped["CeTraitDef"] = relationship()  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_ce_ai_traits_entity", "entity_id"),
    )
