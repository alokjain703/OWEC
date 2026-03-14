import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import {
  BackendNode,
  TreeNode,
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeMovedEvent,
  NodeRenamedEvent,
  NodeInsertAboveEvent,
  NodeInsertBelowEvent,
  NodeDuplicateEvent,
  NodeMoveRequestedEvent,
  NodeSplitEvent,
  NodeMergeEvent,
  NodeDroppedEvent,
} from '../models/tree-node.model';

/**
 * Generic Tree Editor Component
 * 
 * A reusable, domain-agnostic tree UI component for hierarchical data.
 * This component handles only UI concerns and emits events for parent
 * components to handle business logic.
 * 
 * Features:
 * - Expand/collapse nodes
 * - Select nodes
 * - Add child nodes
 * - Rename nodes
 * - Delete nodes
 * - Reorder nodes (via drag-drop in future)
 * 
 * Usage:
 * ```
 * <omni-tree-editor
 *   [nodes]="treeNodes"
 *   (nodeSelected)="handleNodeSelected($event)"
 *   (nodeCreated)="handleNodeCreated($event)"
 *   (nodeDeleted)="handleNodeDeleted($event)"
 *   (nodeMoved)="handleNodeMoved($event)"
 *   (nodeRenamed)="handleNodeRenamed($event)">
 * </omni-tree-editor>
 * ```
 */
