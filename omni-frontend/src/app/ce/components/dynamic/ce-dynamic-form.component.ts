import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CeTraitGroup } from '../../models/ce-trait-group.model';
import { CeDynamicFieldComponent } from './ce-dynamic-field.component';

/**
 * Renders a list of trait groups, each containing dynamic fields.
 *
 * Usage:
 *   <ce-dynamic-form
 *     [groups]="groups"
 *     [form]="myFormGroup"
 *     [saving]="saving()"
 *     (formSubmit)="onSave($event)" />
 */
@Component({
  selector: 'ce-dynamic-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CeDynamicFieldComponent,
  ],
  template: `
    <form [formGroup]="form" class="dynamic-form" (ngSubmit)="submit()">

      @for (group of groups; track group.name) {
        <section class="trait-group">
          <div class="group-title">{{ group.name }}</div>
          <mat-divider />

          <div class="group-fields">
            @for (trait of group.traits; track trait.id) {
              <ce-dynamic-field [trait]="trait" [form]="form" />
            }
          </div>
        </section>
      }

      <div class="form-actions">
        <button mat-raised-button color="primary"
                type="submit"
                [disabled]="form.invalid || saving">
          @if (saving) {
            <mat-spinner diameter="18" />
          } @else {
            <mat-icon>save</mat-icon>
            Save
          }
        </button>
      </div>

    </form>
  `,
  styles: [`
    .dynamic-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .trait-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .group-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-secondary-text, #666);
      padding-bottom: 4px;
    }

    .group-fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 4px 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 8px;
    }
  `],
})
export class CeDynamicFormComponent {
  @Input({ required: true }) groups!: CeTraitGroup[];
  @Input({ required: true }) form!: FormGroup;
  @Input() saving = false;

  @Output() formSubmit = new EventEmitter<Record<string, unknown>>();

  submit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.getRawValue() as Record<string, unknown>);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
