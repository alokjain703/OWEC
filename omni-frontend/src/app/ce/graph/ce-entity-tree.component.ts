import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CeEntity } from '../models/ce-entity.model';

interface EntityGroup {
  type: string;
  icon: string;
  entities: CeEntity[];
}

@Component({
  selector: 'ce-entity-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="entity-tree">
      <!-- Search -->
      <div class="tree-search">
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Filter entities…"
                 [(ngModel)]="searchQuery"
                 (ngModelChange)="filterEntities()">
          @if (searchQuery) {
            <button matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      <!-- Groups -->
      <mat-accordion multi class="tree-accordion">
        @for (group of visibleGroups(); track group.type) {
          <mat-expansion-panel [expanded]="true" class="group-panel">
            <mat-expansion-panel-header>
              <mat-panel-title class="group-title">
                <mat-icon class="group-icon">{{ group.icon }}</mat-icon>
                <span>{{ group.type | titlecase }}</span>
                <span class="group-count">{{ group.entities.length }}</span>
              </mat-panel-title>
            </mat-expansion-panel-header>

            <mat-list class="entity-list" dense>
              @for (entity of group.entities; track entity.id) {
                <mat-list-item
                  class="entity-item"
                  [class.selected]="selectedId === entity.id"
                  (click)="selectEntity(entity)"
                  matTooltip="{{ entity.id }}" matTooltipPosition="right">
                  <mat-icon matListItemIcon class="entity-icon">{{ group.icon }}</mat-icon>
                  <span matListItemTitle class="entity-name">{{ entity.name || entity.id }}</span>
                  <button mat-icon-button matListItemMeta class="focus-btn"
                          (click)="$event.stopPropagation(); focusEntity(entity)"
                          matTooltip="Focus in graph">
                    <mat-icon>center_focus_strong</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          </mat-expansion-panel>
        }
      </mat-accordion>

      @if (visibleGroups().length === 0) {
        <div class="empty-tree">
          <mat-icon>person_search</mat-icon>
          <span>No entities found</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .entity-tree {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .tree-search {
      padding: 8px 8px 4px;
      flex-shrink: 0;
    }

    .full-width {
      width: 100%;
    }

    .tree-accordion {
      flex: 1;
      overflow-y: auto;
    }

    .group-panel {
      box-shadow: none !important;
      border-bottom: 1px solid var(--omni-border, #e0e0e0);
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .group-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .group-count {
      margin-left: auto;
      background: var(--omni-border, #e0e0e0);
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 11px;
      font-weight: 500;
    }

    .entity-list {
      padding: 0;
    }

    .entity-item {
      cursor: pointer;
      border-radius: 4px;
      margin: 1px 4px;
      transition: background 0.15s;
    }

    .entity-item:hover {
      background: var(--omni-hover, rgba(0,0,0,.04));
    }

    .entity-item.selected {
      background: var(--mat-primary-light, rgba(98,0,234,.08));
    }

    .entity-name {
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .entity-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--mat-secondary-text, #888);
    }

    .focus-btn {
      opacity: 0;
      width: 24px;
      height: 24px;
      line-height: 24px;
      transition: opacity 0.15s;
    }

    .entity-item:hover .focus-btn {
      opacity: 1;
    }

    .empty-tree {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      gap: 8px;
      color: var(--mat-secondary-text, #888);
      font-size: 13px;
    }

    .empty-tree mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      opacity: 0.4;
    }
  `],
})
export class CeEntityTreeComponent implements OnChanges {
  @Input() entities: CeEntity[] = [];
  @Input() selectedId: string | null = null;
  @Output() entitySelected = new EventEmitter<CeEntity>();
  @Output() entityFocused = new EventEmitter<CeEntity>();

  searchQuery = '';

  private filteredEntities = signal<CeEntity[]>([]);

  visibleGroups = computed<EntityGroup[]>(() => {
    const all = this.filteredEntities();
    const groups: Record<string, EntityGroup> = {
      character: { type: 'character', icon: 'person', entities: [] },
      faction: { type: 'faction', icon: 'groups', entities: [] },
      location: { type: 'location', icon: 'place', entities: [] },
      item: { type: 'item', icon: 'inventory_2', entities: [] },
      other: { type: 'other', icon: 'category', entities: [] },
    };

    for (const e of all) {
      const type = (e.schema || '').toLowerCase();
      if (type.includes('character') || type.includes('char')) {
        groups['character'].entities.push(e);
      } else if (type.includes('faction')) {
        groups['faction'].entities.push(e);
      } else if (type.includes('location') || type.includes('place')) {
        groups['location'].entities.push(e);
      } else if (type.includes('item')) {
        groups['item'].entities.push(e);
      } else {
        groups['other'].entities.push(e);
      }
    }

    return Object.values(groups).filter((g) => g.entities.length > 0);
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entities']) {
      this.filterEntities();
    }
  }

  filterEntities(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredEntities.set([...this.entities]);
      return;
    }
    this.filteredEntities.set(
      this.entities.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.schema || '').toLowerCase().includes(q)
      )
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterEntities();
  }

  selectEntity(entity: CeEntity): void {
    this.entitySelected.emit(entity);
  }

  focusEntity(entity: CeEntity): void {
    this.entityFocused.emit(entity);
  }
}
