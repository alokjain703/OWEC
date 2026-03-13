"""Controller – User Activity  (POST / GET /api/user-context/activity)."""
from __future__ import annotations

from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.user_context.deps import get_user_context
from app.modules.user_context.schemas.user_activity_schema import (
    ActivityResponse,
    CreateActivity,
)
from app.modules.user_context.services.user_activity_service import UserActivityService

router = APIRouter(prefix="/activity", tags=["user-context:activity"])


def _svc(db: AsyncSession = Depends(get_db)) -> UserActivityService:
    return UserActivityService(db)


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def record_activity(
    payload: CreateActivity,
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserActivityService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.record(tenant_id, user_id, payload)


@router.get("/recent", response_model=List[ActivityResponse])
async def get_recent_activity(
    object_type: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserActivityService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.get_recent(tenant_id, user_id, object_type, limit)
