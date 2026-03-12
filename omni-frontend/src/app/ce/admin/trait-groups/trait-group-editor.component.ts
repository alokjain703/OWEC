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

import { TraitGroup } from '../models/trait-group.model';
import { Schema } from '../models/schema.model';

@Component({
  selector: 'trait-group-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="editor-panel">
      <div class="editor-header">
        <mat-icon>folder</mat-icon>
        <span>{{ item ? 'Edit Trait Group' : 'New Trait Group' }}</span>
      </div>
      <mat-divider />

      <form [formGroup]="form" (ngSubmit)="submit()" class="editor-form">

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Schema</mat-label>
          <input matInput formControlName="schemaId" list="schemaList"
                 placeholder="Schema ID">
          <datalist id="schemaList">
            @for (s of schemas; track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </datalist>
          @if (form.get('schemaId')?.hasError('required')) {
            <mat-error>Schema is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Name (key)</mat-label>
          <input matInput formControlName="name" placeholder="e.g. identity">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Label (display)</mat-label>
          <input matInput formControlName="label" placeholder="e.g. Identity">
          @if (form.get('label')?.hasError('required')) {
            <mat-error>Label is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Display Order</mat-label>
          <input matInput type="number" formControlName="displayOrder" min="0">
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
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
export class TraitGroupEditorComponent implements OnChanges {
  @Input() item: TraitGroup | null = null;
  @Input() schemas: Schema[]       = [];
  @Input() saving                  = false;
  @Input() errorMsg                = '';

  @Output() save   = new EventEmitter<Omit<TraitGroup, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    schemaId:     ['', Validators.required],
    name:         ['', Validators.required],
    label:        ['', Validators.required],
    displayOrder: [0],
    description:  [''],
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
      schemaId:     v.schemaId     ?? '',
      name:         v.name         ?? '',
      label:        v.label        ?? '',
      displayOrder: v.displayOrder ?? 0,
      description:  v.description  || undefined,
    });
  }
}
