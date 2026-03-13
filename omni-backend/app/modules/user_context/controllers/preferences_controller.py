"""Controller – User Preferences  (GET / PUT / DELETE /api/user-context/preferences)."""
from __future__ import annotations

from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.user_context.deps import get_user_context
from app.modules.user_context.schemas.user_preferences_schema import (
    PreferenceResponse,
    PreferenceUpdate,
)
from app.modules.user_context.services.user_preferences_service import (
    UserPreferencesService,
)

router = APIRouter(prefix="/preferences", tags=["user-context:preferences"])


def _svc(db: AsyncSession = Depends(get_db)) -> UserPreferencesService:
    return UserPreferencesService(db)


@router.get("", response_model=List[PreferenceResponse])
async def list_preferences(
    scope_type: str = Query(default="global"),
    scope_id: Optional[str] = Query(default=None),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserPreferencesService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.list_preferences(tenant_id, user_id, scope_type, scope_id)


@router.get("/{key}", response_model=PreferenceResponse)
async def get_preference(
    key: str,
    scope_type: str = Query(default="global"),
    scope_id: Optional[str] = Query(default=None),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserPreferencesService = Depends(_svc),
):
    tenant_id, user_id = ctx
    pref = await svc.get_preference(tenant_id, user_id, key, scope_type, scope_id)
    if pref is None:
        raise HTTPException(status_code=404, detail=f"Preference '{key}' not found")
    return pref


@router.put("/{key}", response_model=PreferenceResponse)
async def set_preference(
    key: str,
    payload: PreferenceUpdate,
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserPreferencesService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.set_preference(tenant_id, user_id, key, payload)


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preference(
    key: str,
    scope_type: str = Query(default="global"),
    scope_id: Optional[str] = Query(default=None),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserPreferencesService = Depends(_svc),
):
    tenant_id, user_id = ctx
    deleted = await svc.delete_preference(tenant_id, user_id, key, scope_type, scope_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Preference '{key}' not found")
