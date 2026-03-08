"""
Schema Service – Bible layer CRUD, activation, metadata validation.
"""
from __future__ import annotations

import uuid
from typing import Any, Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

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
        result = await self.db.execute(
            select(NarrativeSchema).order_by(NarrativeSchema.name, NarrativeSchema.version.desc())
        )
        return list(result.scalars().all())

    async def get_highest_version(self, name: str) -> int:
        """Get the highest version number for a given schema name."""
        result = await self.db.execute(
            select(func.max(NarrativeSchema.version))
            .where(NarrativeSchema.name == name)
        )
        max_version = result.scalar()
        return max_version if max_version is not None else 0

    async def schema_exists(self, name: str, version: int) -> bool:
        """Check if a schema with the given name and version already exists."""
        result = await self.db.execute(
            select(NarrativeSchema).where(
                and_(
                    NarrativeSchema.name == name,
                    NarrativeSchema.version == version
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def create_schema(self, data: SchemaCreate, base_schema_id: Optional[uuid.UUID] = None, is_new_version: bool = False) -> NarrativeSchema:
        """
        Create a new schema or new version of an existing schema.
        
        Args:
            data: Schema data with name and definition
            base_schema_id: If provided, use this schema's name for versioning
            is_new_version: If True, increment version of existing schema name
        """
        # Determine the name and version
        if base_schema_id:
            # Load base schema to get its name
            base_schema = await self.db.get(NarrativeSchema, base_schema_id)
            if base_schema:
                name = base_schema.name
                if is_new_version:
                    # Create new version of the existing schema
                    highest_version = await self.get_highest_version(name)
                    version = highest_version + 1
                else:
                    # Use as template with new name
                    name = data.name
                    version = 1
            else:
                # Base schema not found, treat as new
                name = data.name
                version = 1
        else:
            # Completely new schema or editing existing one
            name = data.name
            if is_new_version:
                # Creating new version of existing schema
                highest_version = await self.get_highest_version(name)
                version = highest_version + 1
            else:
                # Check if this is truly new or should be version 1
                existing_version = await self.get_highest_version(name)
                if existing_version > 0:
                    # Schema name already exists, create new version
                    version = existing_version + 1
                else:
                    version = 1
        
        # Check for uniqueness
        if await self.schema_exists(name, version):
            raise ValueError(f"Schema '{name}' version {version} already exists")
        
        schema = NarrativeSchema(name=name, version=version, definition=data.definition)
        self.db.add(schema)
        try:
            await self.db.flush()
            await self.db.refresh(schema)
        except IntegrityError:
            await self.db.rollback()
            raise ValueError(f"Schema '{name}' version {version} already exists")
        
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
