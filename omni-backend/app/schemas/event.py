"""Pydantic v2 schemas – Event & EventEntity (Timeline)"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TimeData(BaseModel):
    """Flexible time container supporting real, relative, and custom calendar times."""
    calendar_type: str = "gregorian"    # gregorian | custom | relative | in-world
    raw_value: Optional[str] = None     # ISO string or in-world label
    order_key: Optional[float] = None   # numeric sort key for custom calendars
    extra: Dict[str, Any] = Field(default_factory=dict)


class EventCreate(BaseModel):
    project_id: uuid.UUID
    source_node_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    time_data: TimeData


class EventEntityAttach(BaseModel):
    entity_id: uuid.UUID
    role: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EventEntityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_id: uuid.UUID
    entity_id: uuid.UUID
    role: Optional[str]
    metadata: Dict[str, Any]


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    source_node_id: Optional[uuid.UUID]
    title: str
    description: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    time_data: Dict[str, Any]
    created_at: datetime
    entities: List[EventEntityOut] = []


class ChronologyValidationResult(BaseModel):
    valid: bool
    issues: List[str] = []
