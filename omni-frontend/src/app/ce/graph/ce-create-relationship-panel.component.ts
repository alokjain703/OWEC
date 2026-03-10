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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CeEntity } from '../models/ce-entity.model';
import { CeRelationship, CeRelationshipType } from '../models/ce-relationship.model';
import { CeRelationshipService } from '../services/ce-relationship.service';

@Component({
  selector: 'ce-create-relationship-panel',
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
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="panel">

      <!-- Header -->
      <div class="panel-header">
        <div class="header-icon">
          <mat-icon>add_link</mat-icon>
        </div>
        <div class="header-text">
          <h3 class="panel-title">New Relationship</h3>
          <span class="panel-sub">Connect two entities</span>
        </div>
        <button mat-icon-button class="close-btn" matTooltip="Cancel" (click)="cancelled.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider />

      <!-- Form -->
      <div class="panel-body">

        <!-- Source -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Source</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <mat-select [(ngModel)]="sourceId">
            @for (e of entities; track e.id) {
              <mat-option [value]="e.id">{{ e.name || e.id }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Arrow -->
        <div class="arrow-row">
          <mat-icon class="arrow-icon">arrow_downward</mat-icon>
        </div>

        <!-- Target -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Target</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <mat-select [(ngModel)]="targetId">
            @for (e of entities; track e.id) {
              <mat-option [value]="e.id" [disabled]="e.id === sourceId">
                {{ e.name || e.id }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Relationship type -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Relationship Type</mat-label>
          <mat-icon matPrefix>label</mat-icon>
          @if (relTypes.length > 0) {
            <mat-select [(ngModel)]="relType">
              @for (rt of relTypes; track rt.id) {
                <mat-option [value]="rt.id">{{ rt.name }}</mat-option>
              }
            </mat-select>
          } @else {
            <input matInput [(ngModel)]="relType" placeholder="e.g. ally_of, enemy_of">
          }
        </mat-form-field>

        <!-- Metadata -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Metadata (JSON, optional)</mat-label>
          <mat-icon matPrefix>data_object</mat-icon>
          <textarea matInput
                    [(ngModel)]="metadataStr"
                    (ngModelChange)="onMetadataChange()"
                    rows="4"
                    style="font-family: monospace; font-size: 12px;"
                    placeholder='{ "key": "value" }'></textarea>
          @if (metadataError()) {
            <mat-error>{{ metadataError() }}</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <p class="error-msg">
            <mat-icon class="err-icon">error_outline</mat-icon>
            {{ error() }}
          </p>
        }
      </div>

      <mat-divider />

      <!-- Actions -->
      <div class="panel-actions">
        <button mat-stroked-button (click)="cancelled.emit()" [disabled]="saving()">
          Cancel
        </button>
        <button mat-raised-button color="primary"
                [disabled]="!sourceId || !targetId || !relType || saving() || !!metadataError()"
                (click)="submit()">
          @if (saving()) {
            <mat-spinner diameter="18" />
          } @else {
            <mat-icon>add_link</mat-icon>
            Create
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 12px 12px;
    }

    .header-icon {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(98, 0, 234, .12);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: var(--mat-primary, #6200ea); }
    }

    .header-text { flex: 1; overflow: hidden; }

    .panel-title {
      margin: 0 0 2px;
      font-size: 15px;
      font-weight: 600;
    }

    .panel-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--mat-secondary-text, #888);
    }

    .close-btn {
      flex-shrink: 0;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width { width: 100%; }

    .arrow-row {
      display: flex;
      justify-content: center;
      margin: -10px 0;
      mat-icon { color: var(--mat-secondary-text, #bbb); }
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-warn, #f44336);
      font-size: 13px;
      margin: 4px 0 0;
    }

    .err-icon { font-size: 16px; width: 16px; height: 16px; }

    .panel-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px 12px;
    }
  `],
})
export class CeCreateRelationshipPanelComponent implements OnChanges {
  @Input() entities: CeEntity[] = [];
  @Input() relTypes: CeRelationshipType[] = [];
  /** Pre-fill source when opened from a node's inspector */
  @Input() sourceNodeId: string | undefined;

  @Output() created = new EventEmitter<CeRelationship>();
  @Output() cancelled = new EventEmitter<void>();

  sourceId = '';
  targetId = '';
  relType = '';
  metadataStr = '';
  metadataError = signal('');
  saving = signal(false);
  error = signal('');

  constructor(private relSvc: CeRelationshipService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sourceNodeId']) {
      this.sourceId = this.sourceNodeId || '';
    }
    if (changes['relTypes'] && this.relTypes.length > 0 && !this.relType) {
      this.relType = this.relTypes[0].id;
    }
  }

  onMetadataChange(): void {
    if (!this.metadataStr.trim()) { this.metadataError.set(''); return; }
    try { JSON.parse(this.metadataStr); this.metadataError.set(''); }
    catch { this.metadataError.set('Invalid JSON'); }
  }

  submit(): void {
    if (!this.sourceId || !this.targetId || !this.relType) return;

    let metadata: Record<string, unknown> | undefined;
    if (this.metadataStr.trim()) {
      try {
        metadata = JSON.parse(this.metadataStr);
      } catch {
        this.metadataError.set('Invalid JSON — fix before saving');
        return;
      }
    }

    this.saving.set(true);
    this.error.set('');

    this.relSvc
      .createRelationship({ id: '', type: this.relType, source: this.sourceId, target: this.targetId, metadata })
      .subscribe({
        next: (rel) => {
          this.saving.set(false);
          this.created.emit(rel);
          // Reset form for next use
          this.targetId = '';
          this.metadataStr = '';
          this.metadataError.set('');
          this.relType = this.relTypes[0]?.id ?? '';
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.detail || err?.message || 'Failed to create relationship');
        },
      });
  }
}
