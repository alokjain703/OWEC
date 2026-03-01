"""Pydantic v2 schemas – Edge (Graph)"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class EdgeCreate(BaseModel):
    project_id: uuid.UUID
    from_node: Optional[uuid.UUID] = None
    to_node: Optional[uuid.UUID] = None
    from_entity: Optional[uuid.UUID] = None
    to_entity: Optional[uuid.UUID] = None
    relation_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EdgeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    from_node: Optional[uuid.UUID]
    to_node: Optional[uuid.UUID]
    from_entity: Optional[uuid.UUID]
    to_entity: Optional[uuid.UUID]
    relation_type: str
    metadata: Dict[str, Any]
    created_at: datetime


class RelationshipPath(BaseModel):
    path: List[uuid.UUID]
    edge_types: List[str]
    length: int
