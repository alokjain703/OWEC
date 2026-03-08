"""Pydantic v2 schemas – NarrativeSchema (Bible Layer)"""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict


class SchemaCreate(BaseModel):
    name: str
    definition: Dict[str, Any]
    base_schema_id: Optional[uuid.UUID] = None
    is_new_version: bool = False


class SchemaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    version: int
    definition: Dict[str, Any]
    created_at: datetime


class SchemaActivate(BaseModel):
    schema_id: uuid.UUID


class MetadataValidationRequest(BaseModel):
    node_role: str
    metadata: Dict[str, Any]


class MetadataValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []
