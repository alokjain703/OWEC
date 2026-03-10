import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

import { OmniGraphNode } from '../../features/relationships/components/relationship-graph/relationship-graph.types';
import { CeEntity } from '../models/ce-entity.model';
import { CeRelationship } from '../models/ce-relationship.model';

@Component({
  selector: 'ce-node-inspector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatListModule,
  ],
  template: `
    <div class="node-inspector">
      <!-- Header -->
      <div class="inspector-header">
        <div class="inspector-avatar" [attr.data-type]="node?.type">
          <mat-icon>{{ typeIcon() }}</mat-icon>
        </div>
        <div class="inspector-title-group">
          <h3 class="node-name">{{ entity()?.name || node?.label || node?.id || '—' }}</h3>
          <span class="node-type">{{ node?.type || 'unknown' }}</span>
        </div>
      </div>

      <mat-divider />

      <!-- Properties -->
      <div class="inspector-body">
        <div class="prop-row">
          <span class="prop-label">ID</span>
          <span class="prop-value mono">{{ node?.id }}</span>
        </div>
        <div class="prop-row">
          <span class="prop-label">Schema</span>
          <span class="prop-value">{{ entity()?.schema || '—' }}</span>
        </div>
        <div class="prop-row">
          <span class="prop-label">Template</span>
          <span class="prop-value">{{ entity()?.template || '—' }}</span>
        </div>
        <div class="prop-row">
          <span class="prop-label">Relationships</span>
          <mat-chip class="rel-chip">{{ nodeRelationships().length }}</mat-chip>
        </div>

        @if (entity()?.traitPacks?.length) {
          <div class="prop-row">
            <span class="prop-label">Trait Packs</span>
            <div class="chip-row">
              @for (pack of entity()!.traitPacks!; track pack) {
                <mat-chip class="pack-chip">{{ pack }}</mat-chip>
              }
            </div>
          </div>
        }

        @if (nodeRelationships().length > 0) {
          <mat-divider class="section-divider" />
          <p class="section-label">Connected to</p>
          <mat-list dense class="rel-list">
            @for (rel of nodeRelationships(); track rel.id) {
              <mat-list-item class="rel-item">
                <mat-icon matListItemIcon class="rel-icon">arrow_right_alt</mat-icon>
                <span matListItemTitle class="rel-target">{{ otherEndLabel(rel) }}</span>
                <span matListItemLine class="rel-type-label">{{ rel.type }}</span>
              </mat-list-item>
            }
          </mat-list>
        }
      </div>

      <!-- Actions -->
      <mat-divider />
      <div class="inspector-actions">
        <button mat-stroked-button (click)="editRequested.emit(node!)">
          <mat-icon>edit</mat-icon> Edit
        </button>
        <button mat-stroked-button (click)="addRelationshipRequested.emit(node!)">
          <mat-icon>add_link</mat-icon> Add Rel
        </button>
        <button mat-icon-button matTooltip="Center graph on this node"
                (click)="centerRequested.emit(node!)">
          <mat-icon>center_focus_strong</mat-icon>
        </button>
        <button mat-icon-button color="warn" matTooltip="Delete node"
                (click)="deleteRequested.emit(node!)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .node-inspector {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .inspector-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 12px 12px;
    }

    .inspector-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--mat-primary-light, rgba(98,0,234,.12));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { color: var(--mat-primary, #6200ea); }
    }

    .inspector-avatar[data-type='faction']       { background: rgba(33,150,243,.12); mat-icon { color: #2196f3; } }
    .inspector-avatar[data-type='item']          { background: rgba(0,150,136,.12); mat-icon { color: #009688; } }
    .inspector-avatar[data-type='location']      { background: rgba(255,152,0,.12); mat-icon { color: #ff9800; } }

    .inspector-title-group {
      overflow: hidden;
    }

    .node-name {
      margin: 0 0 2px;
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-type {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-secondary-text, #888);
    }

    .inspector-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
    }

    .prop-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 5px 0;
    }

    .prop-label {
      min-width: 90px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--mat-secondary-text, #888);
      padding-top: 2px;
    }

    .prop-value {
      font-size: 13px;
      color: var(--mat-text, #222);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .prop-value.mono {
      font-family: monospace;
      font-size: 11px;
      color: var(--mat-secondary-text, #888);
    }

    .chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
    .rel-chip, .pack-chip { font-size: 11px; min-height: 20px; }

    .section-divider { margin: 8px 0; }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--mat-secondary-text, #888);
      margin: 4px 0;
    }

    .rel-list { padding: 0; }
    .rel-item { font-size: 13px; }
    .rel-icon { font-size: 16px; width: 16px; height: 16px; color: var(--mat-secondary-text, #999); }
    .rel-target { font-size: 13px; }
    .rel-type-label { font-size: 11px; color: var(--mat-secondary-text, #888); }

    .inspector-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 12px;
    }
  `],
})
export class CeNodeInspectorComponent implements OnChanges {
  @Input() node: OmniGraphNode | null = null;
  @Input() entities: CeEntity[] = [];
  @Input() relationships: CeRelationship[] = [];

  @Output() editRequested = new EventEmitter<OmniGraphNode>();
  @Output() addRelationshipRequested = new EventEmitter<OmniGraphNode>();
  @Output() centerRequested = new EventEmitter<OmniGraphNode>();
  @Output() deleteRequested = new EventEmitter<OmniGraphNode>();

  private _entity = signal<CeEntity | null>(null);
  private _nodeRels = signal<CeRelationship[]>([]);

  entity = this._entity.asReadonly();
  nodeRelationships = this._nodeRels.asReadonly();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node'] || changes['entities'] || changes['relationships']) {
      const id = this.node?.id;
      this._entity.set(this.entities.find((e) => e.id === id) ?? null);
      this._nodeRels.set(
        this.relationships.filter((r) => r.source === id || r.target === id)
      );
    }
  }

  typeIcon(): string {
    const t = (this.node?.type || '').toLowerCase();
    if (t.includes('faction')) return 'groups';
    if (t.includes('item')) return 'inventory_2';
    if (t.includes('location') || t.includes('place')) return 'place';
    return 'person';
  }

  otherEndLabel(rel: CeRelationship): string {
    const otherId = rel.source === this.node?.id ? rel.target : rel.source;
    const otherEntity = this.entities.find((e) => e.id === otherId);
    return otherEntity?.name || otherId;
  }
}
