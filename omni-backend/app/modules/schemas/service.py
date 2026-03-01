"""
Schema Service – Bible layer CRUD, activation, metadata validation.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schema import NarrativeSchema
from app.models.project import Project
from app.schemas.schema import (
    SchemaCreate,
    MetadataValidationRequest,
    MetadataValidationResult,
)


class SchemaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_schemas(self) -> list[NarrativeSchema]:
        result = await self.db.execute(select(NarrativeSchema))
        return list(result.scalars().all())

    async def create_schema(self, data: SchemaCreate) -> NarrativeSchema:
        schema = NarrativeSchema(name=data.name, definition=data.definition)
        self.db.add(schema)
        await self.db.flush()
        await self.db.refresh(schema)
        return schema

    async def activate_for_project(
        self, project_id: uuid.UUID, schema_id: uuid.UUID
    ) -> Project:
        project = await self.db.get(Project, project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        schema = await self.db.get(NarrativeSchema, schema_id)
        if not schema:
            raise ValueError(f"Schema {schema_id} not found")
        project.active_schema_id = schema_id
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def validate_metadata(
        self,
        project_id: uuid.UUID,
        req: MetadataValidationRequest,
    ) -> MetadataValidationResult:
        """
        Validate that node metadata conforms to the project's active schema definition.
        """
        project = await self.db.get(Project, project_id)
        if not project or not project.active_schema_id:
            return MetadataValidationResult(valid=False, errors=["No active schema for project"])

        schema = await self.db.get(NarrativeSchema, project.active_schema_id)
        if not schema:
            return MetadataValidationResult(valid=False, errors=["Active schema not found"])

        defs: dict[str, Any] = (
            schema.definition.get("metadata_definitions", {}).get(req.node_role, {})
        )
        errors: list[str] = []

        # Check required fields
        for field, rules in defs.items():
            if rules.get("required") and field not in req.metadata:
                errors.append(f"Required field '{field}' missing for role '{req.node_role}'")

        # Check field types (simple type checking)
        type_map = {
            "string": str,
            "integer": int,
            "number": (int, float),
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        for field, value in req.metadata.items():
            if field in defs:
                expected_type_str = defs[field].get("type")
                if expected_type_str and expected_type_str in type_map:
                    expected_type = type_map[expected_type_str]
                    if not isinstance(value, expected_type):
                        errors.append(
                            f"Field '{field}' expected type '{expected_type_str}', got '{type(value).__name__}'"
                        )
                # Enum validation
                if "enum" in defs[field] and value not in defs[field]["enum"]:
                    errors.append(
                        f"Field '{field}' value '{value}' not in allowed values: {defs[field]['enum']}"
                    )

        return MetadataValidationResult(valid=len(errors) == 0, errors=errors)
