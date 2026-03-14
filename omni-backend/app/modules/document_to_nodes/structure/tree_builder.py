"""
Tree Builder
Converts a flat list of ClassifiedBlocks into an ImportTreeNode hierarchy.

Algorithm:
  - Walk blocks in order.
  - When we encounter a heading, open a new node at the appropriate depth.
  - Body text is accumulated as content under the most recent heading.
  - Depth is determined by role rank: book > part > chapter > section > scene.
"""
from __future__ import annotations

from app.modules.document_to_nodes.models.import_tree_models import (
    ImportTreeNode, ContentFormat, NodeRole,
)
from app.modules.document_to_nodes.structure.heading_detector import ClassifiedBlock


# Depth rank – lower number = higher in the tree
_ROLE_RANK: dict[NodeRole, int] = {
    "book":    0,
    "part":    1,
    "chapter": 2,
    "section": 3,
    "scene":   4,
    "unknown": 4,
}


def build_tree(
    classified: list[ClassifiedBlock],
    content_format: ContentFormat = "html",
) -> list[ImportTreeNode]:
    """
    Build a list of top-level ImportTreeNodes from classified blocks.
    Returns the roots of the tree (multiple roots if no overarching heading exists).
    """
    if not classified:
        return []

    # Stack entries: (rank, node)
    stack: list[tuple[int, ImportTreeNode]] = []
    roots: list[ImportTreeNode] = []

    def _current_node() -> ImportTreeNode | None:
        return stack[-1][1] if stack else None

    def _append_content(text: str) -> None:
        node = _current_node()
        if node is None:
            # No heading yet – create an implicit root node
            implicit = ImportTreeNode(title="(Untitled)", role="scene", content="", content_format=content_format)
            roots.append(implicit)
            stack.append((_ROLE_RANK["scene"], implicit))
            node = implicit
        if node.content:
            node.content += "\n" + _format_text(text, content_format)
        else:
            node.content = _format_text(text, content_format)

    for cb in classified:
        if cb.is_heading:
            new_rank = _ROLE_RANK.get(cb.role, 4)
            new_node = ImportTreeNode(
                title=cb.block.text.strip(),
                role=cb.role if cb.role != "unknown" else "scene",
                content="",
                content_format=content_format,
                page=cb.block.page,
            )

            # Pop stack until we find a parent with a lower rank number (higher in tree)
            while stack and stack[-1][0] >= new_rank:
                stack.pop()

            if stack:
                # Attach as child of the current top of stack
                stack[-1][1].children.append(new_node)
            else:
                roots.append(new_node)

            stack.append((new_rank, new_node))
        else:
            _append_content(cb.block.text)

    return roots


# ── Content formatters ─────────────────────────────────────────────────────────

def _format_text(text: str, fmt: ContentFormat) -> str:
    text = text.strip()
    if not text:
        return ""
    if fmt == "html":
        return f"<p>{text}</p>"
    if fmt == "markdown":
        return text + "\n"
    if fmt == "json":
        import json
        return json.dumps({"type": "paragraph", "text": text})
    # plain
    return text
