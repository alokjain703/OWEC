import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImportTreeNode, NodeRole } from '../models/import-tree.model';
import { removeNode } from '../utils/tree-utils';

const ROLE_ICONS: Record<string, string> = {
  book:    'menu_book',
  part:    'folder_special',
  chapter: 'bookmark',
  section: 'label',
  scene:   'article',
  unknown: 'help_outline',
};

const ROLES: NodeRole[] = ['book', 'part', 'chapter', 'section', 'scene'];

export interface NodeToggleEvent {
  node: ImportTreeNode;
  checked: boolean;
}

@Component({
  selector: 'omni-node-tree-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  template: `
    <div class="node-tree-editor">
      @for (node of nodes(); track node; let i = $index) {
        <div class="node-item" [class]="'depth-' + depth()">
          <!-- Row -->
          <div class="node-row" [class.selected]="isSelected(node)">

            <!-- Checkbox -->
            <mat-checkbox
              class="row-checkbox"
              [checked]="isSelected(node)"
              (change)="onCheckbox(node, $event.checked)"
              (click)="$event.stopPropagation()">
            </mat-checkbox>

            <!-- Expand/collapse -->
            @if (node.children.length > 0) {
              <button mat-icon-button class="expand-btn"
                      (click)="toggleExpanded(node)">
                <mat-icon>{{ isExpanded(node) ? 'expand_more' : 'chevron_right' }}</mat-icon>
              </button>
            } @else {
              <span class="expand-placeholder"></span>
            }

            <!-- Role icon -->
            <mat-icon class="role-icon" [class]="'role-' + node.role">
              {{ roleIcon(node.role) }}
            </mat-icon>

            <!-- Title field -->
            <input
              class="title-input"
              [(ngModel)]="node.title"
              placeholder="(untitled)"
              (change)="treeChanged.emit()"
            />

            <!-- Role selector -->
            <select class="role-select" [(ngModel)]="node.role" (change)="treeChanged.emit()">
              @for (r of roles; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>

            <!-- Page badge -->
            @if (node.page) {
              <span class="page-badge" [matTooltip]="'Page ' + node.page">p.{{ node.page }}</span>
            }

            <!-- Delete single node -->
            <button mat-icon-button class="delete-btn"
                    matTooltip="Remove node"
                    (click)="deleteSingleNode(node)">
              <mat-icon>delete_outline</mat-icon>
            </button>
          </div>

          <!-- Children -->
          @if (isExpanded(node) && node.children.length > 0) {
            <div class="children-wrap">
              <omni-node-tree-editor
                [nodes]="node.children"
                [allRoots]="allRoots()"
                [selectedNodes]="selectedNodes()"
                [depth]="depth() + 1"
                (treeChanged)="treeChanged.emit()"
                (nodeToggled)="nodeToggled.emit($event)">
              </omni-node-tree-editor>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .node-tree-editor { width: 100%; }
    .node-item { width: 100%; }

    .node-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 0;
      border-radius: 4px;
      transition: background 0.1s;
    }
    .node-row:hover { background: #f5f5f5; }
    .node-row.selected { background: #e8eaf6; }
    .node-row.selected .title-input { font-weight: 500; }

    /* tighten checkbox spacing */
    ::ng-deep .row-checkbox .mdc-checkbox { padding: 4px; }

    .expand-btn, .delete-btn {
      width: 28px; height: 28px; line-height: 28px; flex-shrink: 0;
    }
    .expand-btn mat-icon, .delete-btn mat-icon {
      font-size: 18px; width: 18px; height: 18px;
    }
    .expand-placeholder { width: 28px; flex-shrink: 0; }

    .role-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; opacity: 0.7; }
    .role-icon.role-book    { color: #1a237e; }
    .role-icon.role-part    { color: #4527a0; }
    .role-icon.role-chapter { color: #1565c0; }
    .role-icon.role-section { color: #00695c; }
    .role-icon.role-scene   { color: #558b2f; }
    .role-icon.role-unknown { color: #9e9e9e; }

    .title-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 13px; color: rgba(0,0,0,0.87); padding: 2px 4px; min-width: 0;
    }
    .title-input:focus { background: white; border-bottom: 1px solid #3f51b5; }

    .role-select {
      border: none; outline: none; background: transparent;
      font-size: 11px; color: rgba(0,0,0,0.54); padding: 2px; flex-shrink: 0; cursor: pointer;
    }

    .page-badge {
      font-size: 10px; color: #fff; background: #9e9e9e;
      border-radius: 3px; padding: 1px 4px; white-space: nowrap; flex-shrink: 0;
    }

    .delete-btn { color: #ef5350; opacity: 0; }
    .node-row:hover .delete-btn { opacity: 1; }

    .children-wrap {
      padding-left: 20px;
      border-left: 2px solid #eeeeee;
      margin-left: 14px;
    }
    .depth-1 > .node-item > .children-wrap { border-left-color: #e8eaf6; }
    .depth-2 > .node-item > .children-wrap { border-left-color: #e0f2f1; }
  `],
})
export class NodeTreeEditorComponent {
  nodes        = input.required<ImportTreeNode[]>();
  allRoots     = input<ImportTreeNode[]>([]);
  /** Read-only set of selected nodes – used only for display (highlighting). */
  selectedNodes = input<Set<ImportTreeNode>>(new Set());
  depth        = input<number>(0);

  treeChanged  = output<void>();
  /** Emitted (and bubbled up through every recursive layer) when a checkbox changes. */
  nodeToggled  = output<NodeToggleEvent>();

  roles = ROLES;
  private _expanded = new Set<ImportTreeNode>();

  roleIcon(role: string): string {
    return ROLE_ICONS[role] ?? 'article';
  }

  isSelected(node: ImportTreeNode): boolean {
    return this.selectedNodes().has(node);
  }

  onCheckbox(node: ImportTreeNode, checked: boolean): void {
    this.emitForSubtree(node, checked);
  }

  /** Emit a toggle event for `node` and every descendant (depth-first). */
  private emitForSubtree(node: ImportTreeNode, checked: boolean): void {
    this.nodeToggled.emit({ node, checked });
    for (const child of node.children) {
      this.emitForSubtree(child, checked);
    }
  }

  isExpanded(node: ImportTreeNode): boolean {
    if (!this._expanded.has(node)) this._expanded.add(node);
    return this._expanded.has(node);
  }

  toggleExpanded(node: ImportTreeNode): void {
    if (this._expanded.has(node)) {
      this._expanded.delete(node);
    } else {
      this._expanded.add(node);
    }
  }

  deleteSingleNode(node: ImportTreeNode): void {
    const list = this.nodes() as ImportTreeNode[];
    const idx = list.indexOf(node);
    if (idx !== -1) {
      list.splice(idx, 1);
    } else {
      removeNode(this.allRoots() as ImportTreeNode[], node);
    }
    this.treeChanged.emit();
  }
}
