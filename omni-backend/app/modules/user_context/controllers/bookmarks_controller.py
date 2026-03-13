"""Controller – User Bookmarks  (GET / POST / DELETE /api/user-context/bookmarks)."""
from __future__ import annotations

from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.user_context.deps import get_user_context
from app.modules.user_context.schemas.user_bookmark_schema import (
    BookmarkResponse,
    CreateBookmark,
)
from app.modules.user_context.services.user_bookmark_service import UserBookmarkService

router = APIRouter(prefix="/bookmarks", tags=["user-context:bookmarks"])


def _svc(db: AsyncSession = Depends(get_db)) -> UserBookmarkService:
    return UserBookmarkService(db)


@router.get("", response_model=List[BookmarkResponse])
async def list_bookmarks(
    object_type: Optional[str] = Query(default=None),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserBookmarkService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.list_bookmarks(tenant_id, user_id, object_type)


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def add_bookmark(
    payload: CreateBookmark,
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserBookmarkService = Depends(_svc),
):
    tenant_id, user_id = ctx
    return await svc.add_bookmark(tenant_id, user_id, payload)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bookmark(
    object_type: str = Query(...),
    object_id: str = Query(...),
    ctx: Tuple[str, str] = Depends(get_user_context),
    svc: UserBookmarkService = Depends(_svc),
):
    tenant_id, user_id = ctx
    deleted = await svc.remove_bookmark(tenant_id, user_id, object_type, object_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bookmark not found")
