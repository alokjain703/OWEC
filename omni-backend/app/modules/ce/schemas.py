"""Pydantic v2 schemas – Character Engine (CE)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CeSchemaBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CeSchemaCreate(CeSchemaBase):
    pass


class CeSchemaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CeSchemaOut(CeSchemaBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_")
    created_at: datetime
    updated_at: datetime


class CeTemplateBase(BaseModel):
    id: str
    schema_id: str
    template_level: str
    inherits_from: Optional[str] = None


class CeTemplateCreate(CeTemplateBase):
    pass


class CeTemplateUpdate(BaseModel):
    template_level: Optional[str] = None
    inherits_from: Optional[str] = None


class CeTemplateOut(CeTemplateBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime


class CeTraitDefBase(BaseModel):
    id: str
    schema_id: str
    trait_key: str
    label: str
    type: str
    group_name: str
    source: str
    # Dynamic-form-engine fields
    group_id: Optional[str] = None
    is_required: bool = False
    display_order: int = 0
    description: Optional[str] = None

    @property
    def name(self) -> str:
        return self.trait_key

    @property
    def value_type(self) -> str:
        return self.type


class CeTraitDefCreate(CeTraitDefBase):
    pass


class CeTraitDefUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    group_name: Optional[str] = None
    source: Optional[str] = None
    group_id: Optional[str] = None
    is_required: Optional[bool] = None
    display_order: Optional[int] = None
    description: Optional[str] = None


class CeTraitDefOut(CeTraitDefBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime


# ── Trait Groups ──────────────────────────────────────────────────────────────

class CeTraitGroupBase(BaseModel):
    id: str
    schema_id: str
    name: str
    label: Optional[str] = None
    display_order: int = 0
    description: Optional[str] = None


class CeTraitGroupCreate(CeTraitGroupBase):
    id: Optional[str] = None


class CeTraitGroupUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None
    display_order: Optional[int] = None
    description: Optional[str] = None


class CeTraitGroupOut(CeTraitGroupBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime


# ── Trait Options ─────────────────────────────────────────────────────────────

class CeTraitOptionBase(BaseModel):
    id: str
    trait_def_id: str
    value: str
    label: str
    display_order: int = 0


class CeTraitOptionCreate(CeTraitOptionBase):
    id: Optional[str] = None


class CeTraitOptionUpdate(BaseModel):
    value: Optional[str] = None
    label: Optional[str] = None
    display_order: Optional[int] = None


class CeTraitOptionOut(CeTraitOptionBase):
    model_config = ConfigDict(from_attributes=True)


class CeTraitPackBase(BaseModel):
    id: str
    schema_id: str
    name: str
    description: Optional[str] = None


class CeTraitPackCreate(CeTraitPackBase):
    id: Optional[str] = None
    trait_def_ids: list[str] = Field(default_factory=list)


class CeTraitPackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trait_def_ids: Optional[list[str]] = None


class CeTraitPackOut(CeTraitPackBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime


class CeEntityBase(BaseModel):
    id: str
    schema_id: str
    template_level: str
    name: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CeEntityCreate(CeEntityBase):
    pass


class CeEntityUpdate(BaseModel):
    template_level: Optional[str] = None
    name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CeEntityOut(CeEntityBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    metadata: Dict[str, Any] = Field(default_factory=dict, alias="metadata_")
    created_at: datetime
    updated_at: datetime


class CeEntityTraitValue(BaseModel):
    trait_def_id: str
    value: Any


class CeEntityTraitsPut(BaseModel):
    values: list[CeEntityTraitValue]


class CeEntityTraitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    entity_id: str
    trait_def_id: str
    value: Any
    created_at: datetime
    updated_at: datetime


class CeRelationshipTypeBase(BaseModel):
    id: str
    schema_id: str
    name: str
    description: Optional[str] = None


class CeRelationshipTypeCreate(BaseModel):
    id: Optional[str] = None
    schema_id: str
    name: str
    description: Optional[str] = None


class CeRelationshipTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CeRelationshipTypeOut(CeRelationshipTypeBase):
    model_config = ConfigDict(from_attributes=True)


class CeRelationshipBase(BaseModel):
    id: Optional[str] = None
    type_id: str
    source_entity_id: str
    target_entity_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CeRelationshipCreate(CeRelationshipBase):
    pass


class CeRelationshipUpdate(BaseModel):
    type_id: Optional[str] = None
    source_entity_id: Optional[str] = None
    target_entity_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CeRelationshipOut(CeRelationshipBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    metadata: Dict[str, Any] = Field(default_factory=dict, alias="metadata_")
    id: UUID
    created_at: datetime


class CeAiTraitCreate(BaseModel):
    entity_id: str
    trait_def_id: str
    value: Any
    confidence: float = 0.0
    generated_by: str = "ce-ai"


class CeAiTraitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    entity_id: str
    trait_def_id: str
    value: Any
    confidence: float
    generated_by: str
    created_at: datetime


class CeResolvedTrait(BaseModel):
    trait_def_id: str
    trait_key: str
    label: str
    type: str
    group_name: str
    source: str
    value: Optional[Dict[str, Any]] = None


class CeGraphNode(BaseModel):
    id: str
    label: str
    type: str


class CeGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str


class CeGraphOut(BaseModel):
    nodes: list[CeGraphNode]
    edges: list[CeGraphEdge]


class CeAiRequest(BaseModel):
    entityId: str


# ── Editor Aggregation Response ───────────────────────────────────────────────

class CeEditorTraitOut(BaseModel):
    """A single field in the dynamic editor, with its current value."""
    id: str
    name: str           # trait_key
    label: str
    type: str           # value_type
    group_id: Optional[str] = None
    is_required: bool = False
    display_order: int = 0
    description: Optional[str] = None
    options: list["CeTraitOptionOut"] = Field(default_factory=list)
    value: Optional[Any] = None


class CeEditorGroupOut(BaseModel):
    """A group of traits for the dynamic editor."""
    id: Optional[str] = None
    name: str
    display_order: int = 0
    traits: list[CeEditorTraitOut] = Field(default_factory=list)


class CeEditorEntityInfo(BaseModel):
    id: str
    name: str
    schema: str


class CeEditorResponse(BaseModel):
    """Full payload for the Angular Dynamic Form Engine."""
    entity: CeEditorEntityInfo
    groups: list[CeEditorGroupOut]


# ── Entity creation with optional trait-pack pre-load ────────────────────────

class CeEntityWithTraitPackCreate(BaseModel):
    """Simplified entity creation accepted by POST /api/ce/entities/create."""
    name: str
    schema: str                      # schema id or name
    trait_pack: Optional[str] = None  # trait pack id (optional)
    description: Optional[str] = None
