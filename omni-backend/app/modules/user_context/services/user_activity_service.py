"""Service – UserActivity."""
from __future__ import annotations

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.user_context.models.user_activity_model import UserActivity
from app.modules.user_context.schemas.user_activity_schema import (
    ActivityResponse,
    CreateActivity,
)


class UserActivityService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def record(
        self,
        tenant_id: str,
        user_id: str,
        data: CreateActivity,
    ) -> ActivityResponse:
        row = UserActivity(
            tenant_id=tenant_id,
            user_id=user_id,
            object_type=data.object_type,
            object_id=data.object_id,
            action=data.action,
            metadata_=data.metadata,
        )
        self._db.add(row)
        await self._db.commit()
        await self._db.refresh(row)
        return ActivityResponse.model_validate(row)

    async def get_recent(
        self,
        tenant_id: str,
        user_id: str,
        object_type: str | None = None,
        limit: int = 20,
    ) -> List[ActivityResponse]:
        stmt = (
            select(UserActivity)
            .where(
                UserActivity.tenant_id == tenant_id,
                UserActivity.user_id == user_id,
            )
            .order_by(UserActivity.created_at.desc())
            .limit(limit)
        )
        if object_type:
            stmt = stmt.where(UserActivity.object_type == object_type)
        result = await self._db.execute(stmt)
        rows = result.scalars().all()
        return [ActivityResponse.model_validate(r) for r in rows]
