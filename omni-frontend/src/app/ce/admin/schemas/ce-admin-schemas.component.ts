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

import { CeSchemaService } from '../../services/ce-schema.service';
import { CeSchema } from '../../models/ce-schema.model';

/**
 * Admin panel — Schemas
 * Roles: sc_acct_mgr only
 *
 * 3-panel layout:
 *   LEFT:   searchable list of schemas
 *   RIGHT:  create / edit form
 */
@Component({
  selector: 'ce-admin-schemas',
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
  ],
  template: `
    <div class="admin-panel">

      <!-- CENTER: list -->
      <div class="panel-list">
        <div class="panel-list-header">
          <span class="panel-title">Schemas</span>
          <button mat-icon-button matTooltip="New schema" (click)="newItem()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
        <mat-divider />

        @if (loading()) {
          <div class="center-spinner"><mat-spinner diameter="28" /></div>
        }

        <mat-selection-list [multiple]="false">
          @for (schema of schemas(); track schema.id) {
            <mat-list-option [value]="schema" (click)="select(schema)"
                             [selected]="selected()?.id === schema.id">
              <mat-icon matListItemIcon>schema</mat-icon>
              <span matListItemTitle>{{ schema.name }}</span>
              <span matListItemLine>{{ schema.id }}</span>
            </mat-list-option>
          }
        </mat-selection-list>
      </div>

      <mat-divider [vertical]="true" />

      <!-- RIGHT: editor -->
      <div class="panel-editor">
        @if (selected() || creating()) {
          <div class="editor-header">
            <mat-icon>schema</mat-icon>
            <span>{{ creating() ? 'New Schema' : selected()!.name }}</span>
          </div>
          <mat-divider />

          <form [formGroup]="form" (ngSubmit)="save()" class="editor-form">
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>ID (slug)</mat-label>
              <input matInput formControlName="id" placeholder="e.g. character" [readonly]="!creating()">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            @if (error()) {
              <p class="error-msg">{{ error() }}</p>
            }

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
            <mat-icon>schema</mat-icon>
            <p>Select a schema or create a new one</p>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    @use 'panel-common' as *;
  `],
})
export class CeAdminSchemasComponent {
  private svc = inject(CeSchemaService);
  private fb  = inject(FormBuilder);

  schemas   = signal<CeSchema[]>([]);
  selected  = signal<CeSchema | null>(null);
  creating  = signal(false);
  loading   = signal(false);
  saving    = signal(false);
  error     = signal('');

  form = this.fb.group({
    id:          ['', Validators.required],
    name:        ['', Validators.required],
    description: [''],
  });

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.listSchemas().subscribe({
      next: (items) => { this.schemas.set(items); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  select(schema: CeSchema): void {
    this.creating.set(false);
    this.selected.set(schema);
    this.form.patchValue({ id: schema.id, name: schema.name, description: schema.description ?? '' });
    this.error.set('');
  }

  newItem(): void {
    this.selected.set(null);
    this.creating.set(true);
    this.form.reset();
    this.error.set('');
  }

  cancel(): void {
    this.creating.set(false);
    this.selected.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const val = this.form.getRawValue();

    const op$ = this.creating()
      ? this.svc.createSchema({ id: val['id'] ?? '', name: val['name'] ?? '', description: val['description'] ?? undefined })
      : this.svc.updateSchema(this.selected()!.id, { name: val['name'] ?? '', description: val['description'] ?? undefined });

    op$.subscribe({
      next: () => { this.saving.set(false); this.creating.set(false); this.load(); },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set((e as { error?: { detail?: string }; message?: string })?.error?.detail ?? 'Save failed');
      },
    });
  }
}
