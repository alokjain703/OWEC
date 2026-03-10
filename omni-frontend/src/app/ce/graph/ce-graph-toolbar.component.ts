import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

export interface GraphFilter {
  showCharacters: boolean;
  showFactions: boolean;
  showLocations: boolean;
  showItems: boolean;
  relationshipType: string;
  searchQuery: string;
}

@Component({
  selector: 'ce-graph-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  template: `
    <div class="graph-toolbar">
      <!-- Left: action buttons -->
      <div class="toolbar-left">
        <button mat-stroked-button color="primary" class="toolbar-btn"
                (click)="addRelationship.emit()"
                matTooltip="Create a new relationship">
          <mat-icon>add_link</mat-icon>
          <span class="btn-label">Relationship</span>
        </button>

        <button mat-icon-button (click)="fitGraph.emit()" matTooltip="Fit graph to screen">
          <mat-icon>fit_screen</mat-icon>
        </button>

        <button mat-icon-button
                [class.active]="showLabels()"
                (click)="toggleLabels()"
                matTooltip="Toggle labels">
          <mat-icon>label</mat-icon>
        </button>

        <button mat-icon-button
                [class.active]="physicsEnabled()"
                (click)="togglePhysics()"
                matTooltip="Toggle physics simulation">
          <mat-icon>bubble_chart</mat-icon>
        </button>

        <!-- Filter menu -->
        <button mat-icon-button [matMenuTriggerFor]="filterMenu" matTooltip="Filter graph">
          <mat-icon>filter_list</mat-icon>
        </button>
        <mat-menu #filterMenu="matMenu" class="filter-menu">
          <div class="filter-panel" (click)="$event.stopPropagation()">
            <p class="filter-heading">Entity Types</p>
            <mat-slide-toggle [(ngModel)]="filter().showCharacters"
                              (change)="emitFilter()">Characters</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="filter().showFactions"
                              (change)="emitFilter()">Factions</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="filter().showLocations"
                              (change)="emitFilter()">Locations</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="filter().showItems"
                              (change)="emitFilter()">Items</mat-slide-toggle>
          </div>
        </mat-menu>
      </div>

      <!-- Right: search -->
      <div class="toolbar-right">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput
                 placeholder="Search nodes…"
                 [(ngModel)]="searchQuery"
                 (ngModelChange)="onSearchChange($event)">
          @if (searchQuery) {
            <button matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .graph-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid var(--omni-border, #e0e0e0);
      background: var(--omni-surface, #fff);
      gap: 8px;
      flex-shrink: 0;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar-btn {
      height: 34px;
    }

    .btn-label {
      margin-left: 4px;
      font-size: 13px;
    }

    .active {
      color: var(--mat-primary, #6200ea);
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-field {
      width: 220px;
      font-size: 13px;
    }

    .filter-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
      min-width: 180px;
    }

    .filter-heading {
      margin: 0 0 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-secondary-text, #666);
    }
  `],
})
export class CeGraphToolbarComponent {
  @Output() addRelationship = new EventEmitter<void>();
  @Output() fitGraph = new EventEmitter<void>();
  @Output() filterChanged = new EventEmitter<GraphFilter>();
  @Output() labelsToggled = new EventEmitter<boolean>();
  @Output() physicsToggled = new EventEmitter<boolean>();
  @Output() searchChanged = new EventEmitter<string>();

  showLabels = signal(true);
  physicsEnabled = signal(true);
  searchQuery = '';

  filter = signal<GraphFilter>({
    showCharacters: true,
    showFactions: true,
    showLocations: true,
    showItems: true,
    relationshipType: '',
    searchQuery: '',
  });

  toggleLabels(): void {
    this.showLabels.update((v) => !v);
    this.labelsToggled.emit(this.showLabels());
  }

  togglePhysics(): void {
    this.physicsEnabled.update((v) => !v);
    this.physicsToggled.emit(this.physicsEnabled());
  }

  emitFilter(): void {
    this.filterChanged.emit({ ...this.filter() });
  }

  onSearchChange(query: string): void {
    this.filter.update((f) => ({ ...f, searchQuery: query }));
    this.searchChanged.emit(query);
    this.filterChanged.emit({ ...this.filter(), searchQuery: query });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange('');
  }
}
