import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { TraitGroup } from '../models/trait-group.model';
import { Schema } from '../models/schema.model';
import { TraitGroupService } from './trait-group.service';
import { SchemaService } from '../schemas/schema.service';
import { TraitGroupListComponent } from './trait-group-list.component';
import { TraitGroupEditorComponent } from './trait-group-editor.component';

@Component({
  selector: 'ce-admin-trait-groups-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDividerModule, TraitGroupListComponent, TraitGroupEditorComponent],
  template: `
    <div class="three-panel-page">
      <trait-group-list
        [items]="groups()"
        [loading]="loading()"
        [selectedId]="selected()?.id"
        (selected)="onSelect($event)"
        (create)="onNew()" />

      <mat-divider [vertical]="true" />

      <div class="editor-pane">
        @if (selected() !== undefined) {
          <trait-group-editor
            [item]="selected() ?? null"
            [schemas]="schemas()"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        } @else {
          <div class="editor-empty"><span>Select a trait group or click + to create one.</span></div>
        }
      </div>
    </div>
  `,
  styles: [`@use 'panel-common' as *;`],
})
export class TraitGroupsPageComponent {
  private svc       = inject(TraitGroupService);
  private schemaSvc = inject(SchemaService);

  groups   = signal<TraitGroup[]>([]);
  schemas  = signal<Schema[]>([]);
  selected = signal<TraitGroup | null | undefined>(undefined);
  loading  = signal(false);
  saving   = signal(false);
  error    = signal('');

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  (items) => { this.groups.set(items); this.loading.set(false); },
      error: ()      => this.loading.set(false),
    });
    this.schemaSvc.getAll().subscribe({ next: (s) => this.schemas.set(s) });
  }

  onSelect(g: TraitGroup): void { this.selected.set(g); this.error.set(''); }
  onNew():                  void { this.selected.set(null); this.error.set(''); }
  onCancel():               void { this.selected.set(undefined); }

  onSave(payload: Omit<TraitGroup, 'id'>): void {
    this.saving.set(true);
    this.error.set('');
    const isNew = !this.selected();
    const op$   = isNew
      ? this.svc.create(payload)
      : this.svc.update(this.selected()!.id, payload);

    op$.subscribe({
      next:  () => { this.saving.set(false); this.selected.set(undefined); this.load(); },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set((e as { error?: { detail?: string } })?.error?.detail ?? 'Save failed');
      },
    });
  }
}
