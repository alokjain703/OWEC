"""FastAPI dependencies – role-based authorization.

Usage in a controller:
    from app.api.dependencies import require_role

    @router.post("")
    async def create(
        payload: ...,
        _: None = Depends(require_role("sc-acct-mgr")),
    ): ...
"""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

# ── CE Admin roles ────────────────────────────────────────────────────────────
CE_ADMIN_ROLES: set[str] = {"sc-mgr", "sc-acct-mgr"}
CE_SCHEMA_ADMIN_ROLES: set[str] = {"sc-acct-mgr"}


def _current_roles(x_user_roles: str = Header(default="")) -> list[str]:
    """Extract roles from the X-User-Roles header.

    The header is expected to be a comma-separated list injected by the
    auth proxy / RAMPS gateway (e.g. ``sc-acct-mgr,sc-user``).
    In development the header may be absent; pass it via curl or Postman.
    """
    if not x_user_roles:
        return []
    return [r.strip() for r in x_user_roles.split(",") if r.strip()]


def require_role(*allowed_roles: str):
    """Return a FastAPI dependency that enforces one of *allowed_roles*.

    Example::
        Depends(require_role("sc-mgr", "sc-acct-mgr"))
    """
    allowed = set(allowed_roles)

    def _check(roles: list[str] = Depends(_current_roles)) -> None:
        if not allowed.intersection(roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {sorted(allowed)}",
            )

    return Depends(_check)


def require_ce_admin():
    """Shortcut: requires sc-mgr or sc-acct-mgr."""
    return require_role(*CE_ADMIN_ROLES)


def require_ce_schema_admin():
    """Shortcut: requires sc-acct-mgr (schema/trait-def modifications)."""
    return require_role(*CE_SCHEMA_ADMIN_ROLES)
