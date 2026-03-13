"""CE Schema service."""
from __future__ import annotations

from app.modules.ce.models.ce_schema import CeSchema
from app.modules.ce.repositories.ce_schema_repository import CeSchemaRepository
from app.modules.ce.schemas import CeSchemaCreate, CeSchemaUpdate


class CeSchemaService:
    def __init__(self, repo: CeSchemaRepository):
        self.repo = repo

    async def list(self) -> list[CeSchema]:
        return await self.repo.list()

    async def get(self, schema_id: str) -> CeSchema:
        schema = await self.repo.get(schema_id)
        if not schema:
            raise ValueError(f"Schema {schema_id} not found")
        return schema

    async def create(self, data: CeSchemaCreate) -> CeSchema:
        schema = CeSchema(
            id=data.id,
            name=data.name,
            description=data.description,
            metadata_=data.metadata if data.metadata is not None else {},
        )
        return await self.repo.create(schema)

    async def update(self, schema_id: str, data: CeSchemaUpdate) -> CeSchema:
        schema = await self.get(schema_id)
        if data.name is not None:
            schema.name = data.name
        if data.description is not None:
            schema.description = data.description
        if data.metadata is not None:
            schema.metadata_ = data.metadata
        return schema

    async def delete(self, schema_id: str) -> None:
        schema = await self.get(schema_id)
        await self.repo.delete(schema)
