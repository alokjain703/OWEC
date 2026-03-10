"""Seed Character Engine (CE) reference data."""
from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.modules.ce.models.ce_schema import CeSchema
from app.modules.ce.models.ce_template import CeTemplate
from app.modules.ce.models.ce_trait import CeTraitDef, CeTraitPack, CeTraitPackTrait
from app.modules.ce.models.ce_entity import CeEntity, CeEntityTrait
from app.modules.ce.models.ce_relationship import CeRelationshipType, CeRelationship
from app.modules.ce.models.ce_ai_trait import CeAiTrait


SCHEMAS = [
    {"id": "character", "name": "Character", "description": "Character schema"},
    {"id": "faction", "name": "Faction", "description": "Faction schema"},
    {"id": "location", "name": "Location", "description": "Location schema"},
    {"id": "item", "name": "Item", "description": "Item schema"},
    {"id": "event", "name": "Event", "description": "Event schema"},
]

TEMPLATES = ["XS", "S", "M", "L", "XL"]

CHARACTER_TRAITS = [
    # Schema-level traits
    {"id": "character.name", "trait_key": "name", "label": "Name", "type": "string", "group": "core", "source": "schema"},
    {"id": "character.summary", "trait_key": "summary", "label": "Summary", "type": "text", "group": "core", "source": "schema"},

    # Template-level traits (group_name == template_level)
    {"id": "character.xs.age", "trait_key": "age", "label": "Age", "type": "number", "group": "XS", "source": "template"},
    {"id": "character.s.background", "trait_key": "background", "label": "Background", "type": "text", "group": "S", "source": "template"},
    {"id": "character.m.goal", "trait_key": "goal", "label": "Primary Goal", "type": "text", "group": "M", "source": "template"},
    {"id": "character.l.conflict", "trait_key": "conflict", "label": "Core Conflict", "type": "text", "group": "L", "source": "template"},
    {"id": "character.xl.arc", "trait_key": "arc", "label": "Character Arc", "type": "text", "group": "XL", "source": "template"},

    # Trait-pack traits
    {"id": "character.psychology.personality", "trait_key": "personality", "label": "Personality", "type": "text", "group": "psychology", "source": "traitPack"},
    {"id": "character.psychology.fear", "trait_key": "fear", "label": "Fear", "type": "text", "group": "psychology", "source": "traitPack"},
    {"id": "character.combat.weapon", "trait_key": "weapon", "label": "Weapon", "type": "string", "group": "combat", "source": "traitPack"},
    {"id": "character.combat.combat_style", "trait_key": "combat_style", "label": "Combat Style", "type": "string", "group": "combat", "source": "traitPack"},
    {"id": "character.magic.ability", "trait_key": "magic_ability", "label": "Magic Ability", "type": "text", "group": "magic", "source": "traitPack"},
    {"id": "character.politics.allegiance", "trait_key": "allegiance", "label": "Allegiance", "type": "string", "group": "politics", "source": "traitPack"},
    {"id": "character.relationships.bond", "trait_key": "bond", "label": "Key Bond", "type": "relationship", "group": "relationships", "source": "traitPack"},
]

TRAIT_PACKS = [
    {"id": "character.psychology", "name": "psychology", "description": "Personality and inner life"},
    {"id": "character.combat", "name": "combat", "description": "Combat profile"},
    {"id": "character.magic", "name": "magic", "description": "Magic abilities"},
    {"id": "character.politics", "name": "politics", "description": "Factional and political traits"},
    {"id": "character.relationships", "name": "relationships", "description": "Relational traits"},
]

RELATIONSHIP_TYPES = [
    {"id": "character.friend", "name": "friend", "description": "Friendly relationship"},
    {"id": "character.enemy", "name": "enemy", "description": "Hostile relationship"},
    {"id": "character.mentor", "name": "mentor", "description": "Mentorship relationship"},
    {"id": "character.member_of", "name": "member_of", "description": "Membership relationship"},
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        # Schemas
        for item in SCHEMAS:
            existing = await session.get(CeSchema, item["id"])
            if not existing:
                session.add(CeSchema(**item))

        # Templates
        for schema in SCHEMAS:
            schema_id = schema["id"]
            for idx, level in enumerate(TEMPLATES):
                template_id = f"{schema_id}.{level}"
                existing = await session.get(CeTemplate, template_id)
                if not existing:
                    inherits_from = None if idx == 0 else TEMPLATES[idx - 1]
                    session.add(
                        CeTemplate(
                            id=template_id,
                            schema_id=schema_id,
                            template_level=level,
                            inherits_from=inherits_from,
                        )
                    )

        # Trait defs (character only for seed)
        for trait in CHARACTER_TRAITS:
            existing = await session.get(CeTraitDef, trait["id"])
            if not existing:
                session.add(
                    CeTraitDef(
                        id=trait["id"],
                        schema_id="character",
                        trait_key=trait["trait_key"],
                        label=trait["label"],
                        type=trait["type"],
                        group_name=trait["group"],
                        source=trait["source"],
                    )
                )

        # Trait packs (character only for seed)
        for pack in TRAIT_PACKS:
            existing = await session.get(CeTraitPack, pack["id"])
            if not existing:
                session.add(
                    CeTraitPack(
                        id=pack["id"],
                        schema_id="character",
                        name=pack["name"],
                        description=pack["description"],
                    )
                )

        await session.flush()

        # Trait pack links
        for trait in CHARACTER_TRAITS:
            if trait["source"] != "traitPack":
                continue
            pack_id = f"character.{trait['group']}"
            result = await session.execute(
                select(CeTraitPackTrait)
                .where(CeTraitPackTrait.pack_id == pack_id)
                .where(CeTraitPackTrait.trait_def_id == trait["id"])
            )
            existing_link = result.scalars().first()
            if not existing_link:
                session.add(CeTraitPackTrait(pack_id=pack_id, trait_def_id=trait["id"]))

        # Relationship types (character only for seed)
        for rel in RELATIONSHIP_TYPES:
            existing = await session.get(CeRelationshipType, rel["id"])
            if not existing:
                session.add(
                    CeRelationshipType(
                        id=rel["id"],
                        schema_id="character",
                        name=rel["name"],
                        description=rel["description"],
                    )
                )

        await session.commit()


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
