"""Storage router – dispatches to local or S3 based on project.storage_mode."""
from __future__ import annotations

from typing import Protocol

from app.models.project import Project
from app.storage.local_storage import LocalStorage
from app.storage.s3_storage import S3Storage


class StorageBackend(Protocol):
    """Common interface for storage backends."""

    async def put(self, key: str, data: bytes) -> str: ...
    async def get(self, key: str) -> bytes: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...
    async def list(self, prefix: str = "") -> list[str]: ...


def get_storage_for_project(project: Project) -> StorageBackend:
    """
    Returns the appropriate storage backend for a project based on storage_mode.
    
    Args:
        project: Project ORM instance with storage_mode field
    
    Returns:
        LocalStorage or S3Storage instance
    
    Raises:
        ValueError: if storage_mode is unrecognized
    """
    if project.storage_mode == "local":
        return LocalStorage(base_path=f"./storage_data/{project.workspace_id}/{project.id}")
    elif project.storage_mode == "s3":
        # In production, read bucket name from project.settings or workspace config
        bucket = project.settings.get("s3_bucket", "omni-default-bucket")
        region = project.settings.get("s3_region", "us-east-1")
        return S3Storage(bucket=bucket, region=region)
    else:
        raise ValueError(f"Unknown storage_mode: {project.storage_mode}")
