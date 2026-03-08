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
