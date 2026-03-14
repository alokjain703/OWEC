import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { ContentFormat } from '../models/import-tree.model';

@Component({
  selector: 'omni-content-format-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonToggleModule, MatIconModule],
  template: `
    <div class="selector-wrap">
      <span class="label">Content format</span>
      <mat-button-toggle-group
        [value]="format()"
        (change)="formatSelected.emit($event.value)">
        <mat-button-toggle value="html">
          <mat-icon>code</mat-icon> HTML
        </mat-button-toggle>
        <mat-button-toggle value="markdown">
          <mat-icon>text_fields</mat-icon> Markdown
        </mat-button-toggle>
        <mat-button-toggle value="plain">
          <mat-icon>notes</mat-icon> Plain text
        </mat-button-toggle>
        <mat-button-toggle value="json">
          <mat-icon>data_object</mat-icon> JSON
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  styles: [`
    .selector-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .label {
      font-size: 13px;
      color: rgba(0,0,0,0.6);
      font-weight: 500;
      white-space: nowrap;
    }
    mat-button-toggle-group {
      font-size: 12px;
    }
  `],
})
export class ContentFormatSelectorComponent {
  format = input<ContentFormat>('html');
  formatSelected = output<ContentFormat>();
}
