"""Pydantic v2 schemas – Entity"""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class EntityCreate(BaseModel):
    project_id: uuid.UUID
    entity_type: str
    name: str
    description: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    state: Dict[str, Any] = Field(default_factory=dict)


class EntityUpdateAttributes(BaseModel):
    attributes: Dict[str, Any]


class EntityUpdateState(BaseModel):
    state: Dict[str, Any]


class EntityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    entity_type: str
    name: str
    description: Optional[str]
    attributes: Dict[str, Any]
    state: Dict[str, Any]
    created_at: datetime
