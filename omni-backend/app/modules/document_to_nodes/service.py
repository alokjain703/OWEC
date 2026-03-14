"""
Document-to-Nodes Service
Orchestrates: parse → detect headings → build tree → validate roles.
"""
from __future__ import annotations

from app.modules.document_to_nodes.models.import_tree_models import (
    ContentFormat, ImportTreeNode, ParseResponse,
)
from app.modules.document_to_nodes.parser.pdf_parser import parse_pdf
from app.modules.document_to_nodes.parser.docx_parser import parse_docx, parse_doc
from app.modules.document_to_nodes.structure.heading_detector import detect_headings
from app.modules.document_to_nodes.structure.tree_builder import build_tree
from app.modules.document_to_nodes.structure.node_role_mapper import (
    validate_and_remap, extract_allowed_roles,
)


class DocumentToNodesService:
    """Stateless service – all context passed as arguments."""

    # ── Public parse methods ──────────────────────────────────────────────────

    def parse_pdf(
        self,
        data: bytes,
        content_format: ContentFormat = "html",
        schema_definition: dict | None = None,
    ) -> ParseResponse:
        """Full parse pipeline for a PDF file."""
        return self._pipeline(parse_pdf(data), content_format, schema_definition)

    def parse_docx(
        self,
        data: bytes,
        content_format: ContentFormat = "html",
        schema_definition: dict | None = None,
    ) -> ParseResponse:
        """Full parse pipeline for a .docx file (python-docx)."""
        return self._pipeline(parse_docx(data), content_format, schema_definition)

    def parse_doc(
        self,
        data: bytes,
        content_format: ContentFormat = "html",
        schema_definition: dict | None = None,
    ) -> ParseResponse:
        """Full parse pipeline for a legacy .doc file (LibreOffice conversion)."""
        return self._pipeline(parse_doc(data), content_format, schema_definition)

    # ── Shared pipeline ───────────────────────────────────────────────────────

    def _pipeline(
        self,
        blocks,
        content_format: ContentFormat = "html",
        schema_definition: dict | None = None,
    ) -> ParseResponse:
        """Heading detection → tree building → role validation."""
        warnings: list[str] = []

        classified = detect_headings(blocks)
        tree = build_tree(classified, content_format=content_format)

        if not tree:
            warnings.append(
                "No structure detected in the document. A single root node was created."
            )
            all_text = " ".join(b.block.text for b in classified)
            from app.modules.document_to_nodes.structure.tree_builder import _format_text
            tree = [ImportTreeNode(
                title="Imported Document",
                role="scene",
                content=_format_text(all_text, content_format),
                content_format=content_format,
            )]

        allowed = extract_allowed_roles(schema_definition or {})
        validate_and_remap(tree, allowed_roles=allowed, warnings=warnings)

        return ParseResponse(tree=tree, warnings=warnings)
