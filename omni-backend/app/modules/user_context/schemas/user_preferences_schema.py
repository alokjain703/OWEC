"""Pydantic schemas – UserPreferences."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class PreferenceUpdate(BaseModel):
    scope_type: str = "global"
    scope_id: Optional[str] = None
    value: Dict[str, Any] = Field(default_factory=dict)


class PreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: str
    user_id: str
    key: str
    scope_type: str
    scope_id: Optional[str]
    value: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
