/**
 * OMNI Relationship Graph Types
 * 
 * Type definitions for the relationship graph component.
 */

/**
 * Graph node representing an OMNI entity
 */
export interface OmniGraphNode {
  id: string;
  label: string;
  type: 'character' | 'faction' | 'item' | 'event' | string;
  data?: any;
  // D3 force simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

/**
 * Graph edge representing a relationship between entities
 */
export interface OmniGraphEdge {
  id: string;
  source: string | OmniGraphNode;
  target: string | OmniGraphNode;
  type: string;
  data?: any;
}

/**
 * Configuration options for the graph
 */
export interface GraphConfig {
  width?: number;
  height?: number;
  nodeRadius?: number;
  linkDistance?: number;
  chargeStrength?: number;
  enableZoom?: boolean;
  enableDrag?: boolean;
  showLabels?: boolean;
  showEdgeLabels?: boolean;
}

/**
 * Node color mapping by entity type
 */
export const NODE_TYPE_COLORS: Record<string, string> = {
  character: '#ce93d8',
  faction: '#90caf9',
  item: '#80cbc4',
  event: '#f48fb1',
  default: '#9e9e9e'
};

/**
 * Helper to get color for a node type
 */
export function getNodeColor(type: string): string {
  return NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS['default'];
}

/**
 * Transform OMNI entities to graph nodes
 */
export function entitiesToNodes(entities: any[]): OmniGraphNode[] {
  return entities.map(e => ({
    id: e.id,
    label: e.title || e.name || e.id,
    type: e.type,
    data: e,
    // Restore saved positions if available
    fx: e.metadata?.graph?.x ?? null,
    fy: e.metadata?.graph?.y ?? null
  }));
}

/**
 * Transform OMNI relationships to graph edges
 */
export function relationshipsToEdges(relationships: any[]): OmniGraphEdge[] {
  return relationships.map(r => ({
    id: r.id,
    source: r.sourceId || r.source_id || r.from_node,
    target: r.targetId || r.target_id || r.to_node,
    type: r.type || r.relationship_type,
    data: r
  }));
}
