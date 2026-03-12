import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { TraitOption } from '../models/trait-option.model';
import { TraitDef } from '../models/trait-def.model';
import { TraitOptionService } from './trait-option.service';
import { TraitDefService } from '../trait-defs/trait-def.service';
import { TraitOptionListComponent } from './trait-option-list.component';
import { TraitOptionEditorComponent } from './trait-option-editor.component';

@Component({
  selector: 'ce-admin-trait-options-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDividerModule, TraitOptionListComponent, TraitOptionEditorComponent],
  template: `
    <div class="three-panel-page">
      <trait-option-list
        [items]="options()"
        [loading]="loading()"
        [selectedId]="selected()?.id"
        (selected)="onSelect($event)"
        (create)="onNew()" />

      <mat-divider [vertical]="true" />

      <div class="editor-pane">
        @if (selected() !== undefined) {
          <trait-option-editor
            [item]="selected() ?? null"
            [traitDefs]="traitDefs()"
            [saving]="saving()"
            [errorMsg]="error()"
            (save)="onSave($event)"
            (cancel)="onCancel()" />
        } @else {
          <div class="editor-empty"><span>Select a trait option or click + to create one.</span></div>
        }
      </div>
    </div>
  `,
  styles: [`@use 'panel-common' as *;`],
})
export class TraitOptionsPageComponent {
  private svc      = inject(TraitOptionService);
  private defSvc   = inject(TraitDefService);

  options    = signal<TraitOption[]>([]);
  traitDefs  = signal<TraitDef[]>([]);
  selected   = signal<TraitOption | null | undefined>(undefined);
  loading    = signal(false);
  saving     = signal(false);
  error      = signal('');

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: (o) => { this.options.set(o); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.defSvc.getAll().subscribe({ next: (d) => this.traitDefs.set(d) });
  }

  onSelect(o: TraitOption):             void { this.selected.set(o); this.error.set(''); }
  onNew():                               void { this.selected.set(null); this.error.set(''); }
  onCancel():                            void { this.selected.set(undefined); }

  onSave(payload: Omit<TraitOption, 'id'>): void {
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
