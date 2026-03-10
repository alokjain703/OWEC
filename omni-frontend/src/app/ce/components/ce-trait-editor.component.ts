import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { CeResolvedTrait } from '../models/ce-trait.model';
import { CE_TRAIT_INPUT_MAP } from '../config/ce-schema-config';

@Component({
  selector: 'ce-trait-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="ce-trait-editor">
      @switch (inputType) {
        @case ('input') {
          <mat-form-field class="field" appearance="outline">
            <mat-label>{{ trait.label }}</mat-label>
            <input matInput [ngModel]="value" (ngModelChange)="emitValue($event)" />
          </mat-form-field>
        }
        @case ('textarea') {
          <mat-form-field class="field" appearance="outline">
            <mat-label>{{ trait.label }}</mat-label>
            <textarea matInput rows="3" [ngModel]="value" (ngModelChange)="emitValue($event)"></textarea>
          </mat-form-field>
        }
        @case ('number') {
          <mat-form-field class="field" appearance="outline">
            <mat-label>{{ trait.label }}</mat-label>
            <input matInput type="number" [ngModel]="value" (ngModelChange)="emitValue($event)" />
          </mat-form-field>
        }
        @case ('boolean') {
          <mat-checkbox [ngModel]="value" (ngModelChange)="emitValue($event)">
            {{ trait.label }}
          </mat-checkbox>
        }
        @case ('select') {
          <mat-form-field class="field" appearance="outline">
            <mat-label>{{ trait.label }}</mat-label>
            <mat-select [ngModel]="value" (ngModelChange)="emitValue($event)">
              @for (option of selectOptions; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        @case ('relationship') {
          <mat-form-field class="field" appearance="outline">
            <mat-label>{{ trait.label }}</mat-label>
            <input matInput [ngModel]="value" (ngModelChange)="emitValue($event)" placeholder="Entity ID" />
          </mat-form-field>
        }
      }
    </div>
  `,
  styleUrl: './ce-trait-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeTraitEditorComponent {
  @Input() trait!: CeResolvedTrait;
  @Input() value: unknown;
  @Input() selectOptions: string[] = [];
  @Output() valueChange = new EventEmitter<unknown>();

  get inputType(): string {
    return CE_TRAIT_INPUT_MAP[this.trait.type] || 'input';
  }

  emitValue(value: unknown): void {
    this.valueChange.emit(value);
  }
}
