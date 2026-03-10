export interface CeRelationship {
  id: string;
  type: string;
  source: string;
  target: string;
  metadata?: Record<string, unknown>;
}

export interface CeRelationshipType {
  id: string;
  schemaId: string;
  name: string;
  description?: string;
}

export interface CeGraphNode {
  id: string;
  label: string;
  type: string;
}

export interface CeGraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
}
