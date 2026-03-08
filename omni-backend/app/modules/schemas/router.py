"""Schemas (Bible Layer) API Router"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.db.session import get_db
from app.modules.schemas.service import SchemaService
from app.schemas.schema import (
    SchemaCreate,
    SchemaOut,
    SchemaActivate,
    MetadataValidationRequest,
    MetadataValidationResult,
)

router = APIRouter(prefix="/schemas", tags=["Schemas"])


def get_service(db: AsyncSession = Depends(get_db)) -> SchemaService:
    return SchemaService(db)


@router.get("", response_model=list[SchemaOut], summary="List all available Bible schemas")
async def list_schemas(svc: SchemaService = Depends(get_service)):
    return await svc.list_schemas()


@router.post("", response_model=SchemaOut, status_code=status.HTTP_201_CREATED,
             summary="Create / upload a custom schema definition")
async def create_schema(
    payload: SchemaCreate,
    svc: SchemaService = Depends(get_service),
):
    try:
        return await svc.create_schema(
            payload, 
            base_schema_id=payload.base_schema_id,
            is_new_version=payload.is_new_version
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload", response_model=SchemaOut, status_code=status.HTTP_201_CREATED,
             summary="Upload a custom schema from a JSON file")
async def upload_schema(
    file: UploadFile = File(...),
    svc: SchemaService = Depends(get_service),
):
    try:
        raw = await file.read()
        definition = json.loads(raw)
        name = definition.get("name") or file.filename or "custom_schema"
        return await svc.create_schema(SchemaCreate(name=name, definition=definition))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")


@router.post("/project/{project_id}/activate", summary="Activate a schema for a project")
async def activate_schema(
    project_id: uuid.UUID,
    payload: SchemaActivate,
    svc: SchemaService = Depends(get_service),
):
    try:
        return await svc.activate_for_project(project_id, payload.schema_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/project/{project_id}/validate", response_model=MetadataValidationResult,
             summary="Validate node metadata against the project's active schema")
async def validate_metadata(
    project_id: uuid.UUID,
    payload: MetadataValidationRequest,
    svc: SchemaService = Depends(get_service),
):
    return await svc.validate_metadata(project_id, payload)
