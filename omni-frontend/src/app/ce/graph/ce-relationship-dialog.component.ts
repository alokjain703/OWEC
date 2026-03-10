import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CeEntity } from '../models/ce-entity.model';
import { CeRelationship, CeRelationshipType } from '../models/ce-relationship.model';
import { CeRelationshipService } from '../services/ce-relationship.service';

export interface CeRelationshipDialogData {
  sourceId?: string;
  targetId?: string;
  entities: CeEntity[];
  relTypes: CeRelationshipType[];
}

@Component({
  selector: 'ce-relationship-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>add_link</mat-icon>
      Create Relationship
    </h2>

    <mat-dialog-content class="dialog-content">
      <!-- Source -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Source</mat-label>
        <mat-icon matPrefix>person</mat-icon>
        <mat-select [(ngModel)]="sourceId">
          @for (e of data.entities; track e.id) {
            <mat-option [value]="e.id">{{ e.name || e.id }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Arrow indicator -->
      <div class="arrow-row">
        <mat-icon class="arrow-icon">arrow_downward</mat-icon>
      </div>

      <!-- Target -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Target</mat-label>
        <mat-icon matPrefix>person</mat-icon>
        <mat-select [(ngModel)]="targetId">
          @for (e of data.entities; track e.id) {
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
        @if (data.relTypes.length > 0) {
          <mat-select [(ngModel)]="relType">
            @for (rt of data.relTypes; track rt.id) {
              <mat-option [value]="rt.name">{{ rt.name }}</mat-option>
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
        <p class="error-msg">{{ error() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="!sourceId || !targetId || !relType || saving() || !!metadataError()"
              (click)="submit()">
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { Create }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex; align-items: center; gap: 8px;
      mat-icon { color: var(--mat-primary, #6200ea); }
    }

    .dialog-content {
      display: flex; flex-direction: column; gap: 4px;
      min-width: 340px; padding-top: 8px;
    }

    .full-width { width: 100%; }

    .arrow-row {
      display: flex; justify-content: center;
      margin: -8px 0;
    }

    .arrow-icon {
      color: var(--mat-secondary-text, #aaa);
    }

    .error-msg {
      color: var(--mat-warn, #f44336);
      font-size: 13px;
      margin: 4px 0 0;
    }
  `],
})
export class CeRelationshipDialogComponent {
  sourceId: string;
  targetId: string;
  relType = '';
  metadataStr = '';
  metadataError = signal('');
  saving = signal(false);
  error = signal('');

  constructor(
    private relSvc: CeRelationshipService,
    private dialogRef: MatDialogRef<CeRelationshipDialogComponent, CeRelationship>,
    @Inject(MAT_DIALOG_DATA) public data: CeRelationshipDialogData,
  ) {
    this.sourceId = data.sourceId || '';
    this.targetId = data.targetId || '';
    if (data.relTypes.length > 0) {
      this.relType = data.relTypes[0].name;
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

    const payload: CeRelationship = {
      id: '',
      type: this.relType,
      source: this.sourceId,
      target: this.targetId,
      metadata,
    };

    this.relSvc.createRelationship(payload).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.dialogRef.close(created);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail || err?.message || 'Failed to create relationship');
      },
    });
  }
}
