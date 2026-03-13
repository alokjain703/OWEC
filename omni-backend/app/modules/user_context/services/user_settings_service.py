"""Service – UserSettings."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.user_context.models.user_settings_model import UserSettings
from app.modules.user_context.schemas.user_settings_schema import (
    SettingsResponse,
    UpdateSettings,
)


class UserSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_settings(
        self,
        tenant_id: str,
        user_id: str,
        scope_type: str = "global",
        scope_id: Optional[str] = None,
    ) -> Optional[SettingsResponse]:
        stmt = select(UserSettings).where(
            UserSettings.tenant_id == tenant_id,
            UserSettings.user_id == user_id,
            UserSettings.scope_type == scope_type,
            UserSettings.scope_id == scope_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()
        return SettingsResponse.model_validate(row) if row else None

    async def upsert_settings(
        self,
        tenant_id: str,
        user_id: str,
        data: UpdateSettings,
    ) -> SettingsResponse:
        stmt = select(UserSettings).where(
            UserSettings.tenant_id == tenant_id,
            UserSettings.user_id == user_id,
            UserSettings.scope_type == data.scope_type,
            UserSettings.scope_id == data.scope_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            row = UserSettings(
                tenant_id=tenant_id,
                user_id=user_id,
                scope_type=data.scope_type,
                scope_id=data.scope_id,
                settings=data.settings,
            )
            self._db.add(row)
        else:
            row.settings = {**row.settings, **data.settings}

        await self._db.commit()
        await self._db.refresh(row)
        return SettingsResponse.model_validate(row)
