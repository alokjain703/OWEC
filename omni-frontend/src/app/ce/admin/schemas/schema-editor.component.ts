import {
  ChangeDetectionStrategy, Component, EventEmitter,
  Input, OnChanges, Output, SimpleChanges, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Schema } from '../models/schema.model';
import { OmniJsonEditorComponent } from '../../../shared/omni-json-editor/omni-json-editor.component';

/**
 * RIGHT PANEL — Schema editor form.
 * Supports both create (item === null) and update (item !== null) modes.
 */
@Component({
  selector: 'schema-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    OmniJsonEditorComponent,
  ],
  template: `
    <div class="editor-panel">

      <div class="editor-header">
        <mat-icon>schema</mat-icon>
        <span>{{ item ? 'Edit Schema' : 'New Schema' }}</span>
      </div>
      <mat-divider />

      <form [formGroup]="form" (ngSubmit)="submit()" class="editor-form">

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>ID (slug)</mat-label>
          <input matInput formControlName="id" placeholder="e.g. human">
          @if (form.get('id')?.hasError('required')) {
            <mat-error>ID is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="field-full json-editor-field">
          <span class="json-field-label">Metadata (JSON)</span>
          <omni-json-editor
            [data]="metadataObject"
            (dataChange)="onMetadataChange($event)"
            mode="tree" />
        </div>

        @if (errorMsg) {
          <p class="error-msg">{{ errorMsg }}</p>
        }

        <div class="editor-actions">
          <button mat-stroked-button type="button" (click)="cancel.emit()">Cancel</button>
          <button mat-raised-button color="primary" type="submit"
                  [disabled]="form.invalid || saving">
            @if (saving) { <mat-spinner diameter="16" /> } @else { Save }
          </button>
        </div>

      </form>
    </div>
  `,
  styleUrls: ['../_panel-common.scss'],
})
export class SchemaEditorComponent implements OnChanges {
  @Input() item: Schema | null = null;
  @Input() saving              = false;
  @Input() errorMsg            = '';

  /** Drives the omni-json-editor [data] input. Updated in ngOnChanges and onMetadataChange. */
  metadataObject: unknown = {};

  @Output() save   = new EventEmitter<Omit<Schema, 'id'> & { id: string }>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    id:          ['', Validators.required],
    name:        ['', Validators.required],
    description: [''],
    metadata:    ['{}', (ctrl: import('@angular/forms').AbstractControl) => {
      try { JSON.parse(ctrl.value || '{}'); return null; }
      catch { return { invalidJson: true }; }
    }],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      if (this.item) {
        this.metadataObject = this.item.metadata ?? {};
        this.form.patchValue({
          id:          this.item.id,
          name:        this.item.name,
          description: this.item.description ?? '',
          metadata:    JSON.stringify(this.item.metadata ?? {}, null, 2),
        });
        this.form.get('id')?.disable();
      } else {
        this.metadataObject = {};
        this.form.reset({ metadata: '{}' });
        this.form.get('id')?.enable();
      }
    }
  }

  onMetadataChange(json: unknown): void {
    this.metadataObject = json;
    this.form.get('metadata')?.setValue(JSON.stringify(json));
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.getRawValue();
    this.save.emit({
      id:          val.id ?? '',
      name:        val.name ?? '',
      description: val.description || undefined,
      metadata:    JSON.parse(val.metadata || '{}'),
    });
  }
}
