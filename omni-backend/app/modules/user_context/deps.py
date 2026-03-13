"""Shared FastAPI dependencies for the user_context module."""
from __future__ import annotations

import logging
from typing import Tuple

import jwt
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)


def get_user_context(
    authorization: str = Header(...),
    x_tenant_id: str = Header(default="default", alias="X-Tenant-Id"),
) -> Tuple[str, str]:
    """Return (tenant_id, user_id) extracted from the JWT Authorization header.

    Falls back to ``X-Tenant-Id`` header for tenant and ``sub`` claim for user.
    """
    try:
        token = authorization.removeprefix("Bearer ").strip()
        payload = jwt.decode(token, options={"verify_signature": False})

        user_id: str | None = (
            payload.get("sub")
            or payload.get("user_id")
            or payload.get("id")
        )
        if not user_id:
            raise HTTPException(status_code=401, detail="No user_id found in token")

        tenant_id: str = (
            payload.get("tenant_id")
            or payload.get("org_id")
            or x_tenant_id
            or "default"
        )
        return tenant_id, user_id
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to extract user context from token: %s", exc)
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
