"""ORM – UserSettings.

Stores user configuration such as theme, layout, and UI settings.
Keyed by (tenant_id, user_id, scope_type, scope_id).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)

    # Scope: global | project | workspace
    scope_type: Mapped[str] = mapped_column(String, nullable=False, default="global")
    scope_id: Mapped[str | None] = mapped_column(String, nullable=True)

    settings: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_user_settings_lookup", "tenant_id", "user_id", "scope_type", "scope_id"),
    )
