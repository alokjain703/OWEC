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

import { RelationshipType } from '../models/relationship-type.model';
import { Schema } from '../models/schema.model';

@Component({
  selector: 'relationship-type-editor',
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
        <mat-icon>share</mat-icon>
        <span>{{ item ? 'Edit Relationship Type' : 'New Relationship Type' }}</span>
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
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. FRIEND_OF">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
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
  styleUrls: ['../_panel-common.scss'],
})
export class RelationshipTypeEditorComponent implements OnChanges {
  @Input() item: RelationshipType | null = null;
  @Input() schemas: Schema[]             = [];
  @Input() saving                        = false;
  @Input() errorMsg                      = '';

  @Output() save   = new EventEmitter<Omit<RelationshipType, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    schemaId:    ['', Validators.required],
    name:        ['', Validators.required],
    description: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.item ? this.form.patchValue({ ...this.item }) : this.form.reset();
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.save.emit({
      schemaId:    v.schemaId    ?? '',
      name:        v.name        ?? '',
      description: v.description || undefined,
    });
  }
}
