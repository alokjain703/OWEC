import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { RelationshipType } from '../models/relationship-type.model';
import { Schema } from '../models/schema.model';
import { RelationshipTypeService } from './relationship-type.service';
import { SchemaService } from '../schemas/schema.service';
import { RelationshipTypeListComponent } from './relationship-type-list.component';
import { RelationshipTypeEditorComponent } from './relationship-type-editor.component';

@Component({
  selector: 'ce-admin-rel-types-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDividerModule, RelationshipTypeListComponent, RelationshipTypeEditorComponent],
  template: `
    <div class="three-panel-page">
      <relationship-type-list
        [items]="relTypes()"
        [loading]="loading()"
        [selectedId]="selected()?.id"
        (selected)="onSelect($event)"
        (create)="onNew()" />

      <mat-divider [vertical]="true" />

      <div class="editor-pane">
        @if (selected() !== undefined) {
          <relationship-type-editor
            [item]="selected() ?? null"
            [schemas]="schemas()"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        } @else {
          <div class="editor-empty"><span>Select a relationship type or click + to create one.</span></div>
        }
      </div>
    </div>
  `,
  styles: [`@use 'panel-common' as *;`],
})
export class RelationshipTypesPageComponent {
  private svc       = inject(RelationshipTypeService);
  private schemaSvc = inject(SchemaService);

  relTypes  = signal<RelationshipType[]>([]);
  schemas   = signal<Schema[]>([]);
  selected  = signal<RelationshipType | null | undefined>(undefined);
  loading   = signal(false);
  saving    = signal(false);
  error     = signal('');

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: (r) => { this.relTypes.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.schemaSvc.getAll().subscribe({ next: (s) => this.schemas.set(s) });
  }

  onSelect(r: RelationshipType):             void { this.selected.set(r); this.error.set(''); }
  onNew():                                    void { this.selected.set(null); this.error.set(''); }
  onCancel():                                 void { this.selected.set(undefined); }

  onSave(payload: Omit<RelationshipType, 'id'>): void {
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
