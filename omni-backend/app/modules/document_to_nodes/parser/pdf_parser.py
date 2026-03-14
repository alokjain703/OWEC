"""
PDF Parser – extracts text blocks with font-size / bold metadata.
Uses PyMuPDF (fitz).  Install:  pip install pymupdf
"""
from __future__ import annotations

import io
from typing import TYPE_CHECKING

from app.modules.document_to_nodes.models.import_tree_models import TextBlock

# PyMuPDF is optional; we degrade gracefully if not installed.
try:
    import fitz  # type: ignore[import]
    _FITZ_AVAILABLE = True
except ImportError:
    _FITZ_AVAILABLE = False


MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB hard limit


def parse_pdf(data: bytes) -> list[TextBlock]:
    """
    Extract text blocks from a PDF byte string.

    Returns a list of TextBlock ordered by page then vertical position.
    Raises ValueError for invalid / oversized files.
    """
    if len(data) > MAX_FILE_BYTES:
        raise ValueError(f"File too large (max {MAX_FILE_BYTES // (1024*1024)} MB)")

    if not _FITZ_AVAILABLE:
        raise RuntimeError(
            "PyMuPDF is not installed.  Add 'pymupdf>=1.24' to your dependencies."
        )

    blocks: list[TextBlock] = []
    block_index = 0

    doc = fitz.open(stream=data, filetype="pdf")
    try:
        for page_num, page in enumerate(doc, start=1):
            raw = page.get_text("dict")  # type: ignore[attr-defined]
            for block in raw.get("blocks", []):
                if block.get("type") != 0:  # 0 = text block
                    continue
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if not text:
                            continue
                        size = float(span.get("size", 12))
                        flags = span.get("flags", 0)
                        bold = bool(flags & 0b10000)   # bit 4 = bold
                        italic = bool(flags & 0b1)     # bit 0 = italic
                        blocks.append(TextBlock(
                            text=text,
                            font_size=round(size, 1),
                            bold=bold,
                            italic=italic,
                            page=page_num,
                            block_index=block_index,
                        ))
                        block_index += 1
    finally:
        doc.close()

    if not blocks:
        raise ValueError("No readable text found in the PDF.")

    return blocks
