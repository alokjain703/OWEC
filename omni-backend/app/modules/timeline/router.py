"""Timeline API Router"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.timeline.service import TimelineService
from app.schemas.event import (
    EventCreate,
    EventEntityAttach,
    EventEntityOut,
    EventOut,
    ChronologyValidationResult,
)

router = APIRouter(prefix="/timeline", tags=["Timeline"])


def get_service(db: AsyncSession = Depends(get_db)) -> TimelineService:
    return TimelineService(db)


@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED,
             summary="Create a timeline event")
async def create_event(
    payload: EventCreate,
    svc: TimelineService = Depends(get_service),
):
    return await svc.create_event(payload)


@router.post("/events/{event_id}/entities", response_model=EventEntityOut,
             status_code=status.HTTP_201_CREATED,
             summary="Attach an entity (with role) to an event")
async def attach_entity(
    event_id: uuid.UUID,
    payload: EventEntityAttach,
    svc: TimelineService = Depends(get_service),
):
    return await svc.attach_entity(event_id, payload)


@router.get("/project/{project_id}", response_model=list[EventOut],
            summary="Get full project timeline ordered chronologically")
async def get_project_timeline(
    project_id: uuid.UUID,
    svc: TimelineService = Depends(get_service),
):
    return await svc.get_project_timeline(project_id)


@router.get("/entity/{entity_id}", response_model=list[EventOut],
            summary="Get timeline for a specific entity")
async def get_entity_timeline(
    entity_id: uuid.UUID,
    svc: TimelineService = Depends(get_service),
):
    return await svc.get_entity_timeline(entity_id)


@router.get("/project/{project_id}/validate", response_model=ChronologyValidationResult,
            summary="Validate chronological consistency of all project events")
async def validate_chronology(
    project_id: uuid.UUID,
    svc: TimelineService = Depends(get_service),
):
    return await svc.validate_chronology(project_id)
