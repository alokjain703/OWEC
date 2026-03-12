import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

import { TraitPack } from '../models/trait-pack.model';
import { TraitDef } from '../models/trait-def.model';
import { Schema } from '../models/schema.model';
import { TraitPackService } from './trait-pack.service';
import { SchemaService } from '../schemas/schema.service';
import { TraitDefService } from '../trait-defs/trait-def.service';
import { TraitPackListComponent } from './trait-pack-list.component';
import { TraitPackEditorComponent } from './trait-pack-editor.component';

@Component({
  selector: 'ce-admin-trait-packs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSidenavModule, TraitPackListComponent, TraitPackEditorComponent],
  template: `
    <mat-drawer-container class="page-container" autosize>
      <mat-drawer position="end" mode="over"
                  [opened]="selected() !== undefined"
                  (closedStart)="onCancel()">
        @if (selected() !== undefined) {
          <trait-pack-editor
            [item]="selected() ?? null"
            [schemas]="schemas()"
            [traitDefs]="traitDefs()"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        }
      </mat-drawer>
      <mat-drawer-content>
        <trait-pack-list
          [items]="packs()"
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
export class TraitPacksPageComponent {
  private svc       = inject(TraitPackService);
  private schemaSvc = inject(SchemaService);
  private defSvc    = inject(TraitDefService);

  packs     = signal<TraitPack[]>([]);
  schemas   = signal<Schema[]>([]);
  traitDefs = signal<TraitDef[]>([]);
  selected  = signal<TraitPack | null | undefined>(undefined);
  loading   = signal(false);
  saving    = signal(false);
  error     = signal('');

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: (p) => { this.packs.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.schemaSvc.getAll().subscribe({ next: (s) => this.schemas.set(s) });
    this.defSvc.getAll().subscribe({ next: (d) => this.traitDefs.set(d) });
  }

  onSelect(p: TraitPack):              void { this.selected.set(p); this.error.set(''); }
  onNew():                              void { this.selected.set(null); this.error.set(''); }
  onCancel():                           void { this.selected.set(undefined); }

  onSave(payload: TraitPack): void {
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
