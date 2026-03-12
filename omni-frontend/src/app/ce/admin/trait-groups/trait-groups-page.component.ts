import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

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
  imports: [MatSidenavModule, TraitGroupListComponent, TraitGroupEditorComponent],
  template: `
    <mat-drawer-container class="page-container" autosize>
      <mat-drawer position="end" mode="over"
                  [opened]="selected() !== undefined"
                  (closedStart)="onCancel()">
        @if (selected() !== undefined) {
          <trait-group-editor
            [item]="selected() ?? null"
            [schemas]="schemas()"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        }
      </mat-drawer>
      <mat-drawer-content>
        <trait-group-list
          [items]="groups()"
          [loading]="loading()"
          [selectedId]="selected()?.id"
          (selected)="onSelect($event)"
          (create)="onNew()" />
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styles: [`
    :host { display: flex; flex: 1; overflow: hidden; }
    .page-container { flex: 1; height: 100%; }
    mat-drawer { width: 480px; border-left: 1px solid var(--omni-border); background: var(--omni-surface); }
  `],
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

  onSave(payload: TraitGroup): void {
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
