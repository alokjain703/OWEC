"""
Schema Loader Service – Initialize project nodes from schema definitions.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node
from app.models.schema import NarrativeSchema


class SchemaLoaderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def initialize_project_from_schema(
        self,
        project_id: uuid.UUID,
        schema_id: uuid.UUID
    ) -> list[Node]:
        """
        Create starter nodes for a project based on schema definition.
        
        For example, if schema is "BOOK_SERIES" with roles:
        - universe
        - collection
        - major_unit
        - atomic_unit
        
        Creates a starter structure:
        Story Universe (universe)
        ├── Books (collection)
        ├── Characters (collection)
        ├── Locations (collection)
        └── Timeline (collection)
        """
        schema = await self.db.get(NarrativeSchema, schema_id)
        if not schema:
            raise ValueError(f"Schema {schema_id} not found")
        
        definition = schema.definition
        roles = definition.get("roles", {})
        
        if not roles:
            raise ValueError("Schema has no roles defined")
        
        # Get role keys in hierarchical order (typically: universe, collection, major_unit, atomic_unit)
        role_keys = list(roles.keys())
        
        # Identify the top-level role (typically "universe")
        top_role = role_keys[0] if role_keys else None
        if not top_role:
            return []
        
        # Identify the second-level role (typically "collection")
        second_role = role_keys[1] if len(role_keys) > 1 else None
        
        nodes = []
        
        # Create root universe node
        universe_node = Node(
            project_id=project_id,
            parent_id=None,
            depth=0,
            order_index=0,
            node_role=top_role,
            title=f"Story {roles[top_role].get('label', 'Universe')}",
            content="",
            metadata_={},
        )
        self.db.add(universe_node)
        await self.db.flush()
        await self.db.refresh(universe_node)
        nodes.append(universe_node)
        
        # Create starter collection nodes if second role exists
        if second_role:
            starter_collections = self._get_starter_collections(schema.name)
            for idx, collection_name in enumerate(starter_collections):
                collection_node = Node(
                    project_id=project_id,
                    parent_id=universe_node.id,
                    depth=1,
                    order_index=idx,
                    node_role=second_role,
                    title=collection_name,
                    content="",
                    metadata_={},
                )
                self.db.add(collection_node)
                nodes.append(collection_node)
            
            await self.db.flush()
        
        return nodes
    
    @staticmethod
    def _get_starter_collections(schema_name: str) -> list[str]:
        """
        Get starter collection names based on schema type.
        """
        starters = {
            "BOOK_SERIES": ["Books", "Characters", "Locations", "Timeline"],
            "TV_SERIES": ["Shows", "Characters", "Locations", "Timeline"],
            "MOVIE_SERIES": ["Films", "Characters", "Locations", "Timeline"],
        }
        
        # Default generic starter if schema not recognized
        return starters.get(schema_name, ["Main Collection", "Characters", "Settings"])
