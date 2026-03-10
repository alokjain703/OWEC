import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs';

import {
  OmniGraphNode,
  OmniGraphEdge,
} from '../../features/relationships/components/relationship-graph/relationship-graph.types';
import { CeEntity } from '../models/ce-entity.model';
import { CeRelationship, CeRelationshipType, CeGraphNode, CeGraphEdge } from '../models/ce-relationship.model';

import { CeEntityService } from '../services/ce-entity.service';
import { CeRelationshipService } from '../services/ce-relationship.service';

import { CeRelationshipGraphComponent } from '../components/ce-relationship-graph.component';
import { CeGraphToolbarComponent, GraphFilter } from './ce-graph-toolbar.component';
import { CeEntityTreeComponent } from './ce-entity-tree.component';
import { CeNodeInspectorComponent } from './ce-node-inspector.component';
import { CeEdgeInspectorComponent } from './ce-edge-inspector.component';
import { CeCreateRelationshipPanelComponent } from './ce-create-relationship-panel.component';

@Component({
  selector: 'ce-graph-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    CeRelationshipGraphComponent,
    CeGraphToolbarComponent,
    CeEntityTreeComponent,
    CeNodeInspectorComponent,
    CeEdgeInspectorComponent,
    CeCreateRelationshipPanelComponent,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="workspace-progress" />
    }

    <mat-drawer-container class="workspace" autosize>

      <!-- ── LEFT: Entity Tree ── -->
      <mat-drawer mode="side" opened class="workspace-left">
        <div class="panel-header">
          <mat-icon>account_tree</mat-icon>
          <span>Entities</span>
          <button mat-icon-button class="back-btn"
                  matTooltip="Back to Character Engine"
                  (click)="goBack()">
            <mat-icon>chevron_left</mat-icon>
          </button>
        </div>
        <ce-entity-tree
          [entities]="entities()"
          [selectedId]="selectedNode()?.id ?? null"
          (entitySelected)="onEntityTreeSelected($event)"
          (entityFocused)="onEntityFocus($event)">
        </ce-entity-tree>
      </mat-drawer>

      <!-- ── CENTER: Graph Editor ── -->
      <mat-drawer-content class="workspace-main">
        <ce-graph-toolbar
          (addRelationship)="openRelationshipPanel()"
          (fitGraph)="fitGraph()"
          (filterChanged)="applyFilter($event)"
          (searchChanged)="applySearch($event)"
          (labelsToggled)="showLabels.set($event)"
          (physicsToggled)="physicsEnabled.set($event)">
        </ce-graph-toolbar>

        <div class="graph-container">
          <ce-relationship-graph
            [nodes]="visibleNodes()"
            [edges]="visibleEdges()"
            (nodeSelected)="onNodeSelected($event)"
            (edgeSelected)="onEdgeSelected($event)">
          </ce-relationship-graph>
        </div>

        @if (focusedNodeId()) {
          <div class="focus-banner">
            <mat-icon>center_focus_strong</mat-icon>
            <span>Focus: <strong>{{ focusedNodeLabel() }}</strong></span>
            <button mat-icon-button matTooltip="Clear focus" (click)="clearFocus()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
      </mat-drawer-content>

      <!-- ── RIGHT: Inspector ── -->
      <mat-drawer position="end" [opened]="hasSelection()" class="workspace-right">

        @if (createRelMode()) {
          <ce-create-relationship-panel
            [entities]="entities()"
            [relTypes]="relTypes()"
            [sourceNodeId]="createRelSourceId()"
            (created)="onRelCreated($event)"
            (cancelled)="createRelMode.set(false)">
          </ce-create-relationship-panel>
        } @else if (selectedNode()) {
          <ce-node-inspector
            [node]="selectedNode()"
            [entities]="entities()"
            [relationships]="relationships()"
            (editRequested)="editEntity($event)"
            (addRelationshipRequested)="openRelationshipPanel($event)"
            (centerRequested)="focusNode($event)"
            (deleteRequested)="deleteNode($event)">
          </ce-node-inspector>
        } @else if (selectedEdge()) {
          <ce-edge-inspector
            [edge]="selectedEdge()"
            [entities]="entities()"
            [relTypes]="relTypes()"
            [relationships]="relationships()"
            (edited)="onRelationshipEdited($event)"
            (deleteRequested)="deleteEdge($event)"
            (flipRequested)="flipEdge($event)">
          </ce-edge-inspector>
        } @else {
          <div class="inspector-empty">
            <mat-icon>touch_app</mat-icon>
            <p>Click a node or edge to inspect it</p>
            <button mat-stroked-button (click)="openRelationshipPanel()">
              <mat-icon>add_link</mat-icon> Add Relationship
            </button>
          </div>
        }

      </mat-drawer>

    </mat-drawer-container>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .workspace-progress {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 100;
    }

    .workspace {
      flex: 1;
      height: 100%;
      overflow: hidden;
    }

    /* Left panel */
    .workspace-left {
      width: 220px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid var(--omni-border, #e0e0e0);
      background: var(--omni-surface, #fff);
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 12px 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--omni-border, #e0e0e0);
      flex-shrink: 0;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      .back-btn { margin-left: auto; width: 28px; height: 28px; line-height: 28px; }
    }

    /* Center */
    .workspace-main {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    .graph-container {
      flex: 1;
      overflow: hidden;
    }

    .focus-banner {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--omni-surface, #fff);
      border: 1px solid var(--omni-border, #ccc);
      border-radius: 20px;
      padding: 4px 12px 4px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
      font-size: 13px;
      z-index: 10;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--mat-primary, #6200ea); }
    }

    /* Right inspector */
    .workspace-right {
      width: 320px;
      border-left: 1px solid var(--omni-border, #e0e0e0);
      background: var(--omni-surface, #fff);
      overflow-y: auto;
    }

    .inspector-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 12px;
      color: var(--mat-secondary-text, #888);
      text-align: center;

      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.3; }
      p { margin: 0; font-size: 13px; }
    }
  `],
})
export class CeGraphWorkspaceComponent implements OnInit {
  private entitySvc = inject(CeEntityService);
  private relSvc = inject(CeRelationshipService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // ── State ────────────────────────────────────────────────────
  loading = signal(true);
  entities = signal<CeEntity[]>([]);
  relationships = signal<CeRelationship[]>([]);
  relTypes = signal<CeRelationshipType[]>([]);

  rawNodes = signal<OmniGraphNode[]>([]);
  rawEdges = signal<OmniGraphEdge[]>([]);

  // CeGraphEdge form fed to the relationship-graph component (derived)
  rawCeEdges = computed<CeGraphEdge[]>(() =>
    this.rawEdges().map((e) => ({
      source: typeof e.source === 'string' ? e.source : (e.source as OmniGraphNode).id,
      target: typeof e.target === 'string' ? e.target : (e.target as OmniGraphNode).id,
      relationshipType: e.type,
    }))
  );

  selectedNode = signal<OmniGraphNode | null>(null);
  selectedEdge = signal<OmniGraphEdge | null>(null);

  createRelMode = signal(false);
  createRelSourceId = signal<string | undefined>(undefined);

  focusedNodeId = signal<string | null>(null);
  showLabels = signal(true);
  physicsEnabled = signal(true);

  currentFilter = signal<GraphFilter>({
    showCharacters: true,
    showFactions: true,
    showLocations: true,
    showItems: true,
    relationshipType: '',
    searchQuery: '',
  });

  hasSelection = computed(() => !!this.selectedNode() || !!this.selectedEdge() || this.createRelMode());

  focusedNodeLabel = computed(() => {
    const id = this.focusedNodeId();
    if (!id) return '';
    return this.entities().find((e) => e.id === id)?.name || id;
  });

  // Filtered graph nodes based on current filter + focus
  visibleNodes = computed<OmniGraphNode[]>(() => {
    const focusId = this.focusedNodeId();
    const filter = this.currentFilter();
    let nodes = this.rawNodes();

    // Type filter
    nodes = nodes.filter((n) => {
      const t = (n.type || '').toLowerCase();
      if (t.includes('faction') && !filter.showFactions) return false;
      if (t.includes('location') || t.includes('place')) return filter.showLocations;
      if (t.includes('item')) return filter.showItems;
      if (t.includes('character') || !t) return filter.showCharacters;
      return true;
    });

    // Search filter
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
      );
    }

    // Focus mode: show only focused node + its neighbors
    if (focusId) {
      const neighborIds = new Set<string>([focusId]);
      for (const e of this.rawEdges()) {
        const src = typeof e.source === 'string' ? e.source : (e.source as OmniGraphNode).id;
        const tgt = typeof e.target === 'string' ? e.target : (e.target as OmniGraphNode).id;
        if (src === focusId) neighborIds.add(tgt);
        if (tgt === focusId) neighborIds.add(src);
      }
      nodes = nodes.map((n) => ({
        ...n,
        data: { ...n.data, dimmed: !neighborIds.has(n.id) },
      }));
    }

    return nodes;
  });

  visibleEdges = computed<CeGraphEdge[]>(() => {
    const visibleIds = new Set(this.visibleNodes().map((n) => n.id));
    return this.rawCeEdges().filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  });

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      entities: this.entitySvc.listEntities().pipe(catchError(() => of<CeEntity[]>([]))),
      relationships: this.relSvc.listRelationships().pipe(catchError(() => of<CeRelationship[]>([]))),
      relTypes: this.relSvc.listRelationshipTypes().pipe(catchError(() => of<CeRelationshipType[]>([]))),
      graph: this.relSvc.getGraph().pipe(catchError(() => of({ nodes: [], edges: [] }))),
    }).subscribe({
      next: ({ entities, relationships, relTypes, graph }) => {
        this.entities.set(entities);
        this.relationships.set(relationships);
        this.relTypes.set(relTypes);
        this.buildGraph(graph.nodes as CeGraphNode[], graph.edges);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load graph data', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private buildGraph(
    nodes: CeGraphNode[],
    edges: { source: string; target: string; type: string }[],
  ): void {
    this.ngZone.runOutsideAngular(() => {
      const omniNodes: OmniGraphNode[] = nodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        data: n,
      }));
      const omniEdges: OmniGraphEdge[] = edges.map((e) => ({
        id: `${e.source}-${e.target}-${e.type}`,
        source: e.source,
        target: e.target,
        type: e.type,
      }));
      const ceEdges: CeGraphEdge[] = edges.map((e) => ({
        source: e.source,
        target: e.target,
        relationshipType: e.type,
      }));
      this.ngZone.run(() => {
        this.rawNodes.set(omniNodes);
        this.rawEdges.set(omniEdges);
      });
    });
  }

  // ── Event handlers ────────────────────────────────────────────
  onNodeSelected(node: OmniGraphNode): void {
    this.selectedNode.set(node);
    this.selectedEdge.set(null);
  }

  onEdgeSelected(edge: OmniGraphEdge): void {
    this.selectedEdge.set(edge);
    this.selectedNode.set(null);
  }

  onEntityTreeSelected(entity: CeEntity): void {
    const node = this.rawNodes().find((n) => n.id === entity.id);
    if (node) {
      this.selectedNode.set(node);
      this.selectedEdge.set(null);
    }
  }

  onEntityFocus(entity: CeEntity): void {
    this.focusedNodeId.set(entity.id);
    const node = this.rawNodes().find((n) => n.id === entity.id);
    if (node) {
      this.selectedNode.set(node);
      this.selectedEdge.set(null);
    }
  }

  focusNode(node: OmniGraphNode): void {
    this.focusedNodeId.set(node.id);
  }

  clearFocus(): void {
    this.focusedNodeId.set(null);
  }

  fitGraph(): void {
    // Trigger resize event so D3 can refit — the relationship-graph component
    // listens to window resize to refit the viewport.
    window.dispatchEvent(new Event('resize'));
  }

  applyFilter(filter: GraphFilter): void {
    this.currentFilter.set(filter);
  }

  applySearch(query: string): void {
    this.currentFilter.update((f) => ({ ...f, searchQuery: query }));
  }

  // ── CRUD operations ───────────────────────────────────────────
  openRelationshipPanel(sourceNode?: OmniGraphNode): void {
    this.createRelSourceId.set(sourceNode?.id);
    this.createRelMode.set(true);
    // Clear node/edge selection so drawer shows the create panel
    this.selectedNode.set(null);
    this.selectedEdge.set(null);
  }

  onRelCreated(created: CeRelationship): void {
    this.relationships.update((list) => [...list, created]);
    this.rawEdges.update((list) => [
      ...list,
      {
        id: `${created.source}-${created.target}-${created.type}`,
        source: created.source,
        target: created.target,
        type: created.type,
        data: created,
      },
    ]);
    this.snack.open('Relationship created', undefined, { duration: 2000 });
    this.createRelMode.set(false);
  }

  onRelationshipEdited(updated: CeRelationship): void {
    this.relationships.update((list) =>
      list.map((r) => (r.id === updated.id ? updated : r))
    );
    this.rawEdges.update((list) =>
      list.map((e) => {
        const edgeId = (e.data as CeRelationship)?.id;
        if (edgeId === updated.id) {
          return { ...e, type: updated.type, data: updated };
        }
        return e;
      })
    );
  }

  deleteEdge(rel: CeRelationship): void {
    if (!rel?.id) return;
    this.relSvc.deleteRelationship(rel.id).subscribe({
      next: () => {
        this.relationships.update((list) => list.filter((r) => r.id !== rel.id));
        this.rawEdges.update((list) =>
          list.filter((e) => (e.data as CeRelationship)?.id !== rel.id)
        );
        this.selectedEdge.set(null);
        this.snack.open('Relationship deleted', undefined, { duration: 2000 });
      },
      error: () => this.snack.open('Failed to delete relationship', 'Dismiss', { duration: 4000 }),
    });
  }

  flipEdge(rel: CeRelationship): void {
    if (!rel?.id) return;
    this.relSvc
      .updateRelationship(rel.id, { source: rel.target, target: rel.source })
      .subscribe({
        next: (updated) => {
          this.onRelationshipEdited(updated);
          this.snack.open('Direction flipped', undefined, { duration: 2000 });
        },
        error: () => this.snack.open('Failed to flip relationship', 'Dismiss', { duration: 4000 }),
      });
  }

  deleteNode(node: OmniGraphNode): void {
    // Remove all relationships connected to this node from the graph display
    // (entity deletion is handled separately via the entity editor)
    this.rawEdges.update((list) => {
      return list.filter((e) => {
        const src = typeof e.source === 'string' ? e.source : (e.source as OmniGraphNode).id;
        const tgt = typeof e.target === 'string' ? e.target : (e.target as OmniGraphNode).id;
        return src !== node.id && tgt !== node.id;
      });
    });
    this.rawNodes.update((list) => list.filter((n) => n.id !== node.id));
    this.selectedNode.set(null);
    this.snack.open(`Node removed from graph view. Edit character to delete permanently.`, 'Dismiss', {
      duration: 4000,
    });
  }

  editEntity(node: OmniGraphNode): void {
    this.router.navigate(['/ce/characters', node.id]);
  }

  goBack(): void {
    this.router.navigate(['/ce']);
  }
}
