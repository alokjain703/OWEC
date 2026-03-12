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

import { TraitPack } from '../models/trait-pack.model';

@Component({
  selector: 'trait-pack-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatListModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="list-panel">
      <div class="list-header">
        <h3 class="list-title"><mat-icon>inventory_2</mat-icon> Trait Packs</h3>
        <button mat-mini-fab color="primary" (click)="create.emit()"><mat-icon>add</mat-icon></button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="query" placeholder="Filter by name…">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-divider />

      @if (loading) {
        <div class="center-spinner"><mat-spinner diameter="28" /></div>
      } @else {
        <mat-selection-list [multiple]="false" class="item-list">
          @for (item of filtered; track item.id) {
            <mat-list-option [value]="item" [selected]="selectedId === item.id" (click)="selected.emit(item)">
              <mat-icon matListItemIcon>inventory_2</mat-icon>
              <span matListItemTitle>{{ item.name }}</span>
              <span matListItemLine class="meta-line">{{ item.traitDefIds.length }} traits</span>
            </mat-list-option>
          }
          @if (filtered.length === 0) {
            <mat-list-item disabled><span matListItemTitle class="empty-text">No trait packs</span></mat-list-item>
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
    .meta-line { font-size: 11px; color: var(--mat-secondary-text, #757575); }
    .empty-text { font-style: italic; color: var(--mat-secondary-text, #757575); }
  `],
})
export class TraitPackListComponent {
  @Input() items: TraitPack[] = [];
  @Input() loading             = false;
  @Input() selectedId?: string;

  @Output() selected = new EventEmitter<TraitPack>();
  @Output() create   = new EventEmitter<void>();

  query = '';
  get filtered(): TraitPack[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.items.filter((p) => p.name.toLowerCase().includes(q)) : this.items;
  }
}
