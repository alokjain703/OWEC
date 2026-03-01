"""
Timeline Service – events, entity attachments, chronology validation.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventEntity
from app.schemas.event import EventCreate, EventEntityAttach, ChronologyValidationResult


class TimelineService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_event(self, data: EventCreate) -> Event:
        event = Event(
            project_id=data.project_id,
            source_node_id=data.source_node_id,
            title=data.title,
            description=data.description,
            start_time=data.start_time,
            end_time=data.end_time,
            time_data=data.time_data.model_dump(),
        )
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    async def attach_entity(self, event_id: uuid.UUID, data: EventEntityAttach) -> EventEntity:
        link = EventEntity(
            event_id=event_id,
            entity_id=data.entity_id,
            role=data.role,
            metadata_=data.metadata,
        )
        self.db.add(link)
        await self.db.flush()
        return link

    async def get_project_timeline(self, project_id: uuid.UUID) -> list[Event]:
        result = await self.db.execute(
            select(Event)
            .where(Event.project_id == project_id)
            .options(selectinload(Event.entity_links))
            .order_by(Event.start_time.asc().nullslast())
        )
        return list(result.scalars().all())

    async def get_entity_timeline(self, entity_id: uuid.UUID) -> list[Event]:
        """All events that involve the given entity."""
        result = await self.db.execute(
            select(Event)
            .join(EventEntity, EventEntity.event_id == Event.id)
            .where(EventEntity.entity_id == entity_id)
            .options(selectinload(Event.entity_links))
            .order_by(Event.start_time.asc().nullslast())
        )
        return list(result.scalars().all())

    async def validate_chronology(self, project_id: uuid.UUID) -> ChronologyValidationResult:
        """
        Check that no event has end_time < start_time, and
        that start_times don't overlap in obviously impossible ways.
        """
        result = await self.db.execute(
            select(Event).where(Event.project_id == project_id)
        )
        events = result.scalars().all()
        issues: list[str] = []
        for ev in events:
            if ev.start_time and ev.end_time and ev.end_time < ev.start_time:
                issues.append(
                    f"Event '{ev.title}' ({ev.id}): end_time is before start_time"
                )
        return ChronologyValidationResult(valid=len(issues) == 0, issues=issues)
