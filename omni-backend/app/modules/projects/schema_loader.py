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
        
        If the schema definition includes a 'starter_nodes' field, uses that
        to create the initial structure. Otherwise, falls back to default behavior.
        
        Example starter_nodes structure in schema:
        {
          "starter_nodes": [
            {
              "title": "Story Universe",
              "role": "universe",
              "children": [
                {"title": "Books", "role": "collection"},
                {"title": "Characters", "role": "collection"},
                {"title": "Locations", "role": "collection"}
              ]
            }
          ]
        }
        """
        schema = await self.db.get(NarrativeSchema, schema_id)
        if not schema:
            raise ValueError(f"Schema {schema_id} not found")
        
        definition = schema.definition
        roles = definition.get("roles", {})
        
        if not roles:
            raise ValueError("Schema has no roles defined")
        
        # Check if schema defines starter_nodes
        starter_nodes = definition.get("starter_nodes")
        
        if starter_nodes:
            # Use schema-defined starter nodes
            return await self._create_nodes_from_definition(
                project_id, 
                starter_nodes,
                parent_id=None,
                depth=0
            )
        else:
            # Fall back to legacy behavior
            return await self._create_default_starter_nodes(
                project_id,
                schema.name,
                roles
            )
    
    async def _create_nodes_from_definition(
        self,
        project_id: uuid.UUID,
        node_definitions: list[dict],
        parent_id: Optional[uuid.UUID] = None,
        depth: int = 0
    ) -> list[Node]:
        """
        Recursively create nodes from starter_nodes definition.
        
        Args:
            project_id: The project to create nodes for
            node_definitions: List of node definitions with 'title', 'role', and optional 'children'
            parent_id: Parent node ID (None for root nodes)
            depth: Current depth in the tree
        
        Returns:
            List of created nodes
        """
        nodes = []
        
        for idx, node_def in enumerate(node_definitions):
            title = node_def.get("title", "Untitled")
            role = node_def.get("role")
            content = node_def.get("content", "")
            metadata = node_def.get("metadata", {})
            children_defs = node_def.get("children", [])
            
            if not role:
                continue  # Skip nodes without a role
            
            # Create the node
            node = Node(
                project_id=project_id,
                parent_id=parent_id,
                depth=depth,
                order_index=idx,
                node_role=role,
                title=title,
                content=content,
                metadata_=metadata,
            )
            self.db.add(node)
            await self.db.flush()
            await self.db.refresh(node)
            nodes.append(node)
            
            # Recursively create children
            if children_defs:
                child_nodes = await self._create_nodes_from_definition(
                    project_id,
                    children_defs,
                    parent_id=node.id,
                    depth=depth + 1
                )
                nodes.extend(child_nodes)
        
        return nodes
    
    async def _create_default_starter_nodes(
        self,
        project_id: uuid.UUID,
        schema_name: str,
        roles: dict
    ) -> list[Node]:
        """
        Create default starter nodes using legacy hardcoded behavior.
        """
        
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
            starter_collections = self._get_starter_collections(schema_name)
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
