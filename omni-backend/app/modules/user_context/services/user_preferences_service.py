"""Service – UserPreferences."""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.user_context.models.user_preferences_model import UserPreference
from app.modules.user_context.schemas.user_preferences_schema import (
    PreferenceResponse,
    PreferenceUpdate,
)


class UserPreferencesService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_preferences(
        self,
        tenant_id: str,
        user_id: str,
        scope_type: str = "global",
        scope_id: Optional[str] = None,
    ) -> List[PreferenceResponse]:
        stmt = select(UserPreference).where(
            UserPreference.tenant_id == tenant_id,
            UserPreference.user_id == user_id,
            UserPreference.scope_type == scope_type,
            UserPreference.scope_id == scope_id,
        )
        result = await self._db.execute(stmt)
        rows = result.scalars().all()
        return [PreferenceResponse.model_validate(r) for r in rows]

    async def get_preference(
        self,
        tenant_id: str,
        user_id: str,
        key: str,
        scope_type: str = "global",
        scope_id: Optional[str] = None,
    ) -> Optional[PreferenceResponse]:
        stmt = select(UserPreference).where(
            UserPreference.tenant_id == tenant_id,
            UserPreference.user_id == user_id,
            UserPreference.key == key,
            UserPreference.scope_type == scope_type,
            UserPreference.scope_id == scope_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()
        return PreferenceResponse.model_validate(row) if row else None

    async def set_preference(
        self,
        tenant_id: str,
        user_id: str,
        key: str,
        data: PreferenceUpdate,
    ) -> PreferenceResponse:
        stmt = select(UserPreference).where(
            UserPreference.tenant_id == tenant_id,
            UserPreference.user_id == user_id,
            UserPreference.key == key,
            UserPreference.scope_type == data.scope_type,
            UserPreference.scope_id == data.scope_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            row = UserPreference(
                tenant_id=tenant_id,
                user_id=user_id,
                key=key,
                scope_type=data.scope_type,
                scope_id=data.scope_id,
                value=data.value,
            )
            self._db.add(row)
        else:
            row.value = data.value

        await self._db.commit()
        await self._db.refresh(row)
        return PreferenceResponse.model_validate(row)

    async def delete_preference(
        self,
        tenant_id: str,
        user_id: str,
        key: str,
        scope_type: str = "global",
        scope_id: Optional[str] = None,
    ) -> bool:
        stmt = select(UserPreference).where(
            UserPreference.tenant_id == tenant_id,
            UserPreference.user_id == user_id,
            UserPreference.key == key,
            UserPreference.scope_type == scope_type,
            UserPreference.scope_id == scope_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return False
        await self._db.delete(row)
        await self._db.commit()
        return True
