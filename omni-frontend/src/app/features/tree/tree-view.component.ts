import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OmniApiService } from '../../core/services/omni-api.service';

interface TreeNode {
  id: string;
  title: string;
  node_role: string;
  depth: number;
  order_index: number;
  children: TreeNode[];
  metadata: Record<string, unknown>;
  expanded?: boolean;
}

/** Maps each node role to a Material colour token and an icon */
const ROLE_META: Record<string, { color: string; icon: string }> = {
  universe:    { color: 'primary',  icon: 'public' },
  collection:  { color: 'accent',   icon: 'collections_bookmark' },
  major_unit:  { color: 'warn',     icon: 'menu_book' },
  atomic_unit: { color: '',         icon: 'article' },
};

@Component({
  selector: 'omni-tree-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatDividerModule, MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tree-page">

      <!-- Header card -->
      <mat-card class="tree-header-card" appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">account_tree</mat-icon>
          <mat-card-title>Project Tree</mat-card-title>
          <mat-card-subtitle>Universe → Collection → Major Unit → Atomic Unit</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <!-- Tree body card -->
      <mat-card class="tree-body-card" appearance="outlined">
        <mat-card-content class="tree-content">
          @if (rootNode()) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: rootNode(), depth: 0 }" />
          } @else {
            <div class="empty-state">
              <mat-icon class="empty-icon">folder_open</mat-icon>
              <p>No tree loaded. Select a project to begin.</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Recursive node template -->
    <ng-template #nodeTemplate let-node="node" let-depth="depth">
      <div class="tree-node" [style.padding-left.px]="depth * 20">

        <div class="node-row" (click)="toggleExpand(node)">
          <!-- Expand / collapse button -->
          <button mat-icon-button class="expand-btn" [disabled]="!node.children?.length"
                  [matTooltip]="node.expanded ? 'Collapse' : 'Expand'">
            <mat-icon class="expand-icon">
              {{ !node.children?.length ? 'fiber_manual_record' : (node.expanded ? 'expand_more' : 'chevron_right') }}
            </mat-icon>
          </button>

          <!-- Role chip -->
          <mat-chip
            class="role-chip"
            [class]="'chip-' + node.node_role"
            [matTooltip]="'Role: ' + node.node_role"
            disableRipple>
            <mat-icon matChipAvatar>{{ getRoleMeta(node.node_role).icon }}</mat-icon>
            {{ node.node_role | uppercase }}
          </mat-chip>

          <!-- Title -->
          <span class="node-title">{{ node.title || '(untitled)' }}</span>
        </div>

        <mat-divider *ngIf="depth === 0" />

        <!-- Children -->
        @if (node.expanded && node.children?.length) {
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: child, depth: depth + 1 }" />
          }
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .tree-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      height: 100%;
      box-sizing: border-box;
    }

    .tree-header-card .header-icon {
      color: var(--omni-accent-light);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .tree-body-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
    .tree-body-card mat-card-content { flex: 1; overflow: auto; padding: 8px 0; }
    .tree-content { height: 100%; overflow: auto; }

    /* ── Node row ── */
    .tree-node { cursor: pointer; }
    .node-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 4px;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .node-row:hover { background: rgba(255,255,255,0.04); }

    .expand-btn { width: 28px; height: 28px; line-height: 28px; }
    .expand-icon { font-size: 18px; width: 18px; height: 18px; color: var(--omni-text-muted); }

    /* ── Role chips ── */
    .role-chip {
      font-size: 10px !important;
      height: 22px !important;
      padding: 0 6px !important;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      min-width: 100px;
    }
    .chip-universe    { background: rgba(59,130,246,0.2)  !important; color: var(--omni-node-universe)   !important; }
    .chip-collection  { background: rgba(139,92,246,0.2)  !important; color: var(--omni-node-collection) !important; }
    .chip-major_unit  { background: rgba(236,72,153,0.2)  !important; color: var(--omni-node-major)      !important; }
    .chip-atomic_unit { background: rgba(16,185,129,0.2)  !important; color: var(--omni-node-atomic)     !important; }

    .node-title { color: var(--omni-text); font-size: 13px; }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 200px; gap: 12px;
      color: var(--omni-text-muted);
    }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
  `],
})
export class TreeViewComponent implements OnInit {
  private api = inject(OmniApiService);
  private cd = inject(ChangeDetectorRef);

  rootNode = signal<TreeNode | null>(null);

  getRoleMeta(role: string) {
    return ROLE_META[role] ?? { color: '', icon: 'radio_button_unchecked' };
  }

  ngOnInit(): void {
    const stub: TreeNode = {
      id: 'demo-1', title: 'My Universe', node_role: 'universe',
      depth: 0, order_index: 0, metadata: {}, expanded: true,
      children: [{
        id: 'demo-2', title: 'Book Series Alpha', node_role: 'collection',
        depth: 1, order_index: 0, metadata: {}, expanded: false,
        children: [{
          id: 'demo-3', title: 'Book 1: Origins', node_role: 'major_unit',
          depth: 2, order_index: 0, metadata: {}, expanded: false,
          children: [
            { id: 'demo-4', title: 'Chapter 1', node_role: 'atomic_unit', depth: 3, order_index: 0, metadata: {}, children: [] },
            { id: 'demo-5', title: 'Chapter 2', node_role: 'atomic_unit', depth: 3, order_index: 1, metadata: {}, children: [] },
          ],
        }],
      }],
    };
    this.rootNode.set(stub);
  }

  toggleExpand(node: TreeNode): void {
    node.expanded = !node.expanded;
  }
}
