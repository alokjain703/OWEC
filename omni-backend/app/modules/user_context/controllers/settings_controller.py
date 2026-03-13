"""Controller – User Settings  (GET / PUT /api/user-context/settings)."""
from __future__ import annotations

from typing import Optional, Tuple

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.user_context.deps import get_user_context
from app.modules.user_context.schemas.user_settings_schema import (
    SettingsResponse,
    UpdateSettings,
)
from app.modules.user_context.services.user_settings_service import UserSettingsService

router = APIRouter(prefix="/settings", tags=["user-context:settings"])


def _svc(db: AsyncSession = Depends(get_db)) -> UserSettingsService:
    return UserSettingsService(db)


@router.get("", response_model=Optional[SettingsResponse])
async def get_settings(
    scope_type: str = Query(default="global"),
    scope_id: Optional[str] = Query(default=None),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserSettingsService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.get_settings(tenant_id, user_id, scope_type, scope_id)


@router.put("", response_model=SettingsResponse, status_code=status.HTTP_200_OK)
async def upsert_settings(
    payload: UpdateSettings,
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserSettingsService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.upsert_settings(tenant_id, user_id, payload)
