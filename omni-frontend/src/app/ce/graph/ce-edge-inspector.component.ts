import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OmniGraphEdge } from '../../features/relationships/components/relationship-graph/relationship-graph.types';
import { CeRelationship, CeRelationshipType } from '../models/ce-relationship.model';
import { CeEntity } from '../models/ce-entity.model';
import { CeRelationshipService } from '../services/ce-relationship.service';

@Component({
  selector: 'ce-edge-inspector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="edge-inspector">
      <!-- Header -->
      <div class="inspector-header">
        <div class="edge-icon">
          <mat-icon>link</mat-icon>
        </div>
        <div class="header-text">
          <h3 class="edge-label">{{ edgeTypeLabel }}</h3>
          <span class="edge-sub">Relationship</span>
        </div>
      </div>

      <mat-divider />

      <!-- Source → Target display (swaps visually when flipped) -->
      <div class="endpoints">
        <div class="endpoint source">
          <mat-icon class="ep-icon">person</mat-icon>
          <span class="ep-name">{{ flipped() ? targetName() : sourceName() }}</span>
        </div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="endpoint target">
          <mat-icon class="ep-icon">person</mat-icon>
          <span class="ep-name">{{ flipped() ? sourceName() : targetName() }}</span>
        </div>
      </div>

      <mat-divider />

      <!-- Editable fields -->
      <div class="inspector-body">
        @if (!isEditing()) {
          <div class="prop-row">
            <span class="prop-label">Type</span>
            <mat-chip class="type-chip">{{ edgeTypeLabel }}</mat-chip>
          </div>
          @if (relationship()?.metadata) {
            <div class="prop-row">
              <span class="prop-label">Metadata</span>
              <pre class="meta-pre">{{ relationship()?.metadata | json }}</pre>
            </div>
          }
        } @else {
          <!-- Edit form -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Relationship Type</mat-label>
            <mat-select [(ngModel)]="editedType">
              @for (rt of relTypes; track rt.id) {
                <mat-option [value]="rt.id">{{ rt.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Metadata (JSON)</mat-label>
            <textarea matInput
                      [(ngModel)]="editedMetadataStr"
                      (ngModelChange)="onMetadataChange()"
                      rows="5"
                      class="meta-textarea"
                      placeholder='{ "key": "value" }'></textarea>
            @if (metadataError()) {
              <mat-error>{{ metadataError() }}</mat-error>
            }
          </mat-form-field>

          @if (flipped()) {
            <p class="flip-hint">
              <mat-icon class="hint-icon">swap_horiz</mat-icon>
              Direction will be reversed on save
            </p>
          }
        }

        @if (saveError()) {
          <p class="error-msg">
            <mat-icon class="err-icon">error_outline</mat-icon>
            {{ saveError() }}
          </p>
        }
      </div>

      <!-- Actions -->
      <mat-divider />
      <div class="inspector-actions">
        @if (!isEditing()) {
          <button mat-stroked-button (click)="startEdit()">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button (click)="startFlip()" matTooltip="Flip direction">
            <mat-icon>swap_horiz</mat-icon> Flip
          </button>
          <button mat-icon-button color="warn" matTooltip="Delete relationship"
                  (click)="deleteRequested.emit(relationship()!)">
            <mat-icon>delete</mat-icon>
          </button>
        } @else {
          <button mat-raised-button color="primary" [disabled]="saving() || !!metadataError()"
                  (click)="saveEdit()">
            @if (saving()) { <mat-spinner diameter="18" /> } @else { Save }
          </button>
          <button mat-stroked-button (click)="cancelEdit()">Cancel</button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .edge-inspector {
      display: flex;
      flex-direction: column;
    }

    .inspector-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 12px 12px;
    }

    .edge-icon {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(33,150,243,.12);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #2196f3; }
    }

    .edge-label {
      margin: 0 0 2px; font-size: 14px; font-weight: 600;
    }

    .edge-sub {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;
      color: var(--mat-secondary-text, #888);
    }

    .endpoints {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; flex-wrap: wrap;
    }

    .endpoint {
      display: flex; align-items: center; gap: 4px;
      background: var(--omni-border, #f0f0f0);
      border-radius: 16px; padding: 4px 10px;
    }

    .ep-icon { font-size: 14px; width: 14px; height: 14px; }
    .ep-name { font-size: 13px; font-weight: 500; }

    .arrow { color: var(--mat-secondary-text, #999); }

    .inspector-body {
      padding: 8px 12px;
    }

    .prop-row {
      display: flex; align-items: center; gap: 8px; padding: 5px 0;
    }

    .prop-label {
      min-width: 70px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.4px;
      color: var(--mat-secondary-text, #888);
    }

    .type-chip { font-size: 12px; min-height: 20px; }

    .meta-pre {
      font-size: 11px; font-family: monospace;
      background: var(--omni-surface, #f6f6f6);
      padding: 4px 6px; border-radius: 4px;
      max-width: 200px; overflow: auto; margin: 0;
    }

    .meta-textarea {
      font-size: 11px; font-family: monospace;
      resize: vertical;
      min-height: 80px;
    }

    .full-width { width: 100%; margin-bottom: 2rem; }

    .flip-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--mat-secondary-text, #888);
      margin: 0 0 4px;
    }
    .hint-icon { font-size: 16px; width: 16px; height: 16px; }

    .error-msg {
      display: flex; align-items: center; gap: 6px;
      color: var(--mat-warn, #f44336); font-size: 13px; margin: 4px 0 0;
    }
    .err-icon { font-size: 16px; width: 16px; height: 16px; }

    .inspector-actions {
      display: flex; gap: 6px; flex-wrap: wrap;
      padding: 8px 12px;
    }
  `],
})
export class CeEdgeInspectorComponent implements OnChanges {
  @Input() edge: OmniGraphEdge | null = null;
  @Input() entities: CeEntity[] = [];
  @Input() relTypes: CeRelationshipType[] = [];
  @Input() relationships: CeRelationship[] = [];

  @Output() edited = new EventEmitter<CeRelationship>();
  @Output() deleteRequested = new EventEmitter<CeRelationship>();

  private _relationship = signal<CeRelationship | null>(null);
  private _sourceName = signal('—');
  private _targetName = signal('—');

  relationship = this._relationship.asReadonly();
  sourceName = this._sourceName.asReadonly();
  targetName = this._targetName.asReadonly();
  edgeType = signal('—');
  editingType = signal(false);
  flipped = signal(false);
  saving = signal(false);
  saveError = signal('');
  editedType = '';
  editedMetadataStr = '';
  metadataError = signal('');

  /** True when the form is in edit mode (type change or flip pending) */
  isEditing = this.editingType;

  /** Resolves the raw type value (ID or slug) to a human-readable name. */
  get edgeTypeLabel(): string {
    const val = this.edgeType();
    return this.relTypes.find((rt) => rt.id === val)?.name || val || '—';
  }

  constructor(private relSvc: CeRelationshipService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['edge'] || changes['entities'] || changes['relationships']) {
      const edgeId = this.edge?.id as string;
      const sourceId = typeof this.edge?.source === 'string'
        ? this.edge.source : (this.edge?.source as any)?.id;
      const targetId = typeof this.edge?.target === 'string'
        ? this.edge.target : (this.edge?.target as any)?.id;
      const edgeRelType = (this.edge?.data as any)?.relationshipType ?? this.edge?.type;

      // 1) Direct UUID match
      // 2) Source + target + type match (when edge.id is composite)
      // 3) edge.data if it happens to be a full CeRelationship
      const rel =
        this.relationships.find((r) => r.id === edgeId) ??
        this.relationships.find((r) =>
          r.source === sourceId && r.target === targetId && r.type === edgeRelType
        ) ??
        (this.edge?.data as CeRelationship | undefined) ??
        null;
      this._relationship.set(rel);

      this._sourceName.set(this.entities.find((e) => e.id === sourceId)?.name || sourceId || '—');
      this._targetName.set(this.entities.find((e) => e.id === targetId)?.name || targetId || '—');
      this.edgeType.set(this.edge?.type || rel?.type || '—');
      this.editingType.set(false);
      this.flipped.set(false);
      this.saveError.set('');
    }
  }

  startEdit(): void {
    this.editedType = this.edgeType();
    this.editedMetadataStr = this._relationship()?.metadata
      ? JSON.stringify(this._relationship()!.metadata, null, 2)
      : '';
    this.metadataError.set('');
    this.editingType.set(true);
    this.saveError.set('');
  }

  startFlip(): void {
    this.flipped.set(!this.flipped());
    if (!this.editedType) {
      this.editedType = this.edgeType();
      this.editedMetadataStr = this._relationship()?.metadata
        ? JSON.stringify(this._relationship()!.metadata, null, 2)
        : '';
      this.metadataError.set('');
    }
    this.editingType.set(true);
    this.saveError.set('');
  }

  cancelEdit(): void {
    this.editingType.set(false);
    this.flipped.set(false);
    this.editedType = '';
    this.editedMetadataStr = '';
    this.metadataError.set('');
    this.saveError.set('');
  }

  onMetadataChange(): void {
    if (!this.editedMetadataStr.trim()) {
      this.metadataError.set('');
      return;
    }
    try {
      JSON.parse(this.editedMetadataStr);
      this.metadataError.set('');
    } catch {
      this.metadataError.set('Invalid JSON');
    }
  }

  saveEdit(): void {
    const rel = this._relationship();
    if (!rel) return;

    // Validate metadata JSON before sending
    let parsedMetadata: Record<string, unknown> | undefined;
    if (this.editedMetadataStr.trim()) {
      try {
        parsedMetadata = JSON.parse(this.editedMetadataStr);
      } catch {
        this.metadataError.set('Invalid JSON — fix before saving');
        return;
      }
    } else {
      parsedMetadata = undefined;
    }

    this.saving.set(true);
    this.saveError.set('');

    const update: Partial<CeRelationship> = {
      type: this.editedType || rel.type,
      metadata: parsedMetadata,
    };
    if (this.flipped()) {
      update.source = rel.target;
      update.target = rel.source;
    }

    this.relSvc.updateRelationship(rel.id, update).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.editingType.set(false);
        this.flipped.set(false);
        this.editedMetadataStr = '';
        this.metadataError.set('');
        this.edgeType.set(updated.type);
        this.edited.emit(updated);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.detail || err?.message || 'Failed to save');
      },
    });
  }
}

