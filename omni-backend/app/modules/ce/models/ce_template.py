"""ORM – CE Template."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CeTemplate(Base):
    __tablename__ = "ce_templates"
    __table_args__ = (
        UniqueConstraint("schema_id", "template_level", name="uq_ce_templates_schema_level"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    schema_id: Mapped[str] = mapped_column(String, ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False)
    template_level: Mapped[str] = mapped_column(String, nullable=False)
    inherits_from: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    schema: Mapped["CeSchema"] = relationship(back_populates="templates")  # type: ignore[name-defined]
