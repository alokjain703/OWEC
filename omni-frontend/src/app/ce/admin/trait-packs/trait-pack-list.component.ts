import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TraitPack } from '../models/trait-pack.model';
import { Schema } from '../models/schema.model';

const DESCRIPTION_MAX_LEN = 80;

@Component({
  selector: 'trait-pack-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatListModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatDividerModule, MatProgressSpinnerModule,
    MatPaginatorModule, MatTooltipModule,
  ],
  template: `
    <div class="list-panel">
      <div class="list-header">
        <h3 class="list-title"><mat-icon>inventory_2</mat-icon> Trait Packs</h3>
        <button mat-mini-fab color="primary" (click)="create.emit()"><mat-icon>add</mat-icon></button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input matInput [ngModel]="query" (ngModelChange)="query=$event; pageIndex=0" placeholder="Filter by name…">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-divider />

      <div class="col-header">
        <span class="col-icon-spacer"></span>
        <span class="col-name">Name</span>
        <span class="col-schema">Schema</span>
        <span class="col-traits">Traits</span>
        <span class="col-desc">Description</span>
      </div>

      @if (loading) {
        <div class="center-spinner"><mat-spinner diameter="28" /></div>
      } @else {
        <mat-selection-list [multiple]="false" class="item-list">
          @for (item of paged; track item.id) {
            <mat-list-option [value]="item" [selected]="selectedId === item.id" (click)="selected.emit(item)">
              <mat-icon matListItemIcon>inventory_2</mat-icon>
              <div matListItemTitle class="row-content">
                <span class="col-name">{{ item.name }}</span>
                <span class="col-schema meta-text">{{ schemaName(item.schemaId) }}</span>
                <span class="col-traits meta-text">{{ item.traitDefIds.length }}</span>
                <span class="col-desc meta-text desc-cell"
                      [matTooltip]="item.description ?? ''"
                      [matTooltipDisabled]="!item.description"
                      matTooltipShowDelay="300">{{ truncate(item.description ?? '') }}</span>
              </div>
            </mat-list-option>
          }
          @if (filtered.length === 0) {
            <mat-list-item disabled><span matListItemTitle class="empty-text">No trait packs</span></mat-list-item>
          }
        </mat-selection-list>
        @if (filtered.length > pageSize) {
          <mat-paginator [length]="filtered.length" [pageSize]="pageSize"
            [pageIndex]="pageIndex" [hidePageSize]="true"
            (page)="pageIndex = $event.pageIndex" />
        }
      }
    </div>
  `,
  styleUrls: ['../_panel-common.scss'],
  styles: [`
    .search-field { padding: 8px 12px 0; width: 100%; }
    .item-list { flex: 1; overflow-y: auto; }
    .col-header {
      display: flex; align-items: center; padding: 4px 16px;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      color: var(--mat-secondary-text, #757575);
    }
    .col-icon-spacer { flex: 0 0 60px; }
    .row-content  { display: flex; align-items: center; gap: 8px; width: 100%; overflow: hidden; }
    .col-name     { flex: 0 0 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-schema   { flex: 0 0 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-traits   { flex: 0 0 44px; text-align: right; white-space: nowrap; margin-right: 16px; }
    .col-desc     { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
    .meta-text    { font-size: 12px; color: var(--mat-secondary-text, #757575); }
    .empty-text   { font-style: italic; color: var(--mat-secondary-text, #757575); }
  `],
})
export class TraitPackListComponent {
  @Input() items: TraitPack[] = [];
  @Input() schemas: Schema[]   = [];
  @Input() loading             = false;
  @Input() selectedId?: string;

  @Output() selected = new EventEmitter<TraitPack>();
  @Output() create   = new EventEmitter<void>();

  query    = '';
  pageIndex = 0;
  readonly pageSize = 10;

  schemaName(id: string): string {
    return this.schemas.find(s => s.id === id)?.name ?? id;
  }

  truncate(text: string): string {
    return text.length > DESCRIPTION_MAX_LEN ? text.slice(0, DESCRIPTION_MAX_LEN) + '\u2026' : text;
  }

  get filtered(): TraitPack[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.items.filter((p) => p.name.toLowerCase().includes(q)) : this.items;
  }

  get paged(): TraitPack[] {
    return this.filtered.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }
}
