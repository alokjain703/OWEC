"""CE trait repository."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ce.models.ce_trait import CeTraitDef, CeTraitPack, CeTraitPackTrait


class CeTraitRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_defs(self) -> list[CeTraitDef]:
        result = await self.db.execute(select(CeTraitDef))
        return list(result.scalars().all())

    async def list_defs_by_schema(self, schema_id: str) -> list[CeTraitDef]:
        result = await self.db.execute(select(CeTraitDef).where(CeTraitDef.schema_id == schema_id))
        return list(result.scalars().all())

    async def get_def(self, trait_def_id: str) -> CeTraitDef | None:
        return await self.db.get(CeTraitDef, trait_def_id)

    async def create_def(self, trait_def: CeTraitDef) -> CeTraitDef:
        self.db.add(trait_def)
        await self.db.flush()
        await self.db.refresh(trait_def)
        return trait_def

    async def delete_def(self, trait_def: CeTraitDef) -> None:
        await self.db.delete(trait_def)

    async def list_packs(self) -> list[CeTraitPack]:
        result = await self.db.execute(select(CeTraitPack))
        return list(result.scalars().all())

    async def get_pack(self, pack_id: str) -> CeTraitPack | None:
        return await self.db.get(CeTraitPack, pack_id)

    async def create_pack(self, pack: CeTraitPack) -> CeTraitPack:
        self.db.add(pack)
        await self.db.flush()
        await self.db.refresh(pack)
        return pack

    async def delete_pack(self, pack: CeTraitPack) -> None:
        await self.db.delete(pack)

    async def list_pack_traits(self, pack_id: str) -> list[CeTraitPackTrait]:
        result = await self.db.execute(select(CeTraitPackTrait).where(CeTraitPackTrait.pack_id == pack_id))
        return list(result.scalars().all())

    async def add_pack_trait(self, pack_trait: CeTraitPackTrait) -> CeTraitPackTrait:
        self.db.add(pack_trait)
        await self.db.flush()
        await self.db.refresh(pack_trait)
        return pack_trait

    async def delete_pack_traits(self, pack_id: str) -> None:
        result = await self.db.execute(select(CeTraitPackTrait).where(CeTraitPackTrait.pack_id == pack_id))
        for link in result.scalars().all():
            await self.db.delete(link)
