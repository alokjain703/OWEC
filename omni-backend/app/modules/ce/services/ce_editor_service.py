"""CE Editor Aggregation service.

Builds the full CeEditorResponse consumed by the Angular Dynamic Form Engine:

    GET /api/ce/entities/{entity_id}/editor

Logic:
  1. Load entity → get schema_id & name.
  2. Load all CeTraitGroup rows ordered by display_order.
  3. Load all CeTraitDef rows ordered by display_order.
  4. Load all CeTraitOption rows (bulk).
  5. Load all CeEntityTrait rows for the entity → value map.
  6. Build nested response: entity info → groups → traits with options + current value.
  7. Ungrouped traits (group_id == None) are collected under a synthetic "Other" group.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_entity import CeEntity, CeEntityTrait
from app.modules.ce.models.ce_trait import CeTraitDef
from app.modules.ce.models.ce_trait_group import CeTraitGroup, CeTraitOption
from app.modules.ce.schemas import (
    CeEditorEntityInfo,
    CeEditorGroupOut,
    CeEditorResponse,
    CeEditorTraitOut,
    CeTraitOptionOut,
)


class CeEditorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Public API ────────────────────────────────────────────────────────────

    async def build_editor(self, entity_id: str) -> CeEditorResponse:
        entity = await self._load_entity(entity_id)

        groups = await self._load_groups(entity.schema_id)
        trait_defs = await self._load_trait_defs(entity.schema_id)
        options_map = await self._load_options_map(trait_defs)
        values_map = await self._load_values_map(entity_id)

        return self._assemble(entity, groups, trait_defs, options_map, values_map)

    # ── Internal helpers ──────────────────────────────────────────────────────

    async def _load_entity(self, entity_id: str) -> CeEntity:
        entity = await self.db.get(CeEntity, entity_id)
        if not entity:
            raise ValueError(f"Entity {entity_id} not found")
        return entity

    async def _load_groups(self, schema_id: str) -> list[CeTraitGroup]:
        result = await self.db.execute(
            select(CeTraitGroup)
            .where(CeTraitGroup.schema_id == schema_id)
            .order_by(CeTraitGroup.display_order)
        )
        return list(result.scalars().all())

    async def _load_trait_defs(self, schema_id: str) -> list[CeTraitDef]:
        result = await self.db.execute(
            select(CeTraitDef)
            .where(CeTraitDef.schema_id == schema_id)
            .order_by(CeTraitDef.display_order)
        )
        return list(result.scalars().all())

    async def _load_options_map(
        self, trait_defs: list[CeTraitDef]
    ) -> dict[str, list[CeTraitOption]]:
        if not trait_defs:
            return {}
        ids = [td.id for td in trait_defs]
        result = await self.db.execute(
            select(CeTraitOption)
            .where(CeTraitOption.trait_def_id.in_(ids))
            .order_by(CeTraitOption.display_order)
        )
        mapping: dict[str, list[CeTraitOption]] = defaultdict(list)
        for opt in result.scalars().all():
            mapping[opt.trait_def_id].append(opt)
        return dict(mapping)

    async def _load_values_map(self, entity_id: str) -> dict[str, Any]:
        result = await self.db.execute(
            select(CeEntityTrait).where(CeEntityTrait.entity_id == entity_id)
        )
        return {et.trait_def_id: et.value for et in result.scalars().all()}

    def _assemble(
        self,
        entity: CeEntity,
        groups: list[CeTraitGroup],
        trait_defs: list[CeTraitDef],
        options_map: dict[str, list[CeTraitOption]],
        values_map: dict[str, Any],
    ) -> CeEditorResponse:
        # Build trait rows
        trait_rows: dict[str, CeEditorTraitOut] = {}
        for td in trait_defs:
            opts = [
                CeTraitOptionOut(
                    id=o.id,
                    trait_def_id=o.trait_def_id,
                    value=o.value,
                    label=o.label,
                    display_order=o.display_order,
                )
                for o in options_map.get(td.id, [])
            ]
            trait_rows[td.id] = CeEditorTraitOut(
                id=td.id,
                name=td.trait_key,
                label=td.label,
                type=td.type,
                group_id=td.group_id,
                is_required=td.is_required,
                display_order=td.display_order,
                description=td.description,
                options=opts,
                value=values_map.get(td.id),
            )

        # Bucket traits by group_id
        bucket: dict[str | None, list[CeEditorTraitOut]] = defaultdict(list)
        for trait in trait_rows.values():
            bucket[trait.group_id].append(trait)

        # Build ordered group list from real groups
        group_list: list[CeEditorGroupOut] = []
        for g in groups:
            traits_for_group = sorted(
                bucket.get(g.id, []), key=lambda t: t.display_order
            )
            group_list.append(
                CeEditorGroupOut(
                    id=g.id,
                    name=g.label or g.name,
                    display_order=g.display_order,
                    traits=traits_for_group,
                )
            )

        # Any traits without a group_id go into "Other"
        ungrouped = sorted(bucket.get(None, []), key=lambda t: t.display_order)
        if ungrouped:
            group_list.append(
                CeEditorGroupOut(
                    id=None,
                    name="Other",
                    display_order=9999,
                    traits=ungrouped,
                )
            )

        return CeEditorResponse(
            entity=CeEditorEntityInfo(
                id=entity.id,
                name=entity.name,
                schema=entity.schema_id,
            ),
            groups=group_list,
        )
