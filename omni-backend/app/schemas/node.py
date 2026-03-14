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
    content_format: str = "html"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    # Optional explicit ordering — if omitted service appends at end
    order_key: Optional[float] = None


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_format: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class NodeMove(BaseModel):
    new_parent_id: Optional[uuid.UUID] = None
    new_order_key: Optional[float] = None  # fractional position; computed server-side if omitted


class NodeReorder(BaseModel):
    ordered_ids: List[uuid.UUID]  # sibling IDs in desired order


class NodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True, populate_by_name=True)

    id: uuid.UUID
    project_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    depth: int
    order_index: int
    order_key: Optional[float]
    node_role: str
    title: Optional[str]
    content: Optional[str]
    content_format: str
    path: Optional[str]
    has_children: bool
    # ORM stores this as metadata_ to avoid conflict with SQLAlchemy's MetaData
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices('metadata_', 'metadata')
    )
    created_at: datetime
    updated_at: datetime
    # Don't include children by default to avoid eager loading issues
    # children: List["NodeOut"] = []


class NodeDuplicate(BaseModel):
    """Payload for duplicating a node (and optionally its subtree)."""
    include_children: bool = False


class NodeSplit(BaseModel):
    """
    Create a new sibling node immediately after the target node.
    Used for 'Insert Below' via API, and for the editorial 'Split' action.
    """
    title: Optional[str] = None
    content: Optional[str] = None      # content for the new node (split-off portion)
    node_role: Optional[str] = None    # defaults to same role as the source node


class NodeMerge(BaseModel):
    """Merge a node into its previous sibling (appends content, deletes this node)."""
    pass
