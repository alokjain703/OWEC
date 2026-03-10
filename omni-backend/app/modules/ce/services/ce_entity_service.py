"""CE Entity service."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_entity import CeEntity, CeEntityTrait
from app.modules.ce.repositories.ce_entity_repository import CeEntityRepository
from app.modules.ce.schemas import CeEntityCreate, CeEntityUpdate, CeEntityTraitsPut
from app.modules.ce.services.ce_trait_resolver_service import CeTraitResolverService


class CeEntityService:
    def __init__(self, repo: CeEntityRepository, db: AsyncSession):
        self.repo = repo
        self.db = db
        self.trait_resolver = CeTraitResolverService(db)

    async def list(self) -> list[CeEntity]:
        return await self.repo.list()

    async def get(self, entity_id: str) -> CeEntity:
        entity = await self.repo.get(entity_id)
        if not entity:
            raise ValueError(f"Entity {entity_id} not found")
        return entity

    async def create(self, data: CeEntityCreate) -> CeEntity:
        entity = CeEntity(
            id=data.id,
            schema_id=data.schema_id,
            template_level=data.template_level,
            name=data.name,
            metadata_=data.metadata,
        )
        return await self.repo.create(entity)

    async def update(self, entity_id: str, data: CeEntityUpdate) -> CeEntity:
        entity = await self.get(entity_id)
        if data.template_level is not None:
            entity.template_level = data.template_level
        if data.name is not None:
            entity.name = data.name
        if data.metadata is not None:
            entity.metadata_ = data.metadata
        return entity

    async def delete(self, entity_id: str) -> None:
        entity = await self.get(entity_id)
        await self.repo.delete(entity)

    async def list_traits(self, entity_id: str) -> list[CeEntityTrait]:
        await self.get(entity_id)
        return await self.repo.list_traits(entity_id)

    async def put_traits(self, entity_id: str, data: CeEntityTraitsPut) -> list[CeEntityTrait]:
        await self.get(entity_id)
        result: list[CeEntityTrait] = []
        for item in data.values:
            existing = await self.repo.get_trait(entity_id, item.trait_def_id)
            if existing:
                existing.value = item.value
                result.append(existing)
            else:
                trait = CeEntityTrait(entity_id=entity_id, trait_def_id=item.trait_def_id, value=item.value)
                result.append(await self.repo.create_trait(trait))
        return result

    async def resolve_traits(self, entity_id: str) -> list[dict]:
        return await self.trait_resolver.resolve_traits(entity_id)
