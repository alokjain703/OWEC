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
import { CeTraitPack } from '../../models/ce-trait.model';
import { CeSchema } from '../../models/ce-schema.model';

/**
 * Admin panel — Trait Packs
 * Roles: sc_mgr, sc_acct_mgr
 *
 * 3-panel layout:
 *   LEFT:   searchable list of trait packs
 *   RIGHT:  create / edit form
 */
@Component({
  selector: 'ce-admin-trait-packs',
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
          <span class="panel-title">Trait Packs</span>
          <button mat-icon-button matTooltip="New trait pack" (click)="newItem()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
        <mat-divider />

        @if (loading()) {
          <div class="center-spinner"><mat-spinner diameter="28" /></div>
        }

        <mat-selection-list [multiple]="false">
          @for (pack of packs(); track pack.id) {
            <mat-list-option [value]="pack" (click)="select(pack)"
                             [selected]="selected()?.id === pack.id">
              <mat-icon matListItemIcon>inventory_2</mat-icon>
              <span matListItemTitle>{{ pack.name }}</span>
              <span matListItemLine>{{ pack.schemaId }}</span>
            </mat-list-option>
          }
        </mat-selection-list>
      </div>

      <mat-divider [vertical]="true" />

      <!-- RIGHT: editor -->
      <div class="panel-editor">
        @if (selected() || creating()) {
          <div class="editor-header">
            <mat-icon>inventory_2</mat-icon>
            <span>{{ creating() ? 'New Trait Pack' : selected()!.name }}</span>
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
            <mat-icon>inventory_2</mat-icon>
            <p>Select a trait pack or create a new one</p>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex: 1; overflow: hidden; }
    .admin-panel { display: flex; flex: 1; overflow: hidden; }
    .panel-list  { width: 260px; flex-shrink: 0; overflow-y: auto; padding: 0; }
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
export class CeAdminTraitPacksComponent {
  private traitSvc  = inject(CeTraitService);
  private schemaSvc = inject(CeSchemaService);
  private fb        = inject(FormBuilder);

  packs    = signal<CeTraitPack[]>([]);
  schemas  = signal<CeSchema[]>([]);
  selected = signal<CeTraitPack | null>(null);
  creating  = signal(false);
  loading   = signal(false);
  saving    = signal(false);
  error     = signal('');

  form = this.fb.group({
    schemaId:    ['', Validators.required],
    name:        ['', Validators.required],
    description: [''],
  });

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.schemaSvc.listSchemas().subscribe((s) => this.schemas.set(s));
    this.traitSvc.listTraitPacks().subscribe({
      next: (items) => { this.packs.set(items); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  select(pack: CeTraitPack): void {
    this.creating.set(false);
    this.selected.set(pack);
    this.form.patchValue({ schemaId: pack.schemaId, name: pack.name, description: pack.description ?? '' });
    this.error.set('');
  }

  newItem(): void { this.selected.set(null); this.creating.set(true); this.form.reset(); this.error.set(''); }
  cancel():  void { this.creating.set(false); this.selected.set(null); this.form.reset(); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const val = this.form.getRawValue();
    const payload: Partial<CeTraitPack> = { schemaId: val['schemaId'] ?? '', name: val['name'] ?? '', description: val['description'] ?? undefined };

    const op$ = this.creating()
      ? this.traitSvc.createTraitPack({ id: '', schemaId: val['schemaId'] ?? '', name: val['name'] ?? '', description: val['description'] ?? undefined })
      : this.traitSvc.updateTraitPack(this.selected()!.id, { name: val['name'] ?? '', description: val['description'] ?? undefined });

    op$.subscribe({
      next: () => { this.saving.set(false); this.creating.set(false); this.load(); },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set((e as { error?: { detail?: string } })?.error?.detail ?? 'Save failed');
      },
    });
  }
}
