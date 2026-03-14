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
 * Event emitted when "Insert Above" is requested
 */
export interface NodeInsertAboveEvent {
  referenceNode: TreeNode;
}

/**
 * Event emitted when "Insert Below" is requested
 */
export interface NodeInsertBelowEvent {
  referenceNode: TreeNode;
}

/**
 * Event emitted when "Duplicate" is requested
 */
export interface NodeDuplicateEvent {
  node: TreeNode;
}

/**
 * Event emitted when "Move" is requested from the context menu
 */
export interface NodeMoveRequestedEvent {
  node: TreeNode;
}

/**
 * Event emitted when "Split" is requested
 */
export interface NodeSplitEvent {
  node: TreeNode;
}

/**
 * Event emitted when "Merge" is requested
 */
export interface NodeMergeEvent {
  node: TreeNode;
}

/**
 * Event emitted when "Add Nodes From Document" is selected from the context menu.
 */
export interface NodeImportFromDocumentEvent {
  node: TreeNode;  // The node that will become the parent of the imported nodes
}

/**
 * Event emitted when a node is dropped via drag-and-drop.
 * position: 'above' | 'inside' | 'below' relative to targetNode.
 */
export interface NodeDroppedEvent {
  draggedNode: TreeNode;
  targetNode: TreeNode;
  position: 'above' | 'inside' | 'below';
}

/**
 * System-computed content analytics stored in metadata.stats.
 * Read-only in the UI — never user-editable.
 */
export interface NodeStats {
  word_count: number;
  char_count: number;
  sentence_count: number;
  paragraph_count: number;
  reading_time_minutes: number;
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
  metadata: {
    /** System-computed — read-only, never user-editable. */
    stats?: NodeStats;
    /** Optional user-set writing goal in words. */
    target_word_count?: number;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  // Children are populated by the API when returning a hierarchical tree
  children?: BackendNode[];
}
