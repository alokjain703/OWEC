"""
DOCX / DOC Parser – extracts text blocks with heading-level metadata.

Supported formats
-----------------
* **.docx** – natively via ``python-docx``.
* **.doc**  – legacy binary format.  Attempted via LibreOffice headless
  conversion to .docx (``soffice``).  If LibreOffice is not available the
  parser raises a helpful ``RuntimeError`` rather than silently producing
  garbage output.

Install:  pip install python-docx
"""
from __future__ import annotations

import io
import os
import re
import subprocess
import tempfile
from typing import TYPE_CHECKING

from app.modules.document_to_nodes.models.import_tree_models import TextBlock

# python-docx is optional; we degrade gracefully.
try:
    from docx import Document as DocxDocument  # type: ignore[import]
    from docx.oxml.ns import qn               # type: ignore[import]
    _DOCX_AVAILABLE = True
except ImportError:
    _DOCX_AVAILABLE = False


MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB


# ── Heading-style name → level mapping ────────────────────────────────────────

_HEADING_RE = re.compile(r"^[Hh]eading\s*(\d+)$")

# Also handle Title / Subtitle as top-level headings
_SPECIAL_STYLES: dict[str, int] = {
    "title":    1,
    "subtitle": 2,
}


def _heading_level(style_name: str) -> int | None:
    """
    Return the heading level (1-based) for a paragraph style name,
    or None if the paragraph is not a heading.
    """
    lower = style_name.strip().lower()
    if lower in _SPECIAL_STYLES:
        return _SPECIAL_STYLES[lower]
    m = _HEADING_RE.match(style_name.strip())
    if m:
        return int(m.group(1))
    return None


# ── Public API ─────────────────────────────────────────────────────────────────

def parse_docx(data: bytes) -> list[TextBlock]:
    """
    Extract text blocks from a **.docx** byte string.

    Each paragraph is one TextBlock.  Heading paragraphs have ``heading_level``
    set so the downstream heading-detector can skip heuristics.

    Raises:
        RuntimeError – if python-docx is not installed.
        ValueError   – if the file is empty, too large, or unreadable.
    """
    if len(data) > MAX_FILE_BYTES:
        raise ValueError(f"File too large (max {MAX_FILE_BYTES // (1024 * 1024)} MB)")

    if not _DOCX_AVAILABLE:
        raise RuntimeError(
            "python-docx is not installed.  "
            "Add 'python-docx>=1.0' to your dependencies."
        )

    try:
        doc = DocxDocument(io.BytesIO(data))
    except Exception as exc:
        raise ValueError(f"Could not open document: {exc}") from exc

    return _extract_blocks(doc)


def parse_doc(data: bytes) -> list[TextBlock]:
    """
    Extract text blocks from a legacy **.doc** byte string via LibreOffice.

    LibreOffice must be available as ``soffice`` on PATH.  If not present,
    raises a RuntimeError with a human-readable suggestion.
    """
    if len(data) > MAX_FILE_BYTES:
        raise ValueError(f"File too large (max {MAX_FILE_BYTES // (1024 * 1024)} MB)")

    # Check LibreOffice is available
    soffice = _find_soffice()
    if not soffice:
        raise RuntimeError(
            "Legacy .doc files require LibreOffice for conversion. "
            "Please save your document as .docx and re-upload."
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        src = os.path.join(tmpdir, "input.doc")
        with open(src, "wb") as fh:
            fh.write(data)

        try:
            subprocess.run(
                [soffice, "--headless", "--convert-to", "docx", "--outdir", tmpdir, src],
                check=True,
                capture_output=True,
                timeout=60,
            )
        except subprocess.CalledProcessError as exc:
            raise ValueError(
                f"LibreOffice conversion failed: {exc.stderr.decode(errors='replace')}"
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise ValueError("LibreOffice timed out converting the .doc file.") from exc

        out = os.path.join(tmpdir, "input.docx")
        if not os.path.exists(out):
            raise ValueError("LibreOffice did not produce a .docx output file.")

        with open(out, "rb") as fh:
            docx_data = fh.read()

    return parse_docx(docx_data)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _extract_blocks(doc: "DocxDocument") -> list[TextBlock]:  # type: ignore[name-defined]
    """Walk a python-docx Document and return a TextBlock list."""
    blocks: list[TextBlock] = []
    block_index = 0

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        style_name = para.style.name if para.style else "Normal"
        level = _heading_level(style_name)

        # Collect run-level formatting hints (for non-heading body text)
        bold_runs = sum(1 for r in para.runs if r.bold)
        any_bold = bold_runs > 0

        # Representative font size: use the largest run size, fall back to 12pt
        font_size = 12.0
        for run in para.runs:
            if run.font and run.font.size:
                pt = run.font.size.pt  # Pt object → float
                if pt > font_size:
                    font_size = pt

        # Page estimation: python-docx does not give page numbers easily,
        # so we leave page=1 (acceptable – docx is primarily structural).
        blocks.append(TextBlock(
            text=text,
            font_size=font_size,
            bold=any_bold,
            italic=any(r.italic for r in para.runs if r.italic is not None),
            page=1,
            block_index=block_index,
            heading_level=level,
        ))
        block_index += 1

    if not blocks:
        raise ValueError("No readable text found in the document.")

    return blocks


def _find_soffice() -> str | None:
    """Return the path to soffice/LibreOffice if found on PATH."""
    candidates = ["soffice", "libreoffice"]
    for name in candidates:
        result = subprocess.run(
            ["which", name],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    return None
