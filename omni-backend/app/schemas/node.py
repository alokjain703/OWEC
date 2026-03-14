"""Pydantic v2 schemas – Node (Tree)"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class NodeCreate(BaseModel):
    project_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    node_role: str
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class NodeMove(BaseModel):
    new_parent_id: Optional[uuid.UUID] = None
    new_order_index: int


class NodeReorder(BaseModel):
    ordered_ids: List[uuid.UUID]  # sibling IDs in desired order


class NodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True, populate_by_name=True)

    id: uuid.UUID
    project_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    depth: int
    order_index: int
    node_role: str
    title: Optional[str]
    content: Optional[str]
    # ORM stores this as metadata_ to avoid conflict with SQLAlchemy's MetaData
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices('metadata_', 'metadata')
    )
    created_at: datetime
    updated_at: datetime
    # Don't include children by default to avoid eager loading issues
    # children: List["NodeOut"] = []
