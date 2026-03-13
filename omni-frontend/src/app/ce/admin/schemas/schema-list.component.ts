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

import { Schema } from '../models/schema.model';

const DESCRIPTION_MAX_LEN = 80;

/**
 * CENTER PANEL — scrollable list of schemas with search.
 * Emits a `selected` event when a row is clicked.
 */
@Component({
  selector: 'schema-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
  template: `
    <div class="list-panel">

      <div class="list-header">
        <h3 class="list-title">
          <mat-icon>schema</mat-icon> Schemas
        </h3>
        <button mat-mini-fab color="primary" matTooltip="Create schema" (click)="create.emit()">
          <mat-icon>add</mat-icon>
        </button>
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
        <span class="col-id">ID</span>
        <span class="col-desc">Description</span>
        <span class="col-meta">Metadata Keys</span>
      </div>

      @if (loading) {
        <div class="center-spinner"><mat-spinner diameter="28" /></div>
      } @else {
        <mat-selection-list [multiple]="false" class="item-list">
          @for (item of paged; track item.id) {
            <mat-list-option
              [value]="item"
              [selected]="selectedId === item.id"
              (click)="selected.emit(item)">
              <mat-icon matListItemIcon>schema</mat-icon>
              <div matListItemTitle class="row-content">
                <span class="col-name">{{ item.name }}</span>
                <span class="col-id meta-text">{{ item.id }}</span>
                <span class="col-desc meta-text"
                      [matTooltip]="item.description ?? ''"
                      [matTooltipDisabled]="!item.description"
                      matTooltipShowDelay="300">{{ truncate(item.description ?? '') }}</span>
                <span class="col-meta meta-text">{{ metaKeys(item) }}</span>
              </div>
            </mat-list-option>
          }
          @if (filtered.length === 0) {
            <mat-list-item disabled>
              <span matListItemTitle class="empty-text">No schemas found</span>
            </mat-list-item>
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
    .row-content { display: flex; align-items: center; gap: 8px; width: 100%; overflow: hidden; }
    .col-name { flex: 0 0 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-id   { flex: 0 0 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-desc { flex: 2; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
    .col-meta { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .meta-text  { font-size: 12px; color: var(--mat-secondary-text, #757575); }
    .empty-text { font-style: italic; color: var(--mat-secondary-text, #757575); }
  `],
})
export class SchemaListComponent {
  @Input() items: Schema[]  = [];
  @Input() loading           = false;
  @Input() selectedId?: string;

  @Output() selected = new EventEmitter<Schema>();
  @Output() create   = new EventEmitter<void>();

  query    = '';
  pageIndex = 0;
  readonly pageSize = 10;

  truncate(text: string): string {
    return text.length > DESCRIPTION_MAX_LEN ? text.slice(0, DESCRIPTION_MAX_LEN) + '\u2026' : text;
  }

  metaKeys(item: Schema): string {
    const keys = Object.keys(item.metadata ?? {});
    return keys.length ? keys.join(', ') : '—';
  }

  get filtered(): Schema[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.items.filter((s) => s.name.toLowerCase().includes(q)) : this.items;
  }

  get paged(): Schema[] {
    return this.filtered.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }
}
