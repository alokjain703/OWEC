"""CE Trait Resolver service."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_entity import CeEntity, CeEntityTrait
from app.modules.ce.models.ce_template import CeTemplate
from app.modules.ce.models.ce_trait import CeTraitDef, CeTraitPackTrait


class CeTraitResolverService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def resolve_traits(self, entity_id: str) -> list[dict]:
        entity = await self.db.get(CeEntity, entity_id)
        if not entity:
            raise ValueError(f"Entity {entity_id} not found")

        template_levels = await self._resolve_template_chain(entity.schema_id, entity.template_level)
        pack_ids = self._get_trait_pack_ids(entity)
        trait_defs = await self._load_trait_defs(entity.schema_id, template_levels, pack_ids)
        trait_values = await self._load_entity_trait_values(entity_id)

        resolved: list[dict] = []
        for trait_def in trait_defs:
            value = trait_values.get(trait_def.id)
            resolved.append({
                "trait_def_id": trait_def.id,
                "trait_key": trait_def.trait_key,
                "label": trait_def.label,
                "type": trait_def.type,
                "group_name": trait_def.group_name,
                "source": trait_def.source,
                "value": value,
            })
        return resolved

    async def _resolve_template_chain(self, schema_id: str, template_level: str) -> list[str]:
        result = await self.db.execute(select(CeTemplate).where(CeTemplate.schema_id == schema_id))
        templates = list(result.scalars().all())
        by_level = {t.template_level: t for t in templates}

        chain: list[str] = []
        current = template_level
        while current:
            chain.append(current)
            template = by_level.get(current)
            if not template or not template.inherits_from:
                break
            current = template.inherits_from
        return chain

    async def _load_trait_defs(
        self,
        schema_id: str,
        template_levels: list[str],
        pack_ids: list[str],
    ) -> list[CeTraitDef]:
        result = await self.db.execute(select(CeTraitDef).where(CeTraitDef.schema_id == schema_id))
        trait_defs = list(result.scalars().all())

        # Include schema-level traits
        included = [t for t in trait_defs if t.source == "schema"]

        # Include template traits where group_name matches template level
        included += [t for t in trait_defs if t.source == "template" and t.group_name in template_levels]

        # Include trait-pack traits based on entity metadata
        if pack_ids:
            result = await self.db.execute(
                select(CeTraitDef)
                .join(CeTraitPackTrait, CeTraitPackTrait.trait_def_id == CeTraitDef.id)
                .where(CeTraitPackTrait.pack_id.in_(pack_ids))
            )
            included += list(result.scalars().all())

        # De-duplicate by trait_def id
        unique: dict[str, CeTraitDef] = {t.id: t for t in included}
        return list(unique.values())

    async def _load_entity_trait_values(self, entity_id: str) -> dict:
        result = await self.db.execute(select(CeEntityTrait).where(CeEntityTrait.entity_id == entity_id))
        traits = list(result.scalars().all())
        return {t.trait_def_id: t.value for t in traits}

    def _get_trait_pack_ids(self, entity: CeEntity) -> list[str]:
        packs = entity.metadata_.get("trait_packs", []) if entity.metadata_ else []
        return [p for p in packs if isinstance(p, str)]
