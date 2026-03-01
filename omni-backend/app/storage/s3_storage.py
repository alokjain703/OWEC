"""AWS S3 storage backend (async wrapper via run_in_executor)."""
from __future__ import annotations

import asyncio
from functools import partial
from typing import Any

import boto3
from botocore.exceptions import ClientError


class S3Storage:
    def __init__(self, bucket: str, region: str = "us-east-1"):
        self.bucket = bucket
        self._client = boto3.client("s3", region_name=region)
        self._loop = asyncio.get_event_loop

    async def _run(self, fn, *args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, partial(fn, *args, **kwargs))

    async def put(self, key: str, data: bytes) -> str:
        await self._run(
            self._client.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=data,
        )
        return key

    async def get(self, key: str) -> bytes:
        try:
            response = await self._run(
                self._client.get_object,
                Bucket=self.bucket,
                Key=key,
            )
            return response["Body"].read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                raise FileNotFoundError(f"Object '{key}' not found in S3 bucket '{self.bucket}'")
            raise

    async def delete(self, key: str) -> None:
        await self._run(
            self._client.delete_object,
            Bucket=self.bucket,
            Key=key,
        )

    async def exists(self, key: str) -> bool:
        try:
            await self._run(self._client.head_object, Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False

    async def list(self, prefix: str = "") -> list[str]:
        response = await self._run(
            self._client.list_objects_v2,
            Bucket=self.bucket,
            Prefix=prefix,
        )
        contents = response.get("Contents", [])
        return [obj["Key"] for obj in contents]
