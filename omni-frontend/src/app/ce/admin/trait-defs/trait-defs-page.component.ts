import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { TraitDef } from '../models/trait-def.model';
import { TraitGroup } from '../models/trait-group.model';
import { Schema } from '../models/schema.model';
import { TraitDefService } from './trait-def.service';
import { TraitGroupService } from '../trait-groups/trait-group.service';
import { SchemaService } from '../schemas/schema.service';
import { TraitDefListComponent } from './trait-def-list.component';
import { TraitDefEditorComponent } from './trait-def-editor.component';

@Component({
  selector: 'ce-admin-trait-defs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDividerModule, TraitDefListComponent, TraitDefEditorComponent],
  template: `
    <div class="three-panel-page">
      <trait-def-list
        [items]="defs()"
        [loading]="loading()"
        [selectedId]="selected()?.id"
        (selected)="onSelect($event)"
        (create)="onNew()" />

      <mat-divider [vertical]="true" />

      <div class="editor-pane">
        @if (selected() !== undefined) {
          <trait-def-editor
            [item]="selected() ?? null"
            [schemas]="schemas()"
            [traitGroups]="traitGroups()"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        } @else {
          <div class="editor-empty"><span>Select a trait definition or click + to create one.</span></div>
        }
      </div>
    </div>
  `,
  styles: [`@use 'panel-common' as *;`],
})
export class TraitDefsPageComponent {
  private svc        = inject(TraitDefService);
  private schemaSvc  = inject(SchemaService);
  private groupSvc   = inject(TraitGroupService);

  defs        = signal<TraitDef[]>([]);
  schemas     = signal<Schema[]>([]);
  traitGroups = signal<TraitGroup[]>([]);
  selected    = signal<TraitDef | null | undefined>(undefined);
  loading     = signal(false);
  saving      = signal(false);
  error       = signal('');

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: (d) => { this.defs.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.schemaSvc.getAll().subscribe({ next: (s) => this.schemas.set(s) });
    this.groupSvc.getAll().subscribe({ next: (g) => this.traitGroups.set(g) });
  }

  onSelect(d: TraitDef):              void { this.selected.set(d); this.error.set(''); }
  onNew():                             void { this.selected.set(null); this.error.set(''); }
  onCancel():                          void { this.selected.set(undefined); }

  onSave(payload: Omit<TraitDef, 'id'>): void {
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
