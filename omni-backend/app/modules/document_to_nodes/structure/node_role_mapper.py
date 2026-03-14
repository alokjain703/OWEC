"""
Node Role Mapper
Validates that the roles in the import tree are allowed by the project schema,
and optionally maps document roles to schema-specific role names.
"""
from __future__ import annotations

from app.modules.document_to_nodes.models.import_tree_models import ImportTreeNode

# Default allowed roles (schema-agnostic fallback)
_DEFAULT_ALLOWED: set[str] = {"book", "part", "chapter", "section", "scene", "unknown"}

# Mapping from detected role → preferred schema role when schema defines roles
_ROLE_MAP: dict[str, str] = {
    "unknown": "scene",
}


def validate_and_remap(
    nodes: list[ImportTreeNode],
    allowed_roles: set[str] | None = None,
    warnings: list[str] | None = None,
) -> list[ImportTreeNode]:
    """
    Walk the tree, remap roles and collect warnings for anything unmappable.
    Modifies nodes in-place and returns the list.
    """
    allowed = allowed_roles or _DEFAULT_ALLOWED
    warn = warnings if warnings is not None else []

    def _walk(node: ImportTreeNode) -> None:
        remapped = _ROLE_MAP.get(node.role, node.role)
        if remapped not in allowed:
            warn.append(
                f'Node "{node.title}" has role "{node.role}" which is not in the active schema. '
                f'Falling back to "scene".'
            )
            remapped = "scene"
        node.role = remapped  # type: ignore[assignment]
        for child in node.children:
            _walk(child)

    for root in nodes:
        _walk(root)

    return nodes


def extract_allowed_roles(schema_definition: dict) -> set[str]:
    """
    Extract the set of allowed node_role values from a schema definition dict.
    Falls back to the default set if the schema doesn't define roles.
    """
    try:
        roles = schema_definition.get("node_roles", {})
        if roles:
            return set(roles.keys())
    except Exception:
        pass
    return _DEFAULT_ALLOWED
