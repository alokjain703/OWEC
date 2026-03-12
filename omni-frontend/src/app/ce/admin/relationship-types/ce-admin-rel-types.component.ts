import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { CeRelationshipService } from '../../services/ce-relationship.service';
import { CeSchemaService } from '../../services/ce-schema.service';
import { CeRelationshipType } from '../../models/ce-relationship.model';
import { CeSchema } from '../../models/ce-schema.model';

/**
 * Admin panel — Relationship Types
 * Roles: sc-mgr, sc-acct-mgr
 *
 * 3-panel layout:
 *   LEFT:   list of relationship types
 *   RIGHT:  create / edit form
 */
@Component({
  selector: 'ce-admin-rel-types',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="admin-panel">

      <!-- CENTER: list -->
      <div class="panel-list">
        <div class="panel-list-header">
          <span class="panel-title">Relationship Types</span>
          <button mat-icon-button matTooltip="New type" (click)="newItem()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
        <mat-divider />

        @if (loading()) {
          <div class="center-spinner"><mat-spinner diameter="28" /></div>
        }

        <mat-selection-list [multiple]="false">
          @for (rt of relTypes(); track rt.id) {
            <mat-list-option [value]="rt" (click)="select(rt)"
                             [selected]="selected()?.id === rt.id">
              <mat-icon matListItemIcon>share</mat-icon>
              <span matListItemTitle>{{ rt.name }}</span>
              <span matListItemLine>{{ rt.id }}</span>
            </mat-list-option>
          }
        </mat-selection-list>
      </div>

      <mat-divider [vertical]="true" />

      <!-- RIGHT: editor -->
      <div class="panel-editor">
        @if (selected() || creating()) {
          <div class="editor-header">
            <mat-icon>share</mat-icon>
            <span>{{ creating() ? 'New Relationship Type' : selected()!.name }}</span>
          </div>
          <mat-divider />

          <form [formGroup]="form" (ngSubmit)="save()" class="editor-form">
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Schema</mat-label>
              <mat-select formControlName="schemaId">
                @for (s of schemas(); track s.id) {
                  <mat-option [value]="s.id">{{ s.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>ID (slug)</mat-label>
              <input matInput formControlName="id" [readonly]="!creating()">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            @if (error()) { <p class="error-msg">{{ error() }}</p> }

            <div class="editor-actions">
              <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="16" /> } @else { Save }
              </button>
            </div>
          </form>
        } @else {
          <div class="editor-empty">
            <mat-icon>share</mat-icon>
            <p>Select a relationship type or create a new one</p>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex: 1; overflow: hidden; }
    .admin-panel { display: flex; flex: 1; overflow: hidden; }
    .panel-list  { width: 260px; flex-shrink: 0; overflow-y: auto; }
    .panel-list-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; }
    .panel-title { font-weight: 600; font-size: 14px; }
    .panel-editor { flex: 1; overflow-y: auto; padding: 20px 24px; }
    .editor-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
    .editor-form { display: flex; flex-direction: column; gap: 4px; max-width: 500px; }
    .field-full { width: 100%; }
    .editor-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; }
    .editor-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--mat-secondary-text, #888); }
    .center-spinner { display: flex; justify-content: center; padding: 24px; }
    .error-msg { color: var(--mat-warn, #f44336); font-size: 13px; }
  `],
})
export class CeAdminRelTypesComponent {
  private relSvc    = inject(CeRelationshipService);
  private schemaSvc = inject(CeSchemaService);
  private fb        = inject(FormBuilder);

  relTypes  = signal<CeRelationshipType[]>([]);
  schemas   = signal<CeSchema[]>([]);
  selected  = signal<CeRelationshipType | null>(null);
  creating  = signal(false);
  loading   = signal(false);
  saving    = signal(false);
  error     = signal('');

  form = this.fb.group({
    schemaId:    ['', Validators.required],
    id:          ['', Validators.required],
    name:        ['', Validators.required],
    description: [''],
  });

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.schemaSvc.listSchemas().subscribe((s) => this.schemas.set(s));
    this.relSvc.listRelationshipTypes().subscribe({
      next: (items) => { this.relTypes.set(items); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  select(rt: CeRelationshipType): void {
    this.creating.set(false);
    this.selected.set(rt);
    this.form.patchValue({ id: rt.id, name: rt.name, description: rt.description ?? '', schemaId: rt.schemaId ?? '' });
    this.error.set('');
  }

  newItem(): void { this.selected.set(null); this.creating.set(true); this.form.reset(); this.error.set(''); }
  cancel():  void { this.creating.set(false); this.selected.set(null); this.form.reset(); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const val = this.form.getRawValue();

    const op$ = this.creating()
      ? this.relSvc.createRelationshipType({ id: val['id'] ?? '', name: val['name'] ?? '', schemaId: val['schemaId'] ?? '', description: val['description'] ?? undefined })
      : this.relSvc.updateRelationshipType(this.selected()!.id, { name: val['name'] ?? '', description: val['description'] ?? undefined });

    op$.subscribe({
      next: () => { this.saving.set(false); this.creating.set(false); this.load(); },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set((e as { error?: { detail?: string } })?.error?.detail ?? 'Save failed');
      },
    });
  }
}
