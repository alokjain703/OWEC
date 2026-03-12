import {
  ChangeDetectionStrategy, Component, EventEmitter, Input,
  OnChanges, Output, SimpleChanges, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { TraitDef, TraitValueType, TRAIT_VALUE_TYPE_LABELS } from '../models/trait-def.model';
import { Schema } from '../models/schema.model';
import { TraitGroup } from '../models/trait-group.model';

@Component({
  selector: 'trait-def-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCheckboxModule, MatDividerModule,
    MatFormFieldModule, MatIconModule, MatInputModule,
    MatProgressSpinnerModule, MatSelectModule,
  ],
  template: `
    <div class="editor-panel">
      <div class="editor-header">
        <mat-icon>tune</mat-icon>
        <span>{{ item ? 'Edit Trait Definition' : 'New Trait Definition' }}</span>
      </div>
      <mat-divider />

      <form [formGroup]="form" (ngSubmit)="submit()" class="editor-form">

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Schema</mat-label>
          <mat-select formControlName="schemaId">
            @for (s of schemas; track s.id) {
              <mat-option [value]="s.id">{{ s.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('schemaId')?.hasError('required')) {
            <mat-error>Schema is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Trait Group</mat-label>
          <mat-select formControlName="groupId">
            <mat-option value="">— None —</mat-option>
            @for (g of traitGroups; track g.id) {
              <mat-option [value]="g.id">{{ g.label || g.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Name (key)</mat-label>
          <input matInput formControlName="name" placeholder="e.g. age">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Label (display)</mat-label>
          <input matInput formControlName="label" placeholder="e.g. Age">
          @if (form.get('label')?.hasError('required')) {
            <mat-error>Label is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Value Type</mat-label>
          <mat-select formControlName="valueType">
            @for (entry of valueTypeEntries; track entry.value) {
              <mat-option [value]="entry.value">{{ entry.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Display Order</mat-label>
          <input matInput type="number" formControlName="displayOrder" min="0">
        </mat-form-field>

        <div class="checkbox-row">
          <mat-checkbox formControlName="isRequired">Required</mat-checkbox>
        </div>

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>ID</mat-label>
          <input matInput [value]="item ? item.id : derivedId" readonly>
          <mat-hint>Auto-derived from schema, group and name, e.g. item.identity.strength</mat-hint>
        </mat-form-field>

        @if (errorMsg) { <p class="error-msg">{{ errorMsg }}</p> }

        <div class="editor-actions">
          <button mat-stroked-button type="button" (click)="cancel.emit()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
            @if (saving) { <mat-spinner diameter="16" /> } @else { Save }
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['../_panel-common.scss'],
  styles: [`.checkbox-row { padding: 4px 0 12px; }`],
})
export class TraitDefEditorComponent implements OnChanges {
  @Input() item: TraitDef | null  = null;
  @Input() schemas: Schema[]      = [];
  @Input() traitGroups: TraitGroup[] = [];
  @Input() saving                 = false;
  @Input() errorMsg               = '';

  @Output() save   = new EventEmitter<TraitDef>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  readonly valueTypeEntries = Object.values(TraitValueType).map((v) => ({
    value: v,
    label: TRAIT_VALUE_TYPE_LABELS[v],
  }));

  form = this.fb.group({
    schemaId:     ['', Validators.required],
    groupId:      [''],
    name:         ['', Validators.required],
    label:        ['', Validators.required],
    valueType:    [TraitValueType.TEXT, Validators.required],
    isRequired:   [false],
    displayOrder: [0],
    description:  [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.item
        ? this.form.patchValue({ ...this.item })
        : this.form.reset({ valueType: TraitValueType.TEXT, isRequired: false, displayOrder: 0 });
    }
  }

  get derivedId(): string {
    const schema = this.schemas.find(s => s.id === this.form.get('schemaId')?.value);
    const group  = this.traitGroups.find(g => g.id === this.form.get('groupId')?.value);
    const schemaSlug = (schema?.name ?? '').toLowerCase().replace(/\s+/g, '-');
    const groupSlug  = (group?.name  ?? '').toLowerCase().replace(/\s+/g, '-');
    const nameSlug   = (this.form.get('name')?.value ?? '').toLowerCase().replace(/\s+/g, '-');
    if (!schemaSlug || !nameSlug) return '';
    return groupSlug ? `${schemaSlug}.${groupSlug}.${nameSlug}` : `${schemaSlug}.${nameSlug}`;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.save.emit({
      id:           this.item ? this.item.id : this.derivedId,
      schemaId:     v.schemaId     ?? '',
      groupId:      v.groupId      ?? '',
      name:         v.name         ?? '',
      label:        v.label        ?? '',
      valueType:    (v.valueType   ?? TraitValueType.TEXT) as TraitValueType,
      isRequired:   v.isRequired   ?? false,
      displayOrder: v.displayOrder ?? 0,
      description:  v.description  || undefined,
    });
  }
}
