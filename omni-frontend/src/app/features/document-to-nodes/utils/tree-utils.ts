/**
 * Tree utility helpers for the import tree.
 */
import { ImportTreeNode } from '../models/import-tree.model';

/** Count total nodes in a tree (including all descendants). */
export function countNodes(nodes: ImportTreeNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

/** Deep-clone a tree. */
export function cloneTree(nodes: ImportTreeNode[]): ImportTreeNode[] {
  return nodes.map(n => ({
    ...n,
    children: cloneTree(n.children),
  }));
}

/** Remove a node by reference (identity). Returns true if removed. */
export function removeNode(nodes: ImportTreeNode[], target: ImportTreeNode): boolean {
  const idx = nodes.indexOf(target);
  if (idx !== -1) { nodes.splice(idx, 1); return true; }
  for (const n of nodes) {
    if (removeNode(n.children, target)) return true;
  }
  return false;
}

/** Flatten a tree depth-first into a list. */
export function flattenTree(nodes: ImportTreeNode[]): ImportTreeNode[] {
  return nodes.flatMap(n => [n, ...flattenTree(n.children)]);
}
