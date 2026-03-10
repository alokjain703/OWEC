"""CE Trait service."""
from app.modules.ce.models.ce_trait import CeTraitDef, CeTraitPack, CeTraitPackTrait
from app.modules.ce.repositories.ce_trait_repository import CeTraitRepository
from app.modules.ce.schemas import (
    CeTraitDefCreate,
    CeTraitDefUpdate,
    CeTraitPackCreate,
    CeTraitPackUpdate,
)


class CeTraitService:
    def __init__(self, repo: CeTraitRepository):
        self.repo = repo

    async def list_defs(self) -> list[CeTraitDef]:
        return await self.repo.list_defs()

    async def get_def(self, trait_def_id: str) -> CeTraitDef:
        trait_def = await self.repo.get_def(trait_def_id)
        if not trait_def:
            raise ValueError(f"Trait def {trait_def_id} not found")
        return trait_def

    async def create_def(self, data: CeTraitDefCreate) -> CeTraitDef:
        trait_def = CeTraitDef(
            id=data.id,
            schema_id=data.schema_id,
            trait_key=data.trait_key,
            label=data.label,
            type=data.type,
            group_name=data.group_name,
            source=data.source,
        )
        return await self.repo.create_def(trait_def)

    async def update_def(self, trait_def_id: str, data: CeTraitDefUpdate) -> CeTraitDef:
        trait_def = await self.get_def(trait_def_id)
        if data.label is not None:
            trait_def.label = data.label
        if data.type is not None:
            trait_def.type = data.type
        if data.group_name is not None:
            trait_def.group_name = data.group_name
        if data.source is not None:
            trait_def.source = data.source
        return trait_def

    async def delete_def(self, trait_def_id: str) -> None:
        trait_def = await self.get_def(trait_def_id)
        await self.repo.delete_def(trait_def)

    async def list_packs(self) -> list[CeTraitPack]:
        return await self.repo.list_packs()

    async def get_pack(self, pack_id: str) -> CeTraitPack:
        pack = await self.repo.get_pack(pack_id)
        if not pack:
            raise ValueError(f"Trait pack {pack_id} not found")
        return pack

    async def create_pack(self, data: CeTraitPackCreate) -> CeTraitPack:
        pack = CeTraitPack(
            id=data.id,
            schema_id=data.schema_id,
            name=data.name,
            description=data.description,
        )
        pack = await self.repo.create_pack(pack)
        if data.trait_def_ids:
            for trait_def_id in data.trait_def_ids:
                link = CeTraitPackTrait(pack_id=pack.id, trait_def_id=trait_def_id)
                await self.repo.add_pack_trait(link)
        return pack

    async def update_pack(self, pack_id: str, data: CeTraitPackUpdate) -> CeTraitPack:
        pack = await self.get_pack(pack_id)
        if data.name is not None:
            pack.name = data.name
        if data.description is not None:
            pack.description = data.description
        if data.trait_def_ids is not None:
            await self.repo.delete_pack_traits(pack_id)
            for trait_def_id in data.trait_def_ids:
                link = CeTraitPackTrait(pack_id=pack_id, trait_def_id=trait_def_id)
                await self.repo.add_pack_trait(link)
        return pack

    async def delete_pack(self, pack_id: str) -> None:
        pack = await self.get_pack(pack_id)
        await self.repo.delete_pack(pack)
