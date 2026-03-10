import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { CeEntity } from '../models/ce-entity.model';

type TableView = 'table' | 'cards';

@Component({
  selector: 'ce-character-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatCardModule,
    MatMenuModule,
    MatToolbarModule,
  ],
  template: `
    <!-- Workspace Toolbar -->
    <mat-toolbar class="workspace-toolbar">
      <span class="toolbar-title">Characters</span>
      <span class="spacer"></span>

      <button mat-raised-button color="primary" (click)="createCharacter()">
        <mat-icon>add</mat-icon> Create Character
      </button>
      <button mat-stroked-button class="toolbar-btn" (click)="importCharacters()">
        <mat-icon>upload</mat-icon> Import
      </button>
      <button mat-stroked-button class="toolbar-btn" (click)="openRelationshipGraph()">
        <mat-icon>hub</mat-icon> Relationship Graph
      </button>
      <button mat-stroked-button class="toolbar-btn" [matMenuTriggerFor]="moreMenu">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #moreMenu="matMenu">
        <button mat-menu-item (click)="manageTraitPacks()">
          <mat-icon>local_offer</mat-icon> Manage Trait Packs
        </button>
        <button mat-menu-item (click)="exportCharacters()">
          <mat-icon>download</mat-icon> Export Characters
        </button>
      </mat-menu>

      <!-- View Toggle -->
      <div class="view-toggle">
        <button mat-icon-button [class.active-view]="view() === 'table'" 
                (click)="setView('table')" matTooltip="Table view">
          <mat-icon>table_rows</mat-icon>
        </button>
        <button mat-icon-button [class.active-view]="view() === 'cards'"
                (click)="setView('cards')" matTooltip="Card view">
          <mat-icon>grid_view</mat-icon>
        </button>
      </div>
    </mat-toolbar>

    <!-- TABLE VIEW -->
    @if (view() === 'table') {
      <div class="table-wrapper">
        @if (!entities.length) {
          <div class="empty-state">
            <mat-icon>person_off</mat-icon>
            <p>No characters found.</p>
            <button mat-raised-button color="primary" (click)="createCharacter()">
              Create your first character
            </button>
          </div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="character-table">

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let entity">
                <div class="name-cell">
                  <mat-icon class="entity-avatar">person</mat-icon>
                  <span class="entity-name">{{ entity.name || entity.id | slice:0:8 }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Schema -->
            <ng-container matColumnDef="schema">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Schema</th>
              <td mat-cell *matCellDef="let entity">
                <mat-chip class="schema-chip">{{ entity.schema | titlecase }}</mat-chip>
              </td>
            </ng-container>

            <!-- Template -->
            <ng-container matColumnDef="template">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Template</th>
              <td mat-cell *matCellDef="let entity">
                <span class="template-badge level-{{ entity.template }}">{{ entity.template }}</span>
              </td>
            </ng-container>

            <!-- Trait Packs -->
            <ng-container matColumnDef="traitPacks">
              <th mat-header-cell *matHeaderCellDef>Trait Packs</th>
              <td mat-cell *matCellDef="let entity">
                <div class="pack-chips">
                  @for (pack of entity.traitPacks?.slice(0, 2); track pack) {
                    <mat-chip class="pack-chip">{{ pack }}</mat-chip>
                  }
                  @if (entity.traitPacks?.length > 2) {
                    <span class="more-chips">+{{ entity.traitPacks.length - 2 }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let entity">
                <button mat-icon-button matTooltip="Edit" (click)="$event.stopPropagation(); editEntity(entity)">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                (click)="selectEntity(row)"
                [class.selected-row]="selectedEntity === row"
                class="entity-row"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50]" pageSize="25" showFirstLastButtons />
        }
      </div>
    }

    <!-- CARD VIEW -->
    @if (view() === 'cards') {
      <div class="cards-grid">
        @for (entity of pagedEntities(); track entity.id) {
          <mat-card class="entity-card"
                    [class.selected-card]="selectedEntity === entity"
                    (click)="selectEntity(entity)">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <mat-card-title>{{ entity.name || ('ID: ' + entity.id.slice(0,8)) }}</mat-card-title>
              <mat-card-subtitle>
                <mat-chip class="schema-chip small">{{ entity.schema | titlecase }}</mat-chip>
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="card-meta">
                <span class="template-badge level-{{ entity.template }}">{{ entity.template }}</span>
                @if (entity.traitPacks.length) {
                  <span class="pack-count">{{ entity.traitPacks.length }} packs</span>
                }
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" (click)="$event.stopPropagation(); editEntity(entity)">
                <mat-icon>edit</mat-icon> Edit
              </button>
            </mat-card-actions>
          </mat-card>
        }
        @if (!entities.length) {
          <div class="empty-state full-width">
            <mat-icon>person_off</mat-icon>
            <p>No characters found.</p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .workspace-toolbar {
      background: var(--omni-surface) !important;
      border-bottom: 1px solid var(--omni-border);
      color: var(--omni-text);
      min-height: 52px;
      padding: 0 12px;
      gap: 8px;
      flex-shrink: 0;
    }

    .toolbar-title {
      font-size: 15px;
      font-weight: 600;
    }

    .spacer { flex: 1; }

    .toolbar-btn { margin: 0 2px; }

    .view-toggle {
      display: flex;
      margin-left: 8px;
      border: 1px solid var(--omni-border);
      border-radius: 6px;
      overflow: hidden;
    }

    .view-toggle button {
      border-radius: 0;
      width: 36px;
      height: 36px;
    }

    .active-view {
      background: rgba(124, 92, 191, 0.2) !important;
      color: var(--omni-accent-light) !important;
    }

    .table-wrapper {
      flex: 1;
      overflow: auto;
    }

    .character-table {
      width: 100%;
      background: transparent;
    }

    .character-table th {
      font-size: 12px;
      font-weight: 600;
      color: var(--omni-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background: var(--omni-surface);
      border-bottom: 1px solid var(--omni-border);
    }

    .character-table td {
      font-size: 13px;
      color: var(--omni-text);
      border-bottom: 1px solid var(--omni-border);
    }

    .entity-row {
      cursor: pointer;
      transition: background 0.15s;
    }

    .entity-row:hover { background: rgba(255,255,255,0.04) !important; }

    .selected-row { background: rgba(124, 92, 191, 0.15) !important; }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .entity-avatar {
      font-size: 18px;
      width: 28px;
      height: 28px;
      line-height: 28px;
      background: rgba(124, 92, 191, 0.15);
      border-radius: 50%;
      padding: 4px;
      color: var(--omni-accent-light);
    }

    .entity-name { font-weight: 500; }

    .schema-chip {
      font-size: 11px;
      height: 20px;
      padding: 0 8px;
      background: rgba(124, 92, 191, 0.15) !important;
      color: var(--omni-accent-light) !important;
    }

    .schema-chip.small { font-size: 10px; height: 18px; }

    .template-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .level-XS { background: rgba(100,200,100,0.15); color: #6dc66d; }
    .level-S  { background: rgba(100,150,255,0.15); color: #6da0ff; }
    .level-M  { background: rgba(255,200,50,0.15);  color: #ffd050; }
    .level-L  { background: rgba(255,140,50,0.15);  color: #ff9040; }
    .level-XL { background: rgba(220,60,60,0.15);   color: #e05050; }

    .pack-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .pack-chip  { font-size: 10px; height: 18px; padding: 0 6px; }
    .more-chips { font-size: 11px; color: var(--omni-text-muted); }

    /* Cards */
    .cards-grid {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      padding: 16px;
      align-content: start;
    }

    .entity-card {
      background: var(--omni-surface) !important;
      border: 1px solid var(--omni-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .entity-card:hover { border-color: var(--omni-accent); transform: translateY(-1px); }
    .selected-card { border-color: var(--omni-accent) !important; background: rgba(124, 92, 191, 0.1) !important; }

    .card-avatar {
      background: rgba(124, 92, 191, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--omni-accent-light);
    }

    .card-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .pack-count { font-size: 11px; color: var(--omni-text-muted); }
    .full-width  { grid-column: 1 / -1; }

    /* Empty state */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--omni-text-muted);
      padding: 48px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.3; }
    .empty-state p { font-size: 14px; }
  `],
})
export class CeCharacterTableComponent implements OnChanges, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Input() entities: CeEntity[] = [];
  @Input() selectedEntity: CeEntity | null = null;

  @Output() entitySelected = new EventEmitter<CeEntity>();
  @Output() entityEdit = new EventEmitter<CeEntity>();
  @Output() createRequested = new EventEmitter<void>();
  @Output() graphRequested = new EventEmitter<void>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  view = signal<TableView>('table');
  displayedColumns = ['name', 'schema', 'template', 'traitPacks', 'actions'];
  dataSource = new MatTableDataSource<CeEntity>([]);

  cardPage = signal(0);
  cardPageSize = 20;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entities']) {
      this.dataSource.data = this.entities;
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sortingDataAccessor = (item, header) => {
      switch (header) {
        case 'name': return item.name || item.id;
        case 'schema': return item.schema;
        case 'template': return item.template;
        default: return '';
      }
    };
  }

  pagedEntities(): CeEntity[] {
    const start = this.cardPage() * this.cardPageSize;
    return this.entities.slice(start, start + this.cardPageSize);
  }

  setView(v: TableView): void {
    this.view.set(v);
  }

  selectEntity(entity: CeEntity): void {
    this.entitySelected.emit(entity);
  }

  editEntity(entity: CeEntity): void {
    this.entityEdit.emit(entity);
  }

  createCharacter(): void {
    this.createRequested.emit();
  }

  importCharacters(): void {
    // TODO: wire import dialog
  }

  openRelationshipGraph(): void {
    this.graphRequested.emit();
  }

  manageTraitPacks(): void {
    // TODO: wire trait pack management
  }

  exportCharacters(): void {
    // TODO: wire export
  }
}