@Component({
  selector: 'omni-tree-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tree-editor"
         tabindex="0"
         (keydown)="onKeyDown($event)">

      @if (nodes().length > 0) {
        <div class="tree-nodes">
          @for (node of sortedRootNodes(); track node.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: node, depth: 0 }" />
          }
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon class="empty-icon">account_tree</mat-icon>
          <p>No nodes yet — use the context menu or keyboard shortcuts to add one</p>
        </div>
      }
    </div>

    <!-- ── Recursive node template ───────────────────────────────────────── -->
    <ng-template #nodeTemplate let-node="node" let-depth="depth">
      <div class="tree-node" [style.padding-left.px]="depth * 5">

        <!-- Drop zone: ABOVE -->
        <div class="drop-zone drop-zone--above"
             [class.drop-active]="dropTargetId() === node.id && dropPosition() === 'above'"
             (dragover)="onDragOver($event, node, 'above')"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event, node, 'above')">
        </div>

        <div class="node-row"
             [class.selected]="selectedNodeId() === node.id"
             [class.dragging]="draggingId() === node.id"
             [class.drop-inside]="dropTargetId() === node.id && dropPosition() === 'inside'"
             draggable="true"
             (click)="selectNode(node)"
             (contextmenu)="onContextMenu($event, node)"
             (dragstart)="onDragStart($event, node)"
             (dragover)="onDragOver($event, node, 'inside')"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event, node, 'inside')"
             (dragend)="onDragEnd()">

          <!-- Expand/collapse button -->
          <button mat-icon-button
                  class="expand-btn"
                  (click)="toggleExpand(node); $event.stopPropagation()"
                  [disabled]="!canExpand(node)">
            <mat-icon class="expand-icon">
              {{ !canExpand(node) ? '' : (node.expanded ? 'expand_more' : 'chevron_right') }}
            </mat-icon>
          </button>

          <!-- Node label (editable inline) -->
          @if (editingNodeId() === node.id) {
            <mat-form-field class="node-label-input" (click)="$event.stopPropagation()">
              <input matInput
                     [(ngModel)]="editingLabel"
                     (keyup.enter)="saveRename(node)"
                     (keyup.escape)="cancelRename()"
                     (blur)="saveRename(node)"
                     #labelInput>
            </mat-form-field>
          } @else {
            <span class="node-label"
                  [title]="node.label"
                  (dblclick)="startRename(node); $event.stopPropagation()">
              {{ node.label }}
            </span>
          }

          <!-- Actions menu button -->
          <div class="node-actions" (click)="$event.stopPropagation()">
            <button mat-icon-button
                    class="actions-trigger"
                    [matMenuTriggerFor]="nodeMenu"
                    matTooltip="Actions">
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #nodeMenu="matMenu" class="node-context-menu">
              <!-- Add / Insert -->
              <button mat-menu-item (click)="addChild(node)">
                <mat-icon>add</mat-icon>
                <span>Add Child</span>
              </button>
              <button mat-menu-item (click)="insertAbove(node)">
                <mat-icon>vertical_align_top</mat-icon>
                <span>Insert Above</span>
              </button>
              <button mat-menu-item (click)="insertBelow(node)">
                <mat-icon>vertical_align_bottom</mat-icon>
                <span>Insert Below</span>
              </button>

              <mat-divider></mat-divider>

              <!-- Edit -->
              <button mat-menu-item (click)="startRename(node)">
                <mat-icon>edit</mat-icon>
                <span>Rename  <span class="kbd">F2</span></span>
              </button>
              <button mat-menu-item (click)="duplicate(node)">
                <mat-icon>content_copy</mat-icon>
                <span>Duplicate  <span class="kbd">Ctrl+D</span></span>
              </button>

              <mat-divider></mat-divider>

              <!-- Structure -->
              <button mat-menu-item (click)="split(node)">
                <mat-icon>call_split</mat-icon>
                <span>Split</span>
              </button>
              <button mat-menu-item (click)="merge(node)">
                <mat-icon>call_merge</mat-icon>
                <span>Merge with Previous</span>
              </button>
              <button mat-menu-item (click)="requestMove(node)">
                <mat-icon>drive_file_move</mat-icon>
                <span>Move To…</span>
              </button>

              <mat-divider></mat-divider>

              <!-- Danger -->
              <button mat-menu-item class="danger-item" (click)="deleteNode(node)">
                <mat-icon>delete</mat-icon>
                <span>Delete  <span class="kbd">Del</span></span>
              </button>
            </mat-menu>
          </div>
        </div><!-- /.node-row -->

        <!-- Drop zone: BELOW (only between siblings, not under last child) -->
        <div class="drop-zone drop-zone--below"
             [class.drop-active]="dropTargetId() === node.id && dropPosition() === 'below'"
             (dragover)="onDragOver($event, node, 'below')"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event, node, 'below')">
        </div>

        <!-- Children (recursive) -->
        @if (node.expanded && node.children) {
          @for (child of sortedChildren(node); track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: child, depth: depth + 1 }" />
          }
        }
      </div>
    </ng-template>

    <!-- Keyboard shortcut hint -->
    <div class="shortcuts-hint">
      <span>Dbl-click: rename</span>
      <span>Enter: insert below</span>
      <span>Tab: child</span>
      <span>Del: delete</span>
      <span>Ctrl+D: dup</span>
    </div>
  `,
  styles: [`
    /* ── Layout ──────────────────────────────────────────────────────────── */
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .tree-editor {
      padding: 4px;
      flex: 1;
      overflow: auto;
      outline: none;
    }

    .tree-nodes {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .tree-node {
      display: flex;
      flex-direction: column;
    }

    /* ── Node row ─────────────────────────────────────────────────────────── */
    .node-row {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 0 2px;
      border-radius: 3px;
      cursor: pointer;
      transition: background-color 0.15s;
      user-select: none;
      position: relative;
    }

    .node-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .node-row.selected {
      background-color: rgba(124, 92, 191, 0.15);
      border-left: 3px solid var(--omni-accent, #7c5cbf);
      padding-left: 3px;
    }

    .node-row.dragging {
      opacity: 0.4;
    }

    .node-row.drop-inside {
      outline: 2px dashed var(--omni-accent, #7c5cbf);
      outline-offset: -1px;
      background-color: rgba(124, 92, 191, 0.08);
    }

    /* ── Drop zones (above / below) ──────────────────────────────────────── */
    .drop-zone {
      height: 3px;
      margin: 0 4px;
      border-radius: 2px;
      transition: all 0.1s;
    }

    .drop-zone.drop-active {
      height: 4px;
      background-color: var(--omni-accent, #7c5cbf);
      box-shadow: 0 0 4px rgba(124, 92, 191, 0.6);
    }

    /* ── Buttons (expand + actions) ──────────────────────────────────────── */
    .expand-btn,
    .node-actions button {
      flex-shrink: 0;
      width: 26px !important;
      height: 26px !important;
      line-height: 26px;
      display: flex !important;
      align-items: center;
      justify-content: center;
      padding: 0 !important;
      --mdc-icon-button-state-layer-size: 26px;
    }

    .expand-btn ::ng-deep .mat-mdc-button-touch-target,
    .node-actions button ::ng-deep .mat-mdc-button-touch-target {
      width: 26px;
      height: 26px;
    }

    .expand-btn ::ng-deep .mat-mdc-button-persistent-ripple,
    .node-actions button ::ng-deep .mat-mdc-button-persistent-ripple {
      border-radius: 3px;
    }

    .expand-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .node-actions mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    /* ── Labels ──────────────────────────────────────────────────────────── */
    .node-label {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-label-input {
      flex: 1;
      font-size: 14px;
    }

    .node-label-input ::ng-deep .mat-mdc-form-field-infix {
      padding-top: 3px;
      padding-bottom: 3px;
      min-height: unset;
    }

    /* ── Actions visibility ───────────────────────────────────────────────── */
    .node-actions {
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .node-row:hover .node-actions,
    .node-row.selected .node-actions {
      opacity: 1;
    }

    /* ── Context menu styling ─────────────────────────────────────────────── */
    .kbd {
      font-size: 10px;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 3px;
      padding: 1px 4px;
      font-family: monospace;
      margin-left: 6px;
      color: rgba(0, 0, 0, 0.5);
    }

    ::ng-deep .node-context-menu .danger-item mat-icon,
    ::ng-deep .node-context-menu .danger-item span {
      color: #d32f2f;
    }

    /* ── Shortcuts hint bar ───────────────────────────────────────────────── */
    .shortcuts-hint {
      display: flex;
      gap: 12px;
      padding: 3px 8px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      font-size: 11px;
      color: rgba(0, 0, 0, 0.38);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    /* ── Empty state ─────────────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.4;
      margin-bottom: 16px;
    }
  `],
})
export class TreeEditorComponent {
  private cdr = inject(ChangeDetectorRef);

  // ── Inputs ──────────────────────────────────────────────────────────────
  nodes = input.required<TreeNode[]>();

  // ── Outputs ─────────────────────────────────────────────────────────────
  nodeSelected       = output<TreeNode>();
  nodeCreated        = output<NodeCreatedEvent>();
  nodeDeleted        = output<NodeDeletedEvent>();
  nodeMoved          = output<NodeMovedEvent>();
  nodeRenamed        = output<NodeRenamedEvent>();
  // New operations
  nodeInsertAbove    = output<NodeInsertAboveEvent>();
  nodeInsertBelow    = output<NodeInsertBelowEvent>();
  nodeDuplicate      = output<NodeDuplicateEvent>();
  nodeMoveRequested  = output<NodeMoveRequestedEvent>();
  nodeSplit          = output<NodeSplitEvent>();
  nodeMerge          = output<NodeMergeEvent>();
  nodeDropped        = output<NodeDroppedEvent>();

  // ── Local state ─────────────────────────────────────────────────────────
  selectedNodeId = signal<string | null>(null);
  editingNodeId  = signal<string | null>(null);
  editingLabel   = '';

  // Drag-and-drop state
  draggingId    = signal<string | null>(null);
  dropTargetId  = signal<string | null>(null);
  dropPosition  = signal<'above' | 'inside' | 'below' | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────

  /** Root nodes sorted by order_key. */
  sortedRootNodes = computed(() =>
    [...this.nodes()].sort((a, b) => this._orderKey(a) - this._orderKey(b))
  );

  private _orderKey(node: TreeNode): number {
    return (node.data as BackendNode | undefined)?.order_key ?? 0;
  }

  /** Whether a node can be expanded. */
  canExpand(node: TreeNode): boolean {
    const backendHasChildren = (node.data as BackendNode | undefined)?.has_children;
    return backendHasChildren === true || (node.children?.length ?? 0) > 0;
  }

  /** Children sorted by order_key. */
  sortedChildren(node: TreeNode): TreeNode[] {
    if (!node.children) return [];
    return [...node.children].sort((a, b) => this._orderKey(a) - this._orderKey(b));
  }

  // ── Selection ────────────────────────────────────────────────────────────

  selectNode(node: TreeNode): void {
    this.selectedNodeId.set(node.id);
    this.nodeSelected.emit(node);
  }

  private get selectedNode(): TreeNode | null {
    const id = this.selectedNodeId();
    if (!id) return null;
    return this._findNode(id, this.nodes()) ?? null;
  }

  private _findNode(id: string, nodes: TreeNode[]): TreeNode | undefined {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = this._findNode(id, n.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  // ── Expand / Collapse ────────────────────────────────────────────────────

  toggleExpand(node: TreeNode): void {
    if (!this.canExpand(node)) return;
    node.expanded = !node.expanded;
    this.cdr.markForCheck();
  }

  // ── Context Menu ─────────────────────────────────────────────────────────

  onContextMenu(event: MouseEvent, node: TreeNode): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectNode(node);
    // Programmatically click the actions-trigger button inside this row
    const row = event.currentTarget as HTMLElement;
    const trigger = row.querySelector('.actions-trigger') as HTMLElement | null;
    trigger?.click();
  }

  // ── Node CRUD ─────────────────────────────────────────────────────────────

  addChild(parentNode: TreeNode): void {
    this.nodeCreated.emit({ parentNode, label: '' });
  }

  insertAbove(node: TreeNode): void {
    this.nodeInsertAbove.emit({ referenceNode: node });
  }

  insertBelow(node: TreeNode): void {
    this.nodeInsertBelow.emit({ referenceNode: node });
  }

  duplicate(node: TreeNode): void {
    this.nodeDuplicate.emit({ node });
  }

  requestMove(node: TreeNode): void {
    this.nodeMoveRequested.emit({ node });
  }

  split(node: TreeNode): void {
    this.nodeSplit.emit({ node });
  }

  merge(node: TreeNode): void {
    this.nodeMerge.emit({ node });
  }

  deleteNode(node: TreeNode): void {
    const msg = node.children && node.children.length > 0
      ? `Delete "${node.label}" and all its children?`
      : `Delete "${node.label}"?`;
    if (confirm(msg)) {
      this.nodeDeleted.emit({ node });
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────────

  startRename(node: TreeNode): void {
    this.editingNodeId.set(node.id);
    this.editingLabel = node.label;
    setTimeout(() => {
      const input = document.querySelector('.node-label-input input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 80);
  }

  saveRename(node: TreeNode): void {
    const newLabel = this.editingLabel.trim();
    if (newLabel && newLabel !== node.label) {
      this.nodeRenamed.emit({ node, newLabel });
    }
    this.cancelRename();
  }

  cancelRename(): void {
    this.editingNodeId.set(null);
    this.editingLabel = '';
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  onKeyDown(event: KeyboardEvent): void {
    const node = this.selectedNode;
    if (!node) return;

    // Don't intercept when typing in the rename input
    if (this.editingNodeId()) return;

    const ctrl = event.ctrlKey || event.metaKey;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.insertBelow(node);
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+Tab → promote (request move to grandparent)
          this.requestMove(node);
        } else {
          // Tab → add child
          this.addChild(node);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!ctrl) { event.preventDefault(); this.deleteNode(node); }
        break;
      case 'F2':
        event.preventDefault();
        this.startRename(node);
        break;
      case 'd':
      case 'D':
        if (ctrl) { event.preventDefault(); this.duplicate(node); }
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._selectSibling(node, -1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this._selectSibling(node, 1);
        break;
      case 'ArrowRight':
        if (!node.expanded && this.canExpand(node)) {
          event.preventDefault();
          node.expanded = true;
          this.cdr.markForCheck();
        }
        break;
      case 'ArrowLeft':
        if (node.expanded) {
          event.preventDefault();
          node.expanded = false;
          this.cdr.markForCheck();
        }
        break;
    }
  }

  private _selectSibling(node: TreeNode, direction: -1 | 1): void {
    const flat = this._flatVisible(this.nodes());
    const idx = flat.findIndex(n => n.id === node.id);
    const next = flat[idx + direction];
    if (next) this.selectNode(next);
  }

  private _flatVisible(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    const visit = (n: TreeNode) => {
      result.push(n);
      if (n.expanded && n.children) n.children.forEach(visit);
    };
    [...nodes].sort((a, b) => this._orderKey(a) - this._orderKey(b)).forEach(visit);
    return result;
  }

  // ── Drag and Drop ─────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, node: TreeNode): void {
    this.draggingId.set(node.id);
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', node.id);
  }

  onDragOver(event: DragEvent, node: TreeNode, position: 'above' | 'inside' | 'below'): void {
    const dragging = this.draggingId();
    if (!dragging || dragging === node.id) return;

    // Prevent drop on a descendant of the dragged node
    if (this._isDescendant(node, dragging)) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    this.dropTargetId.set(node.id);
    this.dropPosition.set(position);
  }

  onDragLeave(event: DragEvent): void {
    // Only clear if leaving the component entirely
    const related = event.relatedTarget as HTMLElement | null;
    if (!related || !related.closest('.tree-editor')) {
      this.dropTargetId.set(null);
      this.dropPosition.set(null);
    }
  }

  onDrop(event: DragEvent, targetNode: TreeNode, position: 'above' | 'inside' | 'below'): void {
    event.preventDefault();
    event.stopPropagation();

    const draggingId = this.draggingId();
    if (!draggingId || draggingId === targetNode.id) {
      this.onDragEnd();
      return;
    }

    const draggedNode = this._findNode(draggingId, this.nodes());
    if (!draggedNode) { this.onDragEnd(); return; }

    // Validate: cannot drop inside a descendant
    if (position === 'inside' && this._isDescendant(targetNode, draggingId)) {
      this.onDragEnd();
      return;
    }

    this.nodeDropped.emit({ draggedNode, targetNode, position });
    this.onDragEnd();
  }

  onDragEnd(): void {
    this.draggingId.set(null);
    this.dropTargetId.set(null);
    this.dropPosition.set(null);
  }

  /** Returns true if `node` is a descendant of the node with `ancestorId`. */
  private _isDescendant(node: TreeNode, ancestorId: string): boolean {
    const ancestor = this._findNode(ancestorId, this.nodes());
    if (!ancestor) return false;
    const check = (n: TreeNode): boolean =>
      (n.children ?? []).some(c => c.id === node.id || check(c));
    return check(ancestor);
  }
}
