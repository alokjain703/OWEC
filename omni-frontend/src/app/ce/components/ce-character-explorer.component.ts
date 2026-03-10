import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, catchError, of } from 'rxjs';

import { CeEntity } from '../models/ce-entity.model';
import { CeSchema } from '../models/ce-schema.model';
import { CeTraitPack } from '../models/ce-trait.model';
import { CeRelationship, CeGraphNode, CeGraphEdge } from '../models/ce-relationship.model';

import { CeEntityService } from '../services/ce-entity.service';
import { CeTraitService } from '../services/ce-trait.service';
import { CeRelationshipService } from '../services/ce-relationship.service';

import { CeCharacterTreeComponent, CeTreeFilter } from './ce-character-tree.component';
import { CeCharacterTableComponent } from './ce-character-table.component';
import { CeRelationshipGraphPreviewComponent } from './ce-relationship-graph-preview.component';
import { CePropertyInspectorComponent } from './ce-property-inspector.component';

@Component({
  selector: 'ce-character-explorer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatProgressBarModule,
    MatSnackBarModule,
    CeCharacterTreeComponent,
    CeCharacterTableComponent,
    CeRelationshipGraphPreviewComponent,
    CePropertyInspectorComponent,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="explorer-progress" />
    }

    <mat-drawer-container class="explorer-layout" autosize>

      <!-- LEFT: Tree / Filter Panel -->
      <mat-drawer mode="side" opened class="explorer-left-drawer">
        <ce-character-tree
          [entities]="entities()"
          [schemas]="schemas()"
          [traitPacks]="traitPacks()"
          (filterChanged)="onFilterChanged($event)"
        />
      </mat-drawer>

      <!-- CENTER + RIGHT stacked with a second sidenav -->
      <mat-drawer-content class="explorer-center-right">

        <mat-drawer-container class="inner-layout" autosize>

          <!-- CENTER: Table / Card view -->
          <mat-drawer-content class="explorer-center">
            <ce-character-table
              [entities]="filteredEntities()"
              [selectedEntity]="selectedEntity()"
              (entitySelected)="onEntitySelected($event)"
              (entityEdit)="onEntityEdit($event)"
              (createRequested)="onCreateRequested()"
              (graphRequested)="onGraphRequested()"
            />
          </mat-drawer-content>

          <!-- RIGHT: Inspector & graph preview -->
          <mat-drawer mode="side" position="end" opened class="explorer-right-drawer">
            <div class="right-panel">
              <!-- Graph preview (top of right panel) -->
              <ce-relationship-graph-preview
                [nodes]="graphNodes()"
                [edges]="graphEdges()"
                [loading]="graphLoading()"
                [highlightNodeId]="selectedEntity()?.id ?? null"
                (nodeClicked)="onGraphNodeClicked($event)"
                (openFull)="onGraphRequested()"
              />

              <!-- Property inspector (fills remaining space) -->
              <ce-property-inspector
                class="inspector-flex"
                [entity]="selectedEntity()"
                [editMode]="editMode()"
                [totalEntities]="entities().length"
                [totalRelationships]="relationships().length"
                [traitPackCount]="traitPacks().length"
                [schemaCount]="schemas().length"
                (editRequested)="editMode.set(true)"
                (closeEdit)="editMode.set(false)"
                (createCharacter)="onCreateRequested()"
                (viewRelationships)="onViewRelationships()"
                (openGraph)="onGraphRequested()"
              />
            </div>
          </mat-drawer>

        </mat-drawer-container>

      </mat-drawer-content>

    </mat-drawer-container>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .explorer-progress {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }

    .explorer-layout {
      flex: 1;
      height: 100%;
      overflow: hidden;
    }

    /* Left drawer */
    .explorer-left-drawer {
      width: 220px;
      border-right: 1px solid var(--omni-border);
      background: var(--omni-surface);
      overflow-y: auto;
    }

    /* Outer content (center + right) */
    .explorer-center-right {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .inner-layout {
      flex: 1;
      height: 100%;
      overflow: hidden;
    }

    /* Center column */
    .explorer-center {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* Right drawer */
    .explorer-right-drawer {
      width: 420px;
      border-left: 1px solid var(--omni-border);
      background: var(--omni-surface);
      overflow: hidden;
    }

    .right-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 8px;
      gap: 8px;
    }

    .inspector-flex {
      flex: 1;
      overflow: hidden;
    }
  `],
})
export class CeCharacterExplorerComponent implements OnInit {
  private entitySvc = inject(CeEntityService);
  private traitSvc = inject(CeTraitService);
  private relSvc = inject(CeRelationshipService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  // ── State signals ────────────────────────────────────────────
  loading = signal(true);
  graphLoading = signal(false);

  entities = signal<CeEntity[]>([]);
  schemas = signal<CeSchema[]>([]);
  traitPacks = signal<CeTraitPack[]>([]);
  relationships = signal<CeRelationship[]>([]);

  filterState = signal<CeTreeFilter>({ search: '', schemaId: null, traitPackId: null });
  selectedEntity = signal<CeEntity | null>(null);
  editMode = signal(false);

  graphNodes = signal<CeGraphNode[]>([]);
  graphEdges = signal<CeGraphEdge[]>([]);

  filteredEntities = computed<CeEntity[]>(() => {
    const { search, schemaId, traitPackId } = this.filterState();
    let list = this.entities();

    if (schemaId) {
      list = list.filter((e) => e.schema === schemaId);
    }
    if (traitPackId) {
      list = list.filter((e) => e.traitPacks?.includes(traitPackId));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  // ── Data loading ──────────────────────────────────────────────
  private loadAll(): void {
    this.loading.set(true);

    forkJoin({
      entities: this.entitySvc.listEntities().pipe(catchError(() => of<CeEntity[]>([]))),
      traitPacks: this.traitSvc.listTraitPacks().pipe(catchError(() => of<CeTraitPack[]>([]))),
      relationships: this.relSvc.listRelationships().pipe(catchError(() => of<CeRelationship[]>([]))),
    }).subscribe({
      next: ({ entities, traitPacks, relationships }) => {
        this.entities.set(entities);
        this.traitPacks.set(traitPacks);
        this.relationships.set(relationships);
        this.schemas.set(this.deriveSchemasFromEntities(entities));
        this.loading.set(false);
        this.cdr.markForCheck();
        this.loadGraph();
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load character data', 'Dismiss', { duration: 4000 });
        this.cdr.markForCheck();
      },
    });
  }

  private loadGraph(): void {
    this.graphLoading.set(true);
    this.relSvc.getGraph().pipe(catchError(() => of({ nodes: [], edges: [] }))).subscribe({
      next: ({ nodes, edges }) => {
        this.graphNodes.set(nodes);
        // Adapt edge format from service response
        const adaptedEdges: CeGraphEdge[] = edges.map((e: any) => ({
          source: e.source,
          target: e.target,
          relationshipType: e.type || e.relationshipType || '',
        }));
        this.graphEdges.set(adaptedEdges);
        this.graphLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.graphLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  /** Derive synthetic CeSchema objects from unique schema IDs in entities */
  private deriveSchemasFromEntities(entities: CeEntity[]): CeSchema[] {
    const seen = new Map<string, CeSchema>();
    for (const e of entities) {
      if (e.schema && !seen.has(e.schema)) {
        seen.set(e.schema, {
          id: e.schema,
          name: e.schema,
          templates: [],
          traitPacks: [],
          relationships: [],
        });
      }
    }
    return Array.from(seen.values());
  }

  // ── Event handlers ────────────────────────────────────────────
  onFilterChanged(filter: CeTreeFilter): void {
    this.filterState.set(filter);
    this.selectedEntity.set(null);
    this.editMode.set(false);
  }

  onEntitySelected(entity: CeEntity): void {
    this.selectedEntity.set(entity);
    this.editMode.set(false);
  }

  onEntityEdit(entity: CeEntity): void {
    this.selectedEntity.set(entity);
    this.editMode.set(true);
  }

  onCreateRequested(): void {
    this.selectedEntity.set(null);
    this.editMode.set(false);
    this.router.navigate(['/ce/characters']);
  }

  onGraphRequested(): void {
    this.router.navigate(['/ce/relationships']);
  }

  onViewRelationships(): void {
    this.router.navigate(['/ce/relationships']);
  }

  onGraphNodeClicked(node: CeGraphNode): void {
    const entity = this.entities().find((e) => e.id === node.id);
    if (entity) {
      this.selectedEntity.set(entity);
      this.editMode.set(false);
    } else {
      this.router.navigate(['/ce/relationships']);
    }
  }
}
