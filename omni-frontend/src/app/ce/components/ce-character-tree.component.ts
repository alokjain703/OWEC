import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { CeEntity } from '../models/ce-entity.model';
import { CeSchema } from '../models/ce-schema.model';
import { CeTraitPack } from '../models/ce-trait.model';

export interface CeTreeFilter {
  search: string;
  schemaId: string | null;
  traitPackId: string | null;
}

@Component({
  selector: 'ce-character-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatBadgeModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <div class="tree-container">

      <!-- Search -->
      <div class="tree-search">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search characters…" [(ngModel)]="searchTerm"
                 (ngModelChange)="onSearchChange($event)" />
          @if (searchTerm) {
            <button mat-icon-button matSuffix (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      <mat-divider />

      <!-- Characters section -->
      <mat-expansion-panel class="tree-panel" [expanded]="true" hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="section-icon">people</mat-icon>
            <span>Characters</span>
          </mat-panel-title>
          <mat-panel-description>
            <span class="count-badge">{{ entities.length }}</span>
          </mat-panel-description>
        </mat-expansion-panel-header>

        <mat-nav-list dense class="tree-list">
          <a mat-list-item (click)="selectFilter(null, null)" [class.active]="!activeSchemaId() && !activeTraitPackId()">
            <mat-icon matListItemIcon>group</mat-icon>
            <span matListItemTitle>All Characters</span>
            <span matListItemMeta class="item-count">{{ entities.length }}</span>
          </a>
          <a mat-list-item (click)="selectFavorites()">
            <mat-icon matListItemIcon>star</mat-icon>
            <span matListItemTitle>Favorites</span>
          </a>
          <a mat-list-item (click)="selectRecent()">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>Recently Edited</span>
          </a>
        </mat-nav-list>
      </mat-expansion-panel>

      <mat-divider />

      <!-- Schemas section -->
      <mat-expansion-panel class="tree-panel" [expanded]="true" hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="section-icon">schema</mat-icon>
            <span>Schemas</span>
          </mat-panel-title>
        </mat-expansion-panel-header>

        <mat-nav-list dense class="tree-list">
          @for (schema of schemas; track schema.id) {
            <a mat-list-item
               (click)="selectFilter(schema.id, null)"
               [class.active]="activeSchemaId() === schema.id">
              <mat-icon matListItemIcon>category</mat-icon>
              <span matListItemTitle>{{ schema.name | titlecase }}</span>
              <span matListItemMeta class="item-count">{{ countBySchema(schema.name) }}</span>
            </a>
          }
          @if (!schemas.length) {
            <p class="empty-hint">No schemas loaded</p>
          }
        </mat-nav-list>
      </mat-expansion-panel>

      <mat-divider />

      <!-- Trait Packs section -->
      <mat-expansion-panel class="tree-panel" [expanded]="false" hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="section-icon">local_offer</mat-icon>
            <span>Trait Packs</span>
          </mat-panel-title>
        </mat-expansion-panel-header>

        <mat-nav-list dense class="tree-list">
          @for (pack of traitPacks; track pack.id) {
            <a mat-list-item
               (click)="selectFilter(null, pack.id)"
               [class.active]="activeTraitPackId() === pack.id">
              <mat-icon matListItemIcon>tune</mat-icon>
              <span matListItemTitle>{{ pack.name | titlecase }}</span>
              <span matListItemMeta class="item-count">{{ countByTraitPack(pack.id) }}</span>
            </a>
          }
          @if (!traitPacks.length) {
            <p class="empty-hint">No trait packs loaded</p>
          }
        </mat-nav-list>
      </mat-expansion-panel>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .tree-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
    }

    .tree-search {
      padding: 8px 8px 4px;
    }

    .search-field {
      width: 100%;
      font-size: 13px;
    }

    .search-field .mat-mdc-text-field-wrapper { border-radius: 8px; }

    .tree-panel {
      box-shadow: none !important;
      border-radius: 0 !important;
      background: transparent !important;
    }

    .tree-panel ::ng-deep .mat-expansion-panel-header {
      padding: 0 12px;
      height: 40px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--omni-text-muted);
    }

    .tree-panel ::ng-deep .mat-expansion-panel-body { padding: 0; }

    .section-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 6px;
      color: var(--omni-accent-light);
    }

    .tree-list a {
      font-size: 13px;
      height: 36px;
      color: var(--omni-text-muted);
      border-left: 3px solid transparent;
      transition: all 0.15s;
    }

    .tree-list a:hover {
      color: var(--omni-text);
      background: rgba(255,255,255,0.04) !important;
    }

    .tree-list a.active {
      color: var(--omni-text) !important;
      background: rgba(124, 92, 191, 0.15) !important;
      border-left: 3px solid var(--omni-accent);
    }

    .item-count {
      font-size: 11px;
      color: var(--omni-text-muted);
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 1px 6px;
    }

    .count-badge {
      font-size: 11px;
      color: var(--omni-text-muted);
    }

    .empty-hint {
      font-size: 12px;
      color: var(--omni-text-muted);
      padding: 4px 16px;
      margin: 0;
    }
  `],
})
export class CeCharacterTreeComponent implements OnChanges {
  @Input() entities: CeEntity[] = [];
  @Input() schemas: CeSchema[] = [];
  @Input() traitPacks: CeTraitPack[] = [];

  @Output() filterChanged = new EventEmitter<CeTreeFilter>();

  searchTerm = '';
  activeSchemaId = signal<string | null>(null);
  activeTraitPackId = signal<string | null>(null);

  ngOnChanges(): void {
    this.emitFilter();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.emitFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.emitFilter();
  }

  selectFilter(schemaId: string | null, traitPackId: string | null): void {
    this.activeSchemaId.set(schemaId);
    this.activeTraitPackId.set(traitPackId);
    this.emitFilter();
  }

  selectFavorites(): void {
    // Placeholder – no favorites field on entity yet
    this.selectFilter(null, null);
  }

  selectRecent(): void {
    // Placeholder – no updatedAt field on entity yet
    this.selectFilter(null, null);
  }

  countBySchema(schemaName: string): number {
    return this.entities.filter((e) => e.schema === schemaName).length;
  }

  countByTraitPack(packId: string): number {
    return this.entities.filter((e) => e.traitPacks?.includes(packId)).length;
  }

  private emitFilter(): void {
    this.filterChanged.emit({
      search: this.searchTerm,
      schemaId: this.activeSchemaId(),
      traitPackId: this.activeTraitPackId(),
    });
  }
}
