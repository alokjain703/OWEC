import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { CE_TEMPLATE_LEVELS } from '../config/ce-schema-config';
import { CeTemplateLevel } from '../models/ce-template.model';

@Component({
  selector: 'ce-template-selector',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule],
  template: `
    <mat-button-toggle-group
      [value]="selected"
      (change)="handleChange($event.value)">
      @for (level of levels; track level) {
        <mat-button-toggle [value]="level">{{ level }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
  styleUrl: './ce-template-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeTemplateSelectorComponent {
  @Input() selected: CeTemplateLevel | null = null;
  @Output() selectedChange = new EventEmitter<CeTemplateLevel>();

  levels = CE_TEMPLATE_LEVELS;

  handleChange(level: CeTemplateLevel): void {
    this.selectedChange.emit(level);
  }
}
