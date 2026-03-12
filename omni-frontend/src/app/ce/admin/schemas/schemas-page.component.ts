import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { Schema } from '../models/schema.model';
import { SchemaService } from './schema.service';
import { SchemaListComponent } from './schema-list.component';
import { SchemaEditorComponent } from './schema-editor.component';

@Component({
  selector: 'ce-admin-schemas-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDividerModule, SchemaListComponent, SchemaEditorComponent],
  template: `
    <div class="three-panel-page">
      <schema-list
        [items]="schemas()"
        [loading]="loading()"
        [selectedId]="selected()?.id"
        (selected)="onSelect($event)"
        (create)="onNew()" />

      <mat-divider [vertical]="true" />

      <div class="editor-pane">
        @if (selected() !== undefined) {
          <schema-editor
            [item]="selected() ?? null"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        } @else {
          <div class="editor-empty">
            <span>Select a schema or click + to create one.</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'panel-common' as *;
  `],
})
export class SchemasPageComponent {
  private svc = inject(SchemaService);

  schemas  = signal<Schema[]>([]);
  selected = signal<Schema | null | undefined>(undefined);
  loading  = signal(false);
  saving   = signal(false);
  error    = signal('');

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  (items) => { this.schemas.set(items); this.loading.set(false); },
      error: ()      => this.loading.set(false),
    });
  }

  onSelect(schema: Schema): void {
    this.selected.set(schema);
    this.error.set('');
  }

  onNew(): void {
    this.selected.set(null);
    this.error.set('');
  }

  onCancel(): void {
    this.selected.set(undefined);
  }

  onSave(payload: Schema): void {
    this.saving.set(true);
    this.error.set('');
    const isNew = !this.selected();
    const op$   = isNew
      ? this.svc.create(payload)
      : this.svc.update(payload.id, payload);

    op$.subscribe({
      next:  () => { this.saving.set(false); this.selected.set(undefined); this.load(); },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set((e as { error?: { detail?: string } })?.error?.detail ?? 'Save failed');
      },
    });
  }
}
