import {
  ChangeDetectionStrategy, Component, EventEmitter, Input,
  OnChanges, Output, SimpleChanges, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { TraitOption } from '../models/trait-option.model';
import { TraitDef } from '../models/trait-def.model';

@Component({
  selector: 'trait-option-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule,
  ],
  template: `
    <div class="editor-panel">
      <div class="editor-header">
        <mat-icon>checklist</mat-icon>
        <span>{{ item ? 'Edit Trait Option' : 'New Trait Option' }}</span>
      </div>
      <mat-divider />

      <form [formGroup]="form" (ngSubmit)="submit()" class="editor-form">

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Trait Definition</mat-label>
          <mat-select formControlName="traitDefId">
            @for (t of traitDefs; track t.id) {
              <mat-option [value]="t.id">{{ t.label }}</mat-option>
            }
          </mat-select>
          @if (form.get('traitDefId')?.hasError('required')) {
            <mat-error>Trait definition is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Value (key)</mat-label>
          <input matInput formControlName="value" placeholder="e.g. red">
          @if (form.get('value')?.hasError('required')) {
            <mat-error>Value is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Label (display)</mat-label>
          <input matInput formControlName="label" placeholder="e.g. Red">
          @if (form.get('label')?.hasError('required')) {
            <mat-error>Label is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Display Order</mat-label>
          <input matInput type="number" formControlName="displayOrder" min="0">
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
  styles: [`@use 'panel-common' as *;`],
})
export class TraitOptionEditorComponent implements OnChanges {
  @Input() item: TraitOption | null = null;
  @Input() traitDefs: TraitDef[]    = [];
  @Input() saving                   = false;
  @Input() errorMsg                 = '';

  @Output() save   = new EventEmitter<Omit<TraitOption, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    traitDefId:   ['', Validators.required],
    value:        ['', Validators.required],
    label:        ['', Validators.required],
    displayOrder: [0],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.item
        ? this.form.patchValue({ ...this.item })
        : this.form.reset({ displayOrder: 0 });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.save.emit({
      traitDefId:   v.traitDefId   ?? '',
      value:        v.value        ?? '',
      label:        v.label        ?? '',
      displayOrder: v.displayOrder ?? 0,
    });
  }
}
