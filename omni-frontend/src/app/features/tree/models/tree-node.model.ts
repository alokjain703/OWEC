/**
 * Generic TreeNode interface for hierarchical data structures.
 * 
 * This interface is completely domain-agnostic and can be used
 * for any tree-like data structure (projects, folders, categories, etc.)
 */
export interface TreeNode {
  id: string;
  label: string;
  parentId?: string;
  children?: TreeNode[];
  expanded?: boolean;
  data?: any; // Domain-specific data can be stored here
}

/**
 * Event emitted when a node is created
 */
export interface NodeCreatedEvent {
  parentNode: TreeNode;
  label: string;
}

/**
 * Event emitted when a node is deleted
 */
export interface NodeDeletedEvent {
  node: TreeNode;
}

/**
 * Event emitted when a node is moved
 */
export interface NodeMovedEvent {
  node: TreeNode;
  newParent: TreeNode | null;
  newIndex: number;
}

/**
 * Event emitted when a node is renamed
 */
export interface NodeRenamedEvent {
  node: TreeNode;
  newLabel: string;
}

/**
 * Backend node structure returned from the OMNI API.
 * Mirrors the Python NodeOut schema.
 */
export interface BackendNode {
  id: string;
  project_id: string;
  parent_id?: string;
  depth: number;
  order_index: number;   // legacy column
  order_key?: number;    // fractional ordering key
  node_role: string;
  title?: string;
  content?: string;
  content_format: string; // 'html' | 'markdown' | 'json' | 'plain'
  path?: string;          // hierarchical path e.g. "parentUUID/childUUID"
  has_children: boolean;  // true if this node has children (for lazy loading)
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
