"""Pydantic v2 schemas – Project"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    owner_id: uuid.UUID
    title: str
    active_schema_id: Optional[uuid.UUID] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    active_schema_id: Optional[uuid.UUID] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    active_schema_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
