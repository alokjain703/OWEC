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

import { CeTraitService } from '../../services/ce-trait.service';
import { CeSchemaService } from '../../services/ce-schema.service';
import { CeTraitDef } from '../../models/ce-trait.model';
import { CeSchema } from '../../models/ce-schema.model';

/**
 * Admin panel — Trait Definitions
 * Roles: sc_acct_mgr only
 *
 * 3-panel layout:
 *   LEFT:   list of trait definitions
 *   RIGHT:  create / edit form
 */
@Component({
  selector: 'ce-admin-trait-defs',
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
          <span class="panel-title">Trait Definitions</span>
          <button mat-icon-button matTooltip="New trait def" (click)="newItem()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
        <mat-divider />

        @if (loading()) {
          <div class="center-spinner"><mat-spinner diameter="28" /></div>
        }

        <mat-selection-list [multiple]="false">
          @for (def of traitDefs(); track def.id) {
            <mat-list-option [value]="def" (click)="select(def)"
                             [selected]="selected()?.id === def.id">
              <mat-icon matListItemIcon>tune</mat-icon>
              <span matListItemTitle>{{ def.label }}</span>
              <span matListItemLine>{{ def.type }} · {{ def.group }}</span>
            </mat-list-option>
          }
        </mat-selection-list>
      </div>

      <mat-divider [vertical]="true" />

      <!-- RIGHT: editor -->
      <div class="panel-editor">
        @if (selected() || creating()) {
          <div class="editor-header">
            <mat-icon>tune</mat-icon>
            <span>{{ creating() ? 'New Trait Definition' : selected()!.label }}</span>
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
              <mat-label>Trait Key</mat-label>
              <input matInput formControlName="traitKey" placeholder="e.g. age">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Label</mat-label>
              <input matInput formControlName="label">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                @for (t of traitTypes; track t) {
                  <mat-option [value]="t">{{ t }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Group</mat-label>
              <input matInput formControlName="group" placeholder="e.g. Identity">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Source</mat-label>
              <mat-select formControlName="source">
                <mat-option value="schema">schema</mat-option>
                <mat-option value="template">template</mat-option>
                <mat-option value="traitPack">traitPack</mat-option>
              </mat-select>
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
            <mat-icon>tune</mat-icon>
            <p>Select a trait definition or create a new one</p>
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
export class CeAdminTraitDefsComponent {
  readonly traitTypes = ['text', 'long_text', 'number', 'boolean', 'select'];

  private traitSvc  = inject(CeTraitService);
  private schemaSvc = inject(CeSchemaService);
  private fb        = inject(FormBuilder);

  traitDefs = signal<CeTraitDef[]>([]);
  schemas   = signal<CeSchema[]>([]);
  selected  = signal<CeTraitDef | null>(null);
  creating  = signal(false);
  loading   = signal(false);
  saving    = signal(false);
  error     = signal('');

  form = this.fb.group({
    schemaId: ['', Validators.required],
    traitKey: ['', Validators.required],
    label:    ['', Validators.required],
    type:     ['text', Validators.required],
    group:    ['', Validators.required],
    source:   ['schema', Validators.required],
  });

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.schemaSvc.listSchemas().subscribe((s) => this.schemas.set(s));
    this.traitSvc.listTraitDefs().subscribe({
      next: (items) => { this.traitDefs.set(items); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  select(def: CeTraitDef): void {
    this.creating.set(false);
    this.selected.set(def);
    this.form.patchValue({ schemaId: def.schemaId ?? '', traitKey: def.traitKey ?? '', label: def.label, type: def.type, group: def.group, source: def.source });
    this.error.set('');
  }

  newItem(): void { this.selected.set(null); this.creating.set(true); this.form.reset({ type: 'text', source: 'schema' }); this.error.set(''); }
  cancel():  void { this.creating.set(false); this.selected.set(null); this.form.reset(); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const val = this.form.getRawValue();

    const op$ = this.creating()
      ? this.traitSvc.createTraitDef({ id: '', schemaId: val['schemaId'] ?? '', traitKey: val['traitKey'] ?? '', label: val['label'] ?? '', type: val['type'] ?? 'text', group: val['group'] ?? '', source: (val['source'] ?? 'schema') as 'schema' | 'template' | 'traitPack' })
      : this.traitSvc.updateTraitDef(this.selected()!.id, { label: val['label'] ?? '', type: val['type'] ?? 'text', group: val['group'] ?? '' });

    op$.subscribe({
      next: () => { this.saving.set(false); this.creating.set(false); this.load(); },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set((e as { error?: { detail?: string } })?.error?.detail ?? 'Save failed');
      },
    });
  }
}
