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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImportTreeNode } from '../models/import-tree.model';
import { countNodes, flattenTree, removeNode } from '../utils/tree-utils';
import { NodeTreeEditorComponent, NodeToggleEvent } from './node-tree-editor.component';

@Component({
  selector: 'omni-tree-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule,
    NodeTreeEditorComponent,
  ],
  template: `
    <div class="tree-preview">

      <!-- ── Toolbar ── -->
      <div class="toolbar">
        <div class="select-group">
          <mat-checkbox
            [checked]="allSelected()"
            [indeterminate]="someSelected()"
            (change)="$event.checked ? selectAll() : deselectAll()"
            matTooltip="Select / deselect all">
          </mat-checkbox>
          <span class="node-count">{{ totalNodes() }} nodes</span>
        </div>

        <div class="toolbar-right">
          @if (selectionCount() > 0) {
            <span class="selection-badge">{{ selectionCount() }} selected</span>
          }
        </div>
      </div>

      <!-- ── Warnings ── -->
      @if (warnings().length > 0) {
        <div class="warnings">
          @for (w of warnings(); track w) {
            <div class="warning-item">
              <mat-icon>warning_amber</mat-icon>
              <span>{{ w }}</span>
            </div>
          }
        </div>
      }

      <!-- ── Editable tree ── -->
      <div class="tree-container">
        <omni-node-tree-editor
          [nodes]="tree()"
          [allRoots]="tree()"
          [selectedNodes]="selectionSet"
          [depth]="0"
          (treeChanged)="onTreeChanged()"
          (nodeToggled)="onNodeToggled($event)">
        </omni-node-tree-editor>
      </div>

      <!-- ── Compact deselect bar (shown when ≥1 node selected) ── -->
      @if (selectionCount() > 0) {
        <div class="deselect-bar">
          <span class="deselect-label">
            <mat-icon>check_box</mat-icon>
            {{ selectionCount() }} node{{ selectionCount() === 1 ? '' : 's' }} selected
          </span>
          <button mat-button color="primary" (click)="deselectAll()">
            <mat-icon>deselect</mat-icon> Deselect all
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .tree-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
      height: 100%;
      position: relative;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 2px;
      flex-shrink: 0;
    }
    .select-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .node-count {
      font-size: 13px;
      color: rgba(0,0,0,0.54);
    }
    .toolbar-right { display: flex; align-items: center; gap: 8px; }
    .selection-badge {
      display: inline-block;
      background: #3f51b5;
      color: white;
      font-size: 12px;
      font-weight: 600;
      border-radius: 12px;
      padding: 2px 10px;
    }

    /* Warnings */
    .warnings {
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }
    .warning-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #795548;
    }
    .warning-item mat-icon {
      font-size: 16px; width: 16px; height: 16px; color: #f9a825;
    }

    /* Tree container */
    .tree-container {
      flex: 1;
      overflow-y: auto;
      border: 1px solid #eeeeee;
      border-radius: 8px;
      padding: 8px;
      background: white;
      /* leave room for the sticky bar */
      padding-bottom: 4px;
    }

    /* Compact deselect bar */
    .deselect-bar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #e8eaf6;
      border: 1px solid #c5cae9;
      border-radius: 6px;
      padding: 4px 10px;
    }
    .deselect-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #3f51b5;
    }
    .deselect-label mat-icon {
      font-size: 16px; width: 16px; height: 16px; color: #3f51b5;
    }
  `],
})
export class TreePreviewComponent {
  private cdr = inject(ChangeDetectorRef);

  tree     = input.required<ImportTreeNode[]>();
  warnings = input<string[]>([]);

  treeChanged      = output<void>();
  /** Emits the current selection count whenever it changes. */
  selectionChanged  = output<number>();

  // ── Selection state ────────────────────────────────────────────────────────
  /** Plain mutable Set – passed directly as an input binding to the tree editor
   *  for display (highlighting). Updated synchronously in onNodeToggled(). */
  selectionSet = new Set<ImportTreeNode>();

  // We track a counter signal separately so the template reacts.
  private _selectionCount = signal(0);
  selectionCount = computed(() => this._selectionCount());

  totalNodes = computed(() => countNodes(this.tree()));

  allSelected = computed(() => {
    const total = this.totalNodes();
    return total > 0 && this.selectionCount() === total;
  });

  someSelected = computed(() => {
    const c = this.selectionCount();
    return c > 0 && c < this.totalNodes();
  });

  // ── Event handlers ─────────────────────────────────────────────────────────

  onNodeToggled(event: NodeToggleEvent): void {
    if (event.checked) {
      this.selectionSet.add(event.node);
    } else {
      this.selectionSet.delete(event.node);
    }
    // Update the counter signal so computed() / @if re-evaluates
    this._selectionCount.set(this.selectionSet.size);
    this.selectionChanged.emit(this.selectionSet.size);
  }

  onTreeChanged(): void {
    this.treeChanged.emit();
  }

  // ── Bulk operations ────────────────────────────────────────────────────────

  selectAll(): void {
    flattenTree(this.tree()).forEach(n => this.selectionSet.add(n));
    this._selectionCount.set(this.selectionSet.size);
    this.selectionChanged.emit(this.selectionSet.size);
  }

  deselectAll(): void {
    this.selectionSet.clear();
    this._selectionCount.set(0);
    this.selectionChanged.emit(0);
  }

  deleteSelected(): void {
    const roots = this.tree() as ImportTreeNode[];
    // Remove each selected node from the tree in-place
    for (const node of this.selectionSet) {
      removeNode(roots, node);
    }
    this.selectionSet.clear();
    this._selectionCount.set(0);
    this.selectionChanged.emit(0);
    // Tell the wrapper to spread the array into a new signal reference
    this.treeChanged.emit();
  }
}
