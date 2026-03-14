"""
Document-to-Nodes API Router
POST /api/v1/document-import/parse
POST /api/v1/document-import/commit
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.document_to_nodes.models.import_tree_models import (
    CommitRequest, CommitResponse, ContentFormat, ParseResponse,
)
from app.modules.document_to_nodes.service import DocumentToNodesService
from app.modules.document_to_nodes.repository.node_writer import write_tree

router = APIRouter(prefix="/document-import", tags=["Document Import"])

_svc = DocumentToNodesService()

# MIME types we accept
_PDF_MIMES  = {"application/pdf", "application/octet-stream"}
_DOCX_MIMES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "application/zip",
}
_DOC_MIMES  = {
    "application/msword",
    "application/octet-stream",
}


# ── Parse ─────────────────────────────────────────────────────────────────────

@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="Upload a document (PDF, DOCX, DOC) and receive a suggested node tree",
)
async def parse_document(
    file: UploadFile = File(..., description="PDF, DOCX, or DOC file to parse"),
    content_format: ContentFormat = Form("html", description="Target content format: html | markdown | json | plain"),
    schema_definition: str | None = Form(None, description="Optional JSON-encoded schema definition for role validation"),
) -> ParseResponse:
    """
    Parse a document and return a structured ImportTreeNode tree.

    Supported formats:
    * **PDF** (.pdf)
    * **Word 2007+** (.docx)
    * **Word 97–2003** (.doc) – requires LibreOffice in the container

    The tree can then be edited by the user before calling /commit.
    """
    filename = (file.filename or "").lower()
    mime     = file.content_type or ""

    # Determine file type by extension first (most reliable), fall back to MIME
    if filename.endswith(".pdf") or (not filename and mime in _PDF_MIMES):
        file_type = "pdf"
    elif filename.endswith(".docx") or mime in _DOCX_MIMES:
        file_type = "docx"
    elif filename.endswith(".doc") or mime in _DOC_MIMES:
        file_type = "doc"
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported file type. Accepted formats: .pdf, .docx, .doc",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    schema_def: dict = {}
    if schema_definition:
        try:
            schema_def = json.loads(schema_definition)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="schema_definition is not valid JSON.")

    try:
        if file_type == "pdf":
            response = _svc.parse_pdf(data, content_format=content_format, schema_definition=schema_def)
        elif file_type == "docx":
            response = _svc.parse_docx(data, content_format=content_format, schema_definition=schema_def)
        else:  # doc
            response = _svc.parse_doc(data, content_format=content_format, schema_definition=schema_def)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=501, detail=str(exc))

    return response


# ── Commit ────────────────────────────────────────────────────────────────────

@router.post(
    "/commit",
    response_model=CommitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Commit an edited import tree as OMNI nodes",
)
async def commit_tree(
    payload: CommitRequest,
    db: AsyncSession = Depends(get_db),
) -> CommitResponse:
    """
    Insert the import tree into the database under the specified target node.
    Returns the IDs of the created root nodes.
    """
    warnings: list[str] = []
    try:
        root_ids = await write_tree(
            db=db,
            project_id=payload.project_id,
            target_node_id=payload.target_node_id,
            tree=payload.tree,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    # Count total created nodes
    def _count(nodes: list) -> int:
        return sum(1 + _count(n.children) for n in nodes)

    return CommitResponse(
        created=_count(payload.tree),
        root_node_ids=root_ids,
        warnings=warnings,
    )
