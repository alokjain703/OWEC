"""Pydantic schemas – UserSettings."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class UpdateSettings(BaseModel):
    scope_type: str = "global"
    scope_id: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)


class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: str
    user_id: str
    scope_type: str
    scope_id: Optional[str]
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
