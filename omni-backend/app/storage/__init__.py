"""
Storage abstraction – returns the active StorageBackend based on STORAGE_MODE env var.
"""
from app.config.settings import settings, StorageMode
from app.storage.local_storage import LocalStorage
from app.storage.s3_storage import S3Storage


def get_storage():
    if settings.storage_mode == StorageMode.S3:
        return S3Storage(
            bucket=settings.s3_bucket,
            region=settings.aws_region,
        )
    return LocalStorage(base_path=settings.local_storage_path)
