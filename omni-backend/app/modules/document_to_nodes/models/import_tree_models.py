"""Pydantic models for the Document → Nodes import pipeline."""
from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


# ── Content formats ────────────────────────────────────────────────────────────

ContentFormat = Literal["html", "markdown", "json", "plain"]

NodeRole = Literal["book", "part", "chapter", "section", "scene", "unknown"]


# ── Raw block from PDF parser ─────────────────────────────────────────────────

class TextBlock(BaseModel):
    """A single extracted block from the document."""
    text: str
    font_size: float = 12.0
    bold: bool = False
    italic: bool = False
    page: int = 1
    block_index: int = 0
    # Set by docx parser when the paragraph has an explicit Word heading style.
    # heading_level=1 → "Heading 1", etc.  None means body/unknown.
    heading_level: int | None = None


# ── Import tree node (editable in the UI before commit) ───────────────────────

class ImportTreeNode(BaseModel):
    """
    A node in the import preview tree.
    Fully editable by the user before the commit step.
    """
    title: str = ""
    role: NodeRole = "scene"
    content: str = ""
    content_format: ContentFormat = "html"
    children: list["ImportTreeNode"] = Field(default_factory=list)
    # Track original page for UX hints
    page: int | None = None


ImportTreeNode.model_rebuild()


# ── Parse request / response ──────────────────────────────────────────────────

class ParseResponse(BaseModel):
    tree: list[ImportTreeNode]
    warnings: list[str] = Field(default_factory=list)


# ── Commit request / response ─────────────────────────────────────────────────

class CommitRequest(BaseModel):
    target_node_id: str = Field(..., description="UUID of the OMNI node to attach imported nodes under")
    project_id: str = Field(..., description="UUID of the project")
    tree: list[ImportTreeNode]


class CommitResponse(BaseModel):
    created: int
    root_node_ids: list[str]
    warnings: list[str] = Field(default_factory=list)
