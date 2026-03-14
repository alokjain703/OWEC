/**
 * Tree Service
 *
 * High-level service for all tree node operations. Wraps OmniApiService with
 * tree-specific business logic: order_key computation, sibling lookup, etc.
 *
 * Usage:
 *   inject(TreeService)
 */
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { OmniApiService } from '../../../core/services/omni-api.service';
import { BackendNode, TreeNode } from '../models/tree-node.model';

/** Compute the fractional midpoint between two order_keys. */
function midpoint(prev: number | null | undefined, next: number | null | undefined): number {
  if (prev != null && next != null) return (prev + next) / 2;
  if (prev != null) return prev + 100;
  if (next != null) return next / 2;
  return 100;
}

@Injectable({ providedIn: 'root' })
export class TreeService {
  private api = inject(OmniApiService);

  // ── Query ─────────────────────────────────────────────────────────────────

  /** Load the entire project tree (flat list returned from the projects endpoint). */
  async getTree(projectId: string): Promise<BackendNode[]> {
    return firstValueFrom(this.api.getProjectNodes(projectId)) as Promise<BackendNode[]>;
  }

  // ── Creation ──────────────────────────────────────────────────────────────

  /**
   * Add a child to the given parent (appended at end).
   * Already implemented via OmniApiService.createNode — this is the canonical entry point.
   */
  async addChild(
    projectId: string,
    parentId: string,
    nodeRole: string,
    title?: string,
  ): Promise<BackendNode> {
    return firstValueFrom(this.api.createNode({
      project_id: projectId,
      parent_id: parentId,
      node_role: nodeRole,
      title: title ?? '',
    })) as Promise<BackendNode>;
  }

  /**
   * Insert a new sibling ABOVE the reference node.
   * Finds the previous sibling and uses a midpoint order_key.
   */
  async insertAbove(
    referenceNode: BackendNode,
    siblings: BackendNode[],
    nodeRole: string,
    title?: string,
  ): Promise<BackendNode> {
    const sorted = [...siblings].sort((a, b) => (a.order_key ?? 0) - (b.order_key ?? 0));
    const idx = sorted.findIndex(s => s.id === referenceNode.id);
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const orderKey = midpoint(prev?.order_key, referenceNode.order_key);

    return firstValueFrom(this.api.createNode({
      project_id: referenceNode.project_id,
      parent_id: referenceNode.parent_id ?? null,
      node_role: nodeRole,
      title: title ?? '',
      order_key: orderKey,
    })) as Promise<BackendNode>;
  }

  /**
   * Insert a new sibling BELOW the reference node.
   * Uses the backend /split endpoint which computes the midpoint server-side.
   */
  async insertBelow(referenceNode: BackendNode, title?: string): Promise<BackendNode> {
    return firstValueFrom(
      this.api.splitNode(referenceNode.id, { title: title ?? '', node_role: referenceNode.node_role })
    ) as Promise<BackendNode>;
  }

  // ── Mutation ──────────────────────────────────────────────────────────────

  async renameNode(nodeId: string, title: string): Promise<BackendNode> {
    return firstValueFrom(this.api.updateNode(nodeId, { title })) as Promise<BackendNode>;
  }

  async deleteNode(nodeId: string): Promise<void> {
    await firstValueFrom(this.api.deleteNode(nodeId));
  }

  async duplicateNode(nodeId: string): Promise<BackendNode> {
    return firstValueFrom(this.api.duplicateNode(nodeId)) as Promise<BackendNode>;
  }

  async splitNode(nodeId: string, title?: string, content?: string): Promise<BackendNode> {
    return firstValueFrom(this.api.splitNode(nodeId, { title, content })) as Promise<BackendNode>;
  }

  async mergeNode(nodeId: string): Promise<BackendNode> {
    return firstValueFrom(this.api.mergeNode(nodeId)) as Promise<BackendNode>;
  }

  /**
   * Move a node to a new parent / position.
   * position: 'above' | 'below' → becomes a sibling of targetNode (same parent_id).
   * position: 'inside'          → becomes the last child of targetNode.
   */
  async moveNode(
    draggedNode: BackendNode,
    targetNode: BackendNode,
    position: 'above' | 'inside' | 'below',
    allNodes: BackendNode[],
  ): Promise<BackendNode> {
    if (position === 'inside') {
      // Move as last child of target
      return firstValueFrom(
        this.api.moveNode(draggedNode.id, {
          new_parent_id: targetNode.id,
        })
      ) as Promise<BackendNode>;
    }

    // Sibling move — same parent as target
    const siblings = allNodes.filter(
      n => n.parent_id === targetNode.parent_id && n.id !== draggedNode.id
    );
    const sorted = [...siblings].sort((a, b) => (a.order_key ?? 0) - (b.order_key ?? 0));
    const targetIdx = sorted.findIndex(s => s.id === targetNode.id);

    let prevKey: number | null | undefined;
    let nextKey: number | null | undefined;

    if (position === 'above') {
      prevKey = targetIdx > 0 ? sorted[targetIdx - 1].order_key : undefined;
      nextKey = targetNode.order_key;
    } else {
      // below
      prevKey = targetNode.order_key;
      nextKey = targetIdx < sorted.length - 1 ? sorted[targetIdx + 1].order_key : undefined;
    }

    const newOrderKey = midpoint(prevKey, nextKey);

    return firstValueFrom(
      this.api.moveNode(draggedNode.id, {
        new_parent_id: targetNode.parent_id ?? null,
        new_order_key: newOrderKey,
      })
    ) as Promise<BackendNode>;
  }

  // ── Conversion ────────────────────────────────────────────────────────────

  /** Convert a flat list of BackendNodes (with children already nested) → TreeNode[]. */
  toTreeNodes(backendNodes: BackendNode[]): TreeNode[] {
    return backendNodes.map(n => this._toTreeNode(n));
  }

  private _toTreeNode(node: BackendNode): TreeNode {
    return {
      id: node.id,
      label: node.title || '(untitled)',
      parentId: node.parent_id,
      children: node.children ? node.children.map(c => this._toTreeNode(c)) : [],
      expanded: true,
      data: node,
    };
  }

  /** Flatten a TreeNode hierarchy into a depth-first list. */
  flatten(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    const visit = (n: TreeNode) => {
      result.push(n);
      if (n.children) n.children.forEach(visit);
    };
    nodes.forEach(visit);
    return result;
  }

  /** Find siblings of a given BackendNode from a flat list. */
  findSiblings(node: BackendNode, all: BackendNode[]): BackendNode[] {
    return all.filter(n => n.parent_id === node.parent_id && n.id !== node.id);
  }
}
