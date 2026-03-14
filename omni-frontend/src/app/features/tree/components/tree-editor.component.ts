import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import {
  TreeNode,
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeMovedEvent,
  NodeRenamedEvent,
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tree-editor">
      @if (nodes().length > 0) {
        <div class="tree-nodes">
          @for (node of nodes(); track node.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: node, depth: 0 }" />
          }
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon class="empty-icon">account_tree</mat-icon>
          <p>No nodes to display</p>
        </div>
      }
    </div>

    <!-- Recursive node template -->
    <ng-template #nodeTemplate let-node="node" let-depth="depth">
      <div class="tree-node" [style.padding-left.px]="depth * 20">
        
        <div class="node-row" 
             [class.selected]="selectedNodeId() === node.id"
             (click)="selectNode(node)">
          
          <!-- Expand/collapse button -->
          <button mat-icon-button 
                  class="expand-btn"
                  (click)="toggleExpand(node); $event.stopPropagation()"
                  [disabled]="!node.children || node.children.length === 0">
            <mat-icon class="expand-icon">
              {{ !node.children?.length ? '' : (node.expanded ? 'expand_more' : 'chevron_right') }}
            </mat-icon>
          </button>

          <!-- Node label (editable) -->
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
            <span class="node-label" (dblclick)="startRename(node); $event.stopPropagation()">
              {{ node.label }}
            </span>
          }

          <!-- Actions menu -->
          <div class="node-actions" (click)="$event.stopPropagation()">
            <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Actions">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="addChild(node)">
                <mat-icon>add</mat-icon>
                <span>Add Child</span>
              </button>
              <button mat-menu-item (click)="startRename(node)">
                <mat-icon>edit</mat-icon>
                <span>Rename</span>
              </button>
              <button mat-menu-item (click)="deleteNode(node)">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </mat-menu>
          </div>
        </div>

        <!-- Children (recursive) -->
        @if (node.expanded && node.children) {
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: child, depth: depth + 1 }" />
          }
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .tree-editor {
      padding: 8px;
      height: 100%;
      overflow: auto;
    }

    .tree-nodes {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .tree-node {
      display: flex;
      flex-direction: column;
    }

    .node-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .node-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .node-row.selected {
      background-color: rgba(124, 92, 191, 0.15);
      border-left: 3px solid var(--omni-accent, #7c5cbf);
      padding-left: 5px;
    }

    .expand-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
    }

    .expand-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(0, 0, 0, 0.54);
    }

    .node-label {
      flex: 1;
      font-size: 14px;
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
      padding-top: 4px;
      padding-bottom: 4px;
    }

    .node-actions {
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .node-row:hover .node-actions,
    .node-row.selected .node-actions {
      opacity: 1;
    }

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
  // Inputs
  nodes = input.required<TreeNode[]>();

  // Outputs
  nodeSelected = output<TreeNode>();
  nodeCreated = output<NodeCreatedEvent>();
  nodeDeleted = output<NodeDeletedEvent>();
  nodeMoved = output<NodeMovedEvent>();
  nodeRenamed = output<NodeRenamedEvent>();

  // Local state
  selectedNodeId = signal<string | null>(null);
  editingNodeId = signal<string | null>(null);
  editingLabel = '';

  // ─── Node Selection ─────────────────────────────────────────────────────────

  selectNode(node: TreeNode): void {
    this.selectedNodeId.set(node.id);
    this.nodeSelected.emit(node);
  }

  // ─── Expand/Collapse ────────────────────────────────────────────────────────

  toggleExpand(node: TreeNode): void {
    if (!node.children || node.children.length === 0) return;
    node.expanded = !node.expanded;
  }

  // ─── Add Child Node ─────────────────────────────────────────────────────────

  addChild(parentNode: TreeNode): void {
    this.nodeCreated.emit({ parentNode, label: '' });
  }

  // ─── Rename Node ────────────────────────────────────────────────────────────

  startRename(node: TreeNode): void {
    this.editingNodeId.set(node.id);
    this.editingLabel = node.label;
    
    // Focus input after a short delay
    setTimeout(() => {
      const input = document.querySelector('.node-label-input input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
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

  // ─── Delete Node ────────────────────────────────────────────────────────────

  deleteNode(node: TreeNode): void {
    const confirmMsg = node.children && node.children.length > 0
      ? `Delete "${node.label}" and all its children?`
      : `Delete "${node.label}"?`;
    
    if (confirm(confirmMsg)) {
      this.nodeDeleted.emit({ node });
    }
  }
}
