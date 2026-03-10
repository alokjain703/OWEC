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
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CeEntity } from '../models/ce-entity.model';
import { CeTemplateLevel } from '../models/ce-template.model';
import { CeCharacterEditorComponent } from './ce-character-editor.component';

type InspectorMode = 'overview' | 'detail' | 'edit';

@Component({
  selector: 'ce-property-inspector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    CeCharacterEditorComponent,
  ],
  template: `
    <div class="inspector-panel">
      <!-- Header -->
      <div class="inspector-header">
        <div class="inspector-title">
          @switch (mode()) {
            @case ('edit') {
              <mat-icon>edit</mat-icon>
              <span>Edit Character</span>
            }
            @case ('detail') {
              <mat-icon>person</mat-icon>
              <span>{{ entity?.name || 'Character' }}</span>
            }
            @default {
              <mat-icon>dashboard</mat-icon>
              <span>Overview</span>
            }
          }
        </div>
        @if (mode() === 'edit') {
          <button mat-icon-button matTooltip="Cancel edit" (click)="closeEdit.emit()">
            <mat-icon>close</mat-icon>
          </button>
        }
        @if (mode() === 'detail') {
          <button mat-icon-button matTooltip="Edit character" (click)="editRequested.emit()">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </div>

      <!-- OVERVIEW MODE -->
      @if (mode() === 'overview') {
        <div class="inspector-body">
          <!-- Stats grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ totalEntities }}</span>
              <span class="stat-label">Characters</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ totalRelationships }}</span>
              <span class="stat-label">Relationships</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ traitPackCount }}</span>
              <span class="stat-label">Trait Packs</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ schemaCount }}</span>
              <span class="stat-label">Schemas</span>
            </div>
          </div>

          <mat-divider />

          <!-- Quick actions -->
          <div class="section-label">Quick Actions</div>
          <div class="action-list">
            <button mat-stroked-button class="action-btn" (click)="createCharacter.emit()">
              <mat-icon>person_add</mat-icon>
              Create Character
            </button>
            <button mat-stroked-button class="action-btn" (click)="viewRelationships.emit()">
              <mat-icon>hub</mat-icon>
              View Relationships
            </button>
            <button mat-stroked-button class="action-btn" (click)="openGraph.emit()">
              <mat-icon>device_hub</mat-icon>
              Open Graph
            </button>
            <button mat-stroked-button class="action-btn" routerLink="/ce/rel-types">
              <mat-icon>category</mat-icon>
              Manage Rel Types
            </button>
          </div>
        </div>
      }

      <!-- DETAIL MODE -->
      @if (mode() === 'detail' && entity) {
        <div class="inspector-body">
          <!-- Template badge -->
          <div class="detail-template">
            <span class="template-badge" [class]="'template-' + entity.template.toLowerCase()">
              {{ entity.template }}
            </span>
            <span class="schema-chip">{{ entity.schema }}</span>
          </div>

          <mat-divider />

          <!-- Traits summary -->
          <div class="section-label">Trait Packs</div>
          @if (entity.traitPacks.length) {
            <div class="trait-chips">
              @for (pack of entity.traitPacks; track pack) {
                <mat-chip>{{ pack }}</mat-chip>
              }
            </div>
          } @else {
            <div class="empty-hint">No trait packs assigned</div>
          }

          <!-- Metadata keys -->
          @if (entity.metadata && objectKeys(entity.metadata).length > 0) {
            <mat-divider />
            <div class="section-label">Metadata</div>
            <div class="metadata-list">
              @for (key of objectKeys(entity.metadata); track key) {
                <div class="meta-row">
                  <span class="meta-key">{{ key }}</span>
                  <span class="meta-val">{{ entity.metadata[key] }}</span>
                </div>
              }
            </div>
          }

          <mat-divider />

          <!-- Actions -->
          <div class="action-list">
            <button mat-flat-button color="accent" class="action-btn" (click)="editRequested.emit()">
              <mat-icon>edit</mat-icon>
              Edit Character
            </button>
            <button mat-stroked-button class="action-btn" (click)="viewRelationships.emit()">
              <mat-icon>hub</mat-icon>
              View Relationships
            </button>
            <button mat-stroked-button class="action-btn" (click)="openGraph.emit()">
              <mat-icon>device_hub</mat-icon>
              Open Graph
            </button>
            <button mat-stroked-button class="action-btn" routerLink="/ce/rel-types">
              <mat-icon>category</mat-icon>
              Manage Rel Types
            </button>
          </div>
        </div>
      }

      <!-- EDIT MODE -->
      @if (mode() === 'edit' && entity) {
        <div class="inspector-body inspector-editor">
          <ce-character-editor [entityId]="entity.id" />
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

    .inspector-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid var(--omni-border);
      min-height: 48px;
      flex-shrink: 0;
    }

    .inspector-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--omni-text);
      overflow: hidden;

      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--omni-accent-light);
        flex-shrink: 0;
      }
    }

    .inspector-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .inspector-editor {
      padding: 0;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .stat-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--omni-border);
      border-radius: 8px;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--omni-accent-light);
      line-height: 1;
    }

    .stat-label {
      font-size: 10px;
      color: var(--omni-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    /* Section labels */
    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--omni-text-muted);
      margin-top: 4px;
    }

    /* Actions */
    .action-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .action-btn {
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }

    /* Detail mode */
    .detail-template {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .template-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;

      &.template-xs { background: rgba(76,175,80,0.2); color: #81c784; }
      &.template-s  { background: rgba(33,150,243,0.2); color: #64b5f6; }
      &.template-m  { background: rgba(255,193,7,0.2);  color: #ffd54f; }
      &.template-l  { background: rgba(255,152,0,0.2);  color: #ffb74d; }
      &.template-xl { background: rgba(244,67,54,0.2);  color: #e57373; }
    }

    .schema-chip {
      background: rgba(124,92,191,0.2);
      color: #b08fff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
    }

    .trait-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    mat-chip {
      font-size: 11px;
      height: 24px;
    }

    .empty-hint {
      font-size: 12px;
      color: var(--omni-text-muted);
      font-style: italic;
    }

    /* Metadata */
    .metadata-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 12px;
      gap: 8px;
    }

    .meta-key {
      color: var(--omni-text-muted);
      flex-shrink: 0;
      max-width: 45%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta-val {
      color: var(--omni-text);
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
    }
  `],
})
export class CePropertyInspectorComponent implements OnChanges {
  @Input() entity: CeEntity | null = null;
  @Input() editMode = false;
  @Input() totalEntities = 0;
  @Input() totalRelationships = 0;
  @Input() traitPackCount = 0;
  @Input() schemaCount = 0;

  @Output() editRequested = new EventEmitter<void>();
  @Output() closeEdit = new EventEmitter<void>();
  @Output() createCharacter = new EventEmitter<void>();
  @Output() viewRelationships = new EventEmitter<void>();
  @Output() openGraph = new EventEmitter<void>();

  private _entity = signal<CeEntity | null>(null);
  private _editMode = signal(false);

  mode = computed<InspectorMode>(() => {
    if (this._entity() && this._editMode()) return 'edit';
    if (this._entity()) return 'detail';
    return 'overview';
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entity']) {
      this._entity.set(this.entity);
    }
    if (changes['editMode']) {
      this._editMode.set(this.editMode);
    }
  }

  objectKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj);
  }
}
