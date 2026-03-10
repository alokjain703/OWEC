import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { CeSchema } from '../models/ce-schema.model';
import { CeRelationshipType } from '../models/ce-relationship.model';
import { CeSchemaService } from '../services/ce-schema.service';
import { CeRelationshipService } from '../services/ce-relationship.service';

interface RelTypeRow {
  /** the live model — may be editing */
  data: CeRelationshipType;
  /** draft state while editing */
  draft?: { name: string; description: string };
  saving: boolean;
  deleting: boolean;
}

@Component({
  selector: 'ce-relationship-type-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="rte-page">

      <!-- ── Page header ── -->
      <div class="page-header">
        <button mat-icon-button routerLink="/ce" class="back-btn" matTooltip="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-text">
          <h2 class="page-title">Relationship Types</h2>
          <span class="page-sub">Define relationship types scoped to a schema</span>
        </div>
      </div>

      <mat-divider />

      <!-- ── Schema selector ── -->
      <div class="schema-bar">
        <mat-form-field appearance="outline" class="schema-select">
          <mat-label>Schema</mat-label>
          <mat-icon matPrefix>schema</mat-icon>
          <mat-select [ngModel]="selectedSchemaId()" (ngModelChange)="onSchemaChange($event)">
            @for (s of schemas(); track s.id) {
              <mat-option [value]="s.id">{{ s.name || s.id }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (selectedSchemaId()) {
          <button mat-raised-button color="primary" (click)="openAddForm()"
                  [disabled]="adding()">
            <mat-icon>add</mat-icon> Add Type
          </button>
        }
      </div>

      <!-- ── Loading / empty ── -->
      @if (loading()) {
        <div class="center-state">
          <mat-spinner diameter="36" />
        </div>
      } @else if (!selectedSchemaId()) {
        <div class="center-state muted">
          <mat-icon>arrow_upward</mat-icon>
          <p>Select a schema to manage its relationship types</p>
        </div>
      } @else if (filteredTypes().length === 0 && !adding()) {
        <div class="center-state muted">
          <mat-icon>device_hub</mat-icon>
          <p>No relationship types yet for <strong>{{ selectedSchemaId() }}</strong></p>
          <button mat-stroked-button (click)="openAddForm()">
            <mat-icon>add</mat-icon> Add first type
          </button>
        </div>
      }

      <!-- ── Add form ── -->
      @if (adding()) {
        <div class="add-card">
          <h4 class="add-title">New Relationship Type</h4>
          <div class="add-form">
            <mat-form-field appearance="outline" class="field-id">
              <mat-label>ID</mat-label>
              <input matInput [(ngModel)]="newId" [placeholder]="selectedSchemaId() + '.ally_of'"
                     (ngModelChange)="onNewNameChange()" />
              <mat-hint>Unique identifier, e.g. character.friend</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-name">
              <mat-label>Name</mat-label>
              <input matInput [(ngModel)]="newName"
                     (ngModelChange)="syncIdFromName()"
                     placeholder="e.g. ally_of" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-desc">
              <mat-label>Description (optional)</mat-label>
              <input matInput [(ngModel)]="newDescription" placeholder="Short description" />
            </mat-form-field>
          </div>
          <div class="add-actions">
            <button mat-stroked-button (click)="cancelAdd()">Cancel</button>
            <button mat-raised-button color="primary"
                    [disabled]="!newId.trim() || !newName.trim() || addSaving()"
                    (click)="saveNew()">
              @if (addSaving()) { <mat-spinner diameter="16" /> } @else { Save }
            </button>
          </div>
          @if (addError()) {
            <p class="error-msg"><mat-icon class="err-icon">error_outline</mat-icon> {{ addError() }}</p>
          }
        </div>

        <mat-divider />
      }

      <!-- ── Type rows ── -->
      @if (filteredTypes().length > 0) {
        <div class="type-list">
          @for (row of filteredRows(); track row.data.id) {
            <div class="type-row" [class.editing]="row.draft">

              @if (!row.draft) {
                <!-- View mode -->
                <div class="row-info">
                  <mat-chip class="id-chip">{{ row.data.id }}</mat-chip>
                  <div class="row-text">
                    <span class="row-name">{{ row.data.name }}</span>
                    @if (row.data.description) {
                      <span class="row-desc">{{ row.data.description }}</span>
                    }
                  </div>
                </div>
                <div class="row-actions">
                  <button mat-icon-button matTooltip="Edit" (click)="startEdit(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" matTooltip="Delete"
                          [disabled]="row.deleting"
                          (click)="confirmDelete(row)">
                    @if (row.deleting) {
                      <mat-spinner diameter="18" />
                    } @else {
                      <mat-icon>delete</mat-icon>
                    }
                  </button>
                </div>

              } @else {
                <!-- Edit mode -->
                <div class="edit-form">
                  <mat-form-field appearance="outline" class="edit-field-name">
                    <mat-label>Name</mat-label>
                    <input matInput [(ngModel)]="row.draft.name" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="edit-field-desc">
                    <mat-label>Description</mat-label>
                    <input matInput [(ngModel)]="row.draft.description" />
                  </mat-form-field>
                </div>
                <div class="row-actions">
                  <button mat-raised-button color="primary"
                          [disabled]="!row.draft.name.trim() || row.saving"
                          (click)="saveEdit(row)">
                    @if (row.saving) { <mat-spinner diameter="16" /> } @else { Save }
                  </button>
                  <button mat-stroked-button (click)="cancelEdit(row)">Cancel</button>
                </div>
              }

            </div>
            <mat-divider />
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }

    .rte-page {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 0 40px;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 12px;
    }

    .back-btn {
      flex-shrink: 0;
      width: 34px; height: 34px;
      line-height: 34px;
      mat-icon {
        font-size: 22px; width: 22px; height: 22px;
        font-variation-settings: 'wght' 600;
        -webkit-text-stroke: 0.4px currentColor;
      }
    }

    .header-text { flex: 1; }

    .page-title {
      margin: 0 0 2px;
      font-size: 20px;
      font-weight: 700;
    }

    .page-sub {
      font-size: 12px;
      color: var(--mat-secondary-text, #888);
    }

    /* ── Schema bar ── */
    .schema-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 16px 8px;
      flex-wrap: wrap;
    }

    .schema-select {
      min-width: 240px;
      flex: 0 0 auto;
    }

    /* ── States ── */
    .center-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 16px;
      color: var(--mat-secondary-text, #999);
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .5; }
      p { margin: 0; text-align: center; }
    }

    /* ── Add form ── */
    .add-card {
      margin: 16px;
      padding: 16px;
      border: 1px solid var(--omni-border, #e0e0e0);
      border-radius: 8px;
      background: var(--omni-surface, #fafafa);
    }

    .add-title {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .add-form {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .field-id   { flex: 0 0 260px; }
    .field-name { flex: 0 0 180px; }
    .field-desc { flex: 1 1 200px; }

    .add-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-warn, #f44336);
      font-size: 13px;
      margin-top: 6px;
    }
    .err-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── Row list ── */
    .type-list {
      margin: 8px 0;
    }

    .type-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      transition: background 0.15s;

      &:hover { background: var(--omni-hover, #f9f9f9); }
      &.editing { background: var(--omni-surface, #f6f6f6); }
    }

    .row-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .id-chip {
      font-size: 11px;
      font-family: monospace;
      min-height: 20px;
      flex-shrink: 0;
    }

    .row-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .row-name {
      font-size: 14px;
      font-weight: 500;
    }

    .row-desc {
      font-size: 12px;
      color: var(--mat-secondary-text, #888);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .row-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    /* ── Edit mode ── */
    .edit-form {
      display: flex;
      gap: 12px;
      flex: 1;
      min-width: 0;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .edit-field-name { flex: 0 0 180px; }
    .edit-field-desc { flex: 1 1 200px; }
  `],
})
export class CeRelationshipTypeEditorComponent implements OnInit {
  schemas = signal<CeSchema[]>([]);
  allTypes = signal<CeRelationshipType[]>([]);
  loading = signal(false);
  adding = signal(false);
  addSaving = signal(false);
  addError = signal('');

  selectedSchemaId = signal('');

  newId = '';
  newName = '';
  newDescription = '';

  rows = signal<RelTypeRow[]>([]);

  filteredTypes = computed(() =>
    this.allTypes().filter((t) => t.schemaId === this.selectedSchemaId())
  );

  filteredRows = computed(() =>
    this.rows().filter((r) => r.data.schemaId === this.selectedSchemaId())
  );

  constructor(
    private schemaSvc: CeSchemaService,
    private relSvc: CeRelationshipService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      schemas: this.schemaSvc.listSchemas().pipe(catchError(() => of<CeSchema[]>([]))),
      types: this.relSvc.listRelationshipTypes().pipe(catchError(() => of<CeRelationshipType[]>([]))),
    }).subscribe(({ schemas, types }) => {
      this.schemas.set(schemas);
      this.allTypes.set(types);
      this.rows.set(types.map((t) => ({ data: t, saving: false, deleting: false })));
      if (schemas.length > 0) this.selectedSchemaId.set(schemas[0].id);
      this.loading.set(false);
    });
  }

  onSchemaChange(id: string): void {
    this.selectedSchemaId.set(id);
    this.adding.set(false);
    this.resetAddForm();
  }

  // ── Add ──────────────────────────────────────────────────────
  openAddForm(): void {
    this.resetAddForm();
    this.adding.set(true);
  }

  cancelAdd(): void {
    this.adding.set(false);
    this.resetAddForm();
  }

  /** Keep ID in sync with schema + name: schemaId.slug */
  syncIdFromName(): void {
    const slug = this.newName.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
    const sid = this.selectedSchemaId();
    this.newId = sid ? `${sid}.${slug}` : slug;
  }

  onNewNameChange(): void {
    // user editing id manually — don't override
  }

  saveNew(): void {
    const id = this.newId.trim();
    const name = this.newName.trim();
    if (!id || !name) return;

    this.addSaving.set(true);
    this.addError.set('');

    const payload: CeRelationshipType = {
      id,
      schemaId: this.selectedSchemaId(),
      name,
      description: this.newDescription.trim() || undefined,
    };

    this.relSvc.createRelationshipType(payload).subscribe({
      next: (created) => {
        this.allTypes.update((list) => [...list, created]);
        this.rows.update((list) => [...list, { data: created, saving: false, deleting: false }]);
        this.addSaving.set(false);
        this.adding.set(false);
        this.resetAddForm();
        this.snack.open(`Type "${created.name}" created`, undefined, { duration: 2500 });
      },
      error: (err) => {
        this.addSaving.set(false);
        this.addError.set(err?.error?.detail || err?.message || 'Failed to create type');
      },
    });
  }

  private resetAddForm(): void {
    this.newId = '';
    this.newName = '';
    this.newDescription = '';
    this.addError.set('');
  }

  // ── Edit ─────────────────────────────────────────────────────
  startEdit(row: RelTypeRow): void {
    // Close any other open edits first
    this.rows.update((list) =>
      list.map((r) => (r === row
        ? { ...r, draft: { name: r.data.name, description: r.data.description ?? '' } }
        : { ...r, draft: undefined }
      ))
    );
  }

  cancelEdit(row: RelTypeRow): void {
    this.rows.update((list) =>
      list.map((r) => (r.data.id === row.data.id ? { ...r, draft: undefined } : r))
    );
  }

  saveEdit(row: RelTypeRow): void {
    if (!row.draft) return;
    const name = row.draft.name.trim();
    const description = row.draft.description.trim() || undefined;
    if (!name) return;

    this.rows.update((list) =>
      list.map((r) => (r.data.id === row.data.id ? { ...r, saving: true } : r))
    );

    this.relSvc.updateRelationshipType(row.data.id, { name, description }).subscribe({
      next: (updated) => {
        this.allTypes.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        this.rows.update((list) =>
          list.map((r) =>
            r.data.id === updated.id
              ? { data: updated, draft: undefined, saving: false, deleting: false }
              : r
          )
        );
        this.snack.open(`Type "${updated.name}" updated`, undefined, { duration: 2500 });
      },
      error: (err) => {
        this.rows.update((list) =>
          list.map((r) => (r.data.id === row.data.id ? { ...r, saving: false } : r))
        );
        this.snack.open(err?.error?.detail || 'Failed to update type', 'Dismiss', { duration: 4000 });
      },
    });
  }

  // ── Delete ───────────────────────────────────────────────────
  confirmDelete(row: RelTypeRow): void {
    if (!confirm(`Delete "${row.data.name}" (${row.data.id})?\n\nThis will also delete all relationships of this type.`)) return;

    this.rows.update((list) =>
      list.map((r) => (r.data.id === row.data.id ? { ...r, deleting: true } : r))
    );

    this.relSvc.deleteRelationshipType(row.data.id).subscribe({
      next: () => {
        this.allTypes.update((list) => list.filter((t) => t.id !== row.data.id));
        this.rows.update((list) => list.filter((r) => r.data.id !== row.data.id));
        this.snack.open(`Type "${row.data.name}" deleted`, undefined, { duration: 2500 });
      },
      error: (err) => {
        this.rows.update((list) =>
          list.map((r) => (r.data.id === row.data.id ? { ...r, deleting: false } : r))
        );
        this.snack.open(err?.error?.detail || 'Failed to delete type', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
