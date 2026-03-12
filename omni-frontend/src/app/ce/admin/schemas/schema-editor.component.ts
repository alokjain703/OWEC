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

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Icon (Material icon name)</mat-label>
          <input matInput formControlName="icon" placeholder="e.g. person">
          @if (form.get('icon')?.value) {
            <mat-icon matSuffix>{{ form.get('icon')!.value }}</mat-icon>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-half">
          <mat-label>Color (hex)</mat-label>
          <input matInput formControlName="color" placeholder="#6200ea">
        </mat-form-field>

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
  styles: [`
    @use 'panel-common' as *;
  `],
})
export class SchemaEditorComponent implements OnChanges {
  @Input() item: Schema | null = null;
  @Input() saving              = false;
  @Input() errorMsg            = '';

  @Output() save   = new EventEmitter<Omit<Schema, 'id'> & { id: string }>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    id:          ['', Validators.required],
    name:        ['', Validators.required],
    description: [''],
    icon:        [''],
    color:       [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      if (this.item) {
        this.form.patchValue({
          id:          this.item.id,
          name:        this.item.name,
          description: this.item.description ?? '',
          icon:        this.item.icon ?? '',
          color:       this.item.color ?? '',
        });
        this.form.get('id')?.disable();
      } else {
        this.form.reset();
        this.form.get('id')?.enable();
      }
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.getRawValue();
    this.save.emit({
      id:          val.id ?? '',
      name:        val.name ?? '',
      description: val.description ?? undefined,
      icon:        val.icon       || undefined,
      color:       val.color      || undefined,
    });
  }
}
