"""Local filesystem storage backend."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

import aiofiles


class LocalStorage:
    def __init__(self, base_path: str = "./storage_data"):
        self.base = Path(base_path)
        self.base.mkdir(parents=True, exist_ok=True)

    def _resolve(self, key: str) -> Path:
        return self.base / key

    async def put(self, key: str, data: bytes) -> str:
        path = self._resolve(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return key

    async def get(self, key: str) -> bytes:
        path = self._resolve(key)
        if not path.exists():
            raise FileNotFoundError(f"Object '{key}' not found in local storage")
        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def delete(self, key: str) -> None:
        path = self._resolve(key)
        if path.exists():
            path.unlink()

    async def exists(self, key: str) -> bool:
        return self._resolve(key).exists()

    async def list(self, prefix: str = "") -> list[str]:
        base = self.base / prefix if prefix else self.base
        if not base.exists():
            return []
        return [
            str(p.relative_to(self.base))
            for p in base.rglob("*")
            if p.is_file()
        ]
