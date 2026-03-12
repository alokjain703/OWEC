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
import { MatChipsModule } from '@angular/material/chips';

import { TraitDef } from '../models/trait-def.model';

@Component({
  selector: 'trait-def-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatListModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatDividerModule,
    MatProgressSpinnerModule, MatChipsModule,
  ],
  template: `
    <div class="list-panel">
      <div class="list-header">
        <h3 class="list-title"><mat-icon>tune</mat-icon> Trait Definitions</h3>
        <button mat-mini-fab color="primary" (click)="create.emit()"><mat-icon>add</mat-icon></button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="query" placeholder="Filter by name…">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-divider />

      <div class="col-header">
        <span class="col-name">Name</span>
        <span class="col-type">Type</span>
        <span class="col-group">Group</span>
      </div>

      @if (loading) {
        <div class="center-spinner"><mat-spinner diameter="28" /></div>
      } @else {
        <mat-selection-list [multiple]="false" class="item-list">
          @for (item of filtered; track item.id) {
            <mat-list-option [value]="item" [selected]="selectedId === item.id" (click)="selected.emit(item)">
              <mat-icon matListItemIcon>tune</mat-icon>
              <div matListItemTitle class="row-content">
                <span class="col-name">{{ item.label }}</span>
                <mat-chip class="col-type chip-type">{{ item.valueType }}</mat-chip>
                <span class="col-group meta-text">{{ item.groupId || '—' }}</span>
              </div>
            </mat-list-option>
          }
          @if (filtered.length === 0) {
            <mat-list-item disabled><span matListItemTitle class="empty-text">No trait definitions</span></mat-list-item>
          }
        </mat-selection-list>
      }
    </div>
  `,
  styles: [`
    @use 'panel-common' as *;
    .list-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .search-field { padding: 8px 12px 0; width: 100%; }
    .item-list { flex: 1; overflow-y: auto; }
    .col-header {
      display: flex; padding: 4px 16px;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      color: var(--mat-secondary-text, #757575);
    }
    .row-content { display: flex; align-items: center; gap: 8px; width: 100%; }
    .col-name  { flex: 1; }
    .col-type  { width: 90px; }
    .col-group { width: 80px; font-size: 11px; }
    .chip-type { font-size: 10px !important; height: 20px !important; }
    .meta-text { color: var(--mat-secondary-text, #757575); }
    .empty-text { font-style: italic; color: var(--mat-secondary-text, #757575); }
  `],
})
export class TraitDefListComponent {
  @Input() items: TraitDef[] = [];
  @Input() loading            = false;
  @Input() selectedId?: string;

  @Output() selected = new EventEmitter<TraitDef>();
  @Output() create   = new EventEmitter<void>();

  query = '';
  get filtered(): TraitDef[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.items.filter((t) => t.label.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) : this.items;
  }
}
