"""Service – UserBookmarks."""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.user_context.models.user_bookmarks_model import UserBookmark
from app.modules.user_context.schemas.user_bookmark_schema import (
    BookmarkResponse,
    CreateBookmark,
)


class UserBookmarkService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_bookmarks(
        self,
        tenant_id: str,
        user_id: str,
        object_type: Optional[str] = None,
    ) -> List[BookmarkResponse]:
        stmt = (
            select(UserBookmark)
            .where(
                UserBookmark.tenant_id == tenant_id,
                UserBookmark.user_id == user_id,
            )
            .order_by(UserBookmark.created_at.desc())
        )
        if object_type:
            stmt = stmt.where(UserBookmark.object_type == object_type)
        result = await self._db.execute(stmt)
        rows = result.scalars().all()
        return [BookmarkResponse.model_validate(r) for r in rows]

    async def add_bookmark(
        self,
        tenant_id: str,
        user_id: str,
        data: CreateBookmark,
    ) -> BookmarkResponse:
        # idempotent – return existing if already bookmarked
        stmt = select(UserBookmark).where(
            UserBookmark.tenant_id == tenant_id,
            UserBookmark.user_id == user_id,
            UserBookmark.object_type == data.object_type,
            UserBookmark.object_id == data.object_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            row = UserBookmark(
                tenant_id=tenant_id,
                user_id=user_id,
                object_type=data.object_type,
                object_id=data.object_id,
                metadata_=data.metadata,
            )
            self._db.add(row)
            await self._db.commit()
            await self._db.refresh(row)

        return BookmarkResponse.model_validate(row)

    async def remove_bookmark(
        self,
        tenant_id: str,
        user_id: str,
        object_type: str,
        object_id: str,
    ) -> bool:
        stmt = select(UserBookmark).where(
            UserBookmark.tenant_id == tenant_id,
            UserBookmark.user_id == user_id,
            UserBookmark.object_type == object_type,
            UserBookmark.object_id == object_id,
        )
        result = await self._db.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return False
        await self._db.delete(row)
        await self._db.commit()
        return True
