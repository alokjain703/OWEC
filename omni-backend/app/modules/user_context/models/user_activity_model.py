"""ORM – UserActivity.

Records user interactions such as viewing or editing objects.
Generic: uses object_type + object_id rather than engine-specific FKs.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserActivity(Base):
    __tablename__ = "user_activity"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)

    # Generic object reference – no FK to CE or other engines
    object_type: Mapped[str] = mapped_column(String, nullable=False)
    object_id: Mapped[str] = mapped_column(String, nullable=False)

    # Action: viewed | edited | created | deleted | …
    action: Mapped[str] = mapped_column(String, nullable=False)

    # Flexible metadata: e.g. {"source": "graph"}
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, server_default="{}"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_user_activity_user", "tenant_id", "user_id"),
        Index("ix_user_activity_recent", "user_id", "created_at"),
        Index("ix_user_activity_object", "object_type", "object_id"),
    )
