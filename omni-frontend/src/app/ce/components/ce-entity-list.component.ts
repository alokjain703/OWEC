import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { CeEntity } from '../models/ce-entity.model';
import { FavoriteToggleComponent } from '../../features/my-workspace/components/favorite-toggle.component';

@Component({
  selector: 'ce-entity-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, FavoriteToggleComponent],
  template: `
    <mat-nav-list>
      @for (entity of entities; track entity.id) {
        <a mat-list-item (click)="select(entity)">
          <span>{{ entity.name || entity.id }}</span>
          <span class="meta">{{ entity.schema }}</span>
          <omni-favorite-toggle
            matListItemMeta
            objectType="ce_entity"
            [objectId]="entity.id" />
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
