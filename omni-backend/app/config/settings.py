"""
OMNI – Application Settings (pydantic-settings v2)
Supports LOCAL | DEV | TEST | PROD environments via .env file or env vars.
"""
from enum import StrEnum
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    LOCAL = "local"
    DEV = "dev"
    TEST = "test"
    PROD = "prod"


class StorageMode(StrEnum):
    LOCAL = "local"
    S3 = "s3"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    environment: Environment = Environment.LOCAL
    debug: bool = True

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql+asyncpg://omni:omni_secret@localhost:5483/omni_db"
    )

    # ── Storage ───────────────────────────────────────────────────────────────
    storage_mode: StorageMode = StorageMode.LOCAL
    local_storage_path: str = "./storage_data"

    # ── RAMPS Integration ─────────────────────────────────────────────────────
    RAMPS_API_URL: str = Field(
        default="http://localhost:8001/api"
    )

    # ── S3 ────────────────────────────────────────────────────────────────────
    s3_bucket: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: List[str] = ["http://localhost:4252"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PROD

    @property
    def is_testing(self) -> bool:
        return self.environment == Environment.TEST


settings = Settings()
