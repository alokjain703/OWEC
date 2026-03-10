import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';

import { CeEntity } from '../models/ce-entity.model';

@Component({
  selector: 'ce-entity-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  template: `
    <mat-nav-list>
      @for (entity of entities; track entity.id) {
        <a mat-list-item (click)="select(entity)">
          <span>{{ entity.name || entity.id }}</span>
          <span class="meta">{{ entity.schema }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styleUrl: './ce-entity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeEntityListComponent {
  @Input() entities: CeEntity[] = [];
  @Output() entitySelected = new EventEmitter<CeEntity>();

  select(entity: CeEntity): void {
    this.entitySelected.emit(entity);
  }
}
