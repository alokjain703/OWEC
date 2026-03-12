import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CeEditorTrait } from '../../models/ce-trait-group.model';

/**
 * Renders a single form field whose control type is driven by trait.type.
 *
 * Supported types:
 *   text      → <input type="text">
 *   long_text → <textarea>
 *   number    → <input type="number">
 *   boolean   → <mat-checkbox>
 *   select    → <mat-select> using trait.options
 */
@Component({
  selector: 'ce-dynamic-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dynamic-field" [ngSwitch]="trait.type">

      <!-- text -->
      <mat-form-field *ngSwitchCase="'text'" appearance="outline" class="field-full">
        <mat-label>{{ trait.label }}</mat-label>
        <input matInput
               [formControl]="control"
               [required]="trait.required"
               [matTooltip]="trait.label" />
        @if (control.invalid && control.touched) {
          <mat-error>{{ trait.label }} is required</mat-error>
        }
      </mat-form-field>

      <!-- long_text -->
      <mat-form-field *ngSwitchCase="'long_text'" appearance="outline" class="field-full">
        <mat-label>{{ trait.label }}</mat-label>
        <textarea matInput
                  [formControl]="control"
                  [required]="trait.required"
                  rows="4"></textarea>
        @if (control.invalid && control.touched) {
          <mat-error>{{ trait.label }} is required</mat-error>
        }
      </mat-form-field>

      <!-- number -->
      <mat-form-field *ngSwitchCase="'number'" appearance="outline" class="field-full">
        <mat-label>{{ trait.label }}</mat-label>
        <input matInput
               type="number"
               [formControl]="control"
               [required]="trait.required" />
        @if (control.invalid && control.touched) {
          <mat-error>{{ trait.label }} must be a valid number</mat-error>
        }
      </mat-form-field>

      <!-- boolean -->
      <div *ngSwitchCase="'boolean'" class="field-checkbox">
        <mat-checkbox [formControl]="control">{{ trait.label }}</mat-checkbox>
      </div>

      <!-- select -->
      <mat-form-field *ngSwitchCase="'select'" appearance="outline" class="field-full">
        <mat-label>{{ trait.label }}</mat-label>
        <mat-select [formControl]="control" [required]="trait.required">
          @for (opt of trait.options ?? []; track opt) {
            <mat-option [value]="opt">{{ opt }}</mat-option>
          }
        </mat-select>
        @if (control.invalid && control.touched) {
          <mat-error>{{ trait.label }} is required</mat-error>
        }
      </mat-form-field>

      <!-- fallback: render as text -->
      <mat-form-field *ngSwitchDefault appearance="outline" class="field-full">
        <mat-label>{{ trait.label }}</mat-label>
        <input matInput [formControl]="control" />
      </mat-form-field>

    </div>
  `,
  styles: [`
    .dynamic-field { width: 100%; }
    .field-full    { width: 100%; }
    .field-checkbox { padding: 8px 0; }
  `],
})
export class CeDynamicFieldComponent implements OnInit {
  @Input({ required: true }) trait!: CeEditorTrait;
  @Input({ required: true }) form!: FormGroup;

  get control() {
    return this.form.controls[this.trait.name];
  }

  ngOnInit(): void {
    if (!this.control) {
      throw new Error(
        `[CeDynamicField] No FormControl found for trait "${this.trait.name}". ` +
        `Ensure DynamicFormService.buildForm() was called with this trait.`,
      );
    }
  }
}
