"""Pydantic schemas – UserBookmark."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class CreateBookmark(BaseModel):
    object_type: str
    object_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DeleteBookmark(BaseModel):
    object_type: str
    object_id: str


class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    tenant_id: str
    user_id: str
    object_type: str
    object_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_")
    created_at: datetime
