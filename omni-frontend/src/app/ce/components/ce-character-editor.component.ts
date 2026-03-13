import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { CeEntityService } from '../services/ce-entity.service';
import { CeTraitResolverService } from '../engine/ce-trait-resolver.service';
import { CeSchemaRegistryService } from '../engine/ce-schema-registry.service';
import { CeTemplateService } from '../services/ce-template.service';
import { CeTraitService } from '../services/ce-trait.service';
import { CeSchemaService } from '../services/ce-schema.service';
import { CeEntity } from '../models/ce-entity.model';
import { CeTemplateLevel } from '../models/ce-template.model';
import { CeResolvedTrait } from '../models/ce-trait.model';
import { CeSchema } from '../models/ce-schema.model';
import { CeTemplateSelectorComponent } from './ce-template-selector.component';
import { CeTraitEditorComponent } from './ce-trait-editor.component';
import { FavoriteToggleComponent } from '../../features/my-workspace/components/favorite-toggle.component';

@Component({
  selector: 'ce-character-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    CeTemplateSelectorComponent,
    CeTraitEditorComponent,
    FavoriteToggleComponent,
  ],
  template: `
    <mat-card class="ce-editor">
      <mat-card-header class="editor-header">
        @if (isCreateMode()) {
          <button mat-icon-button class="back-btn" (click)="goBack()" matTooltip="Back to characters">
            <mat-icon>arrow_back</mat-icon>
          </button>
        }
        <mat-icon mat-card-avatar class="header-icon">{{ isCreateMode() ? 'person_add' : 'person' }}</mat-icon>
        <mat-card-title>
          {{ isCreateMode() ? 'New Character' : (characterName() || entity()?.name || 'Character') }}
        </mat-card-title>
        <mat-card-subtitle>{{ isCreateMode() ? 'Fill in details and save to create' : (entity()?.id || '') }}</mat-card-subtitle>
        @if (!isCreateMode() && entity()?.id) {
          <omni-favorite-toggle
            class="header-fav"
            objectType="ce_entity"
            [objectId]="entity()!.id"
            [metadata]="{ name: entity()?.name, schema: entity()?.schema }" />
        }
      </mat-card-header>

      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
        } @else {

          <!-- ── Character Properties ── -->
          <section class="props-section">
            <div class="section-label">Character Properties</div>

            <!-- Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput
                [value]="characterName()"
                (input)="handleNameChange($any($event.target).value)"
                placeholder="Enter character name">
            </mat-form-field>

            <!-- Schema + Template Level -->
            <div class="field-row">
              @if (isCreateMode()) {
                <!-- CREATE: editable schema selector -->
                <mat-form-field appearance="outline" class="field-half">
                  <mat-label>Schema</mat-label>
                  <mat-icon matPrefix>schema</mat-icon>
                  <mat-select [value]="newSchemaId()" (selectionChange)="handleSchemaChange($event.value)">
                    @for (s of schemas(); track s.id) {
                      <mat-option [value]="s.id">{{ s.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Determines available traits</mat-hint>
                </mat-form-field>
              } @else {
                <!-- EDIT: read-only schema -->
                <mat-form-field appearance="outline" class="field-half">
                  <mat-label>Schema</mat-label>
                  <mat-icon matPrefix>schema</mat-icon>
                  <input matInput [value]="entity()?.schema || ''" readonly>
                  <mat-hint>Read-only — set at creation</mat-hint>
                </mat-form-field>
              }

              <div class="field-half template-field">
                <span class="template-label">Template Level</span>
                <ce-template-selector
                  [selected]="templateLevel()"
                  (selectedChange)="handleTemplateChange($event)">
                </ce-template-selector>
              </div>
            </div>

            <!-- Trait Packs -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Trait Packs</mat-label>
              <mat-icon matPrefix>layers</mat-icon>
              <mat-select multiple
                [value]="traitPackIds()"
                (selectionChange)="handleTraitPacksChange($event.value)">
                @for (pack of availableTraitPacks(); track pack.id) {
                  <mat-option [value]="pack.id">{{ pack.name }}</mat-option>
                }
              </mat-select>
              <mat-hint>{{ traitPackIds().length }} pack(s) active · affects available traits</mat-hint>
            </mat-form-field>
          </section>

          <mat-divider class="section-divider" />

          <!-- ── Traits ── -->
          @if (resolvedTraits().length > 0) {
            <section class="traits-section">
              <div class="section-label">Traits
                <span class="count-badge">{{ resolvedTraits().length }}</span>
              </div>
              <div class="traits">
                @for (trait of resolvedTraits(); track trait.traitDefId) {
                  <ce-trait-editor
                    [trait]="trait"
                    [value]="traitValues()[trait.traitDefId]"
                    (valueChange)="handleTraitChange(trait.traitDefId, $event)">
                  </ce-trait-editor>
                }
              </div>
            </section>
          } @else {
            <div class="no-traits">
              <mat-icon>tune</mat-icon>
              <span>{{ isCreateMode() && !newSchemaId() ? 'Select a schema to see available traits.' : 'No traits available. Select trait packs or adjust the template level.' }}</span>
            </div>
          }
        }
      </mat-card-content>

      <mat-card-actions align="end">
        @if (!isCreateMode()) {
          <button mat-stroked-button [disabled]="loading() || saving()" (click)="reload()">Reload</button>
        }
        <button mat-raised-button color="primary"
                [disabled]="loading() || saving() || (isCreateMode() && (!characterName() || !newSchemaId()))"
                (click)="save()">
          {{ saving() ? 'Saving…' : (isCreateMode() ? 'Create Character' : 'Save') }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrl: './ce-character-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeCharacterEditorComponent implements OnInit {
  @Input() entityId = '';
  /** When true, the component is hosted inside a drawer; emits events instead of navigating. */
  @Input() embedded = false;

  @Output() created = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  entity = signal<CeEntity | null>(null);
  resolvedTraits = signal<CeResolvedTrait[]>([]);
  traitValues = signal<Record<string, unknown>>({});
  templateLevel = signal<CeTemplateLevel>('XS');
  characterName = signal<string>('');
  traitPackIds = signal<string[]>([]);
  schemas = signal<CeSchema[]>([]);
  newSchemaId = signal<string>('');
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  isCreateMode = computed(() => !this.entityId);

  /** Schema id to use – entity's schema in edit mode, selected schema in create mode */
  activeSchemaId = computed(() => this.entity()?.schema || this.newSchemaId());

  availableTraitPacks = computed(() =>
    this.registry.getTraitPacks(this.activeSchemaId() || undefined)
  );

  constructor(
    private entities: CeEntityService,
    private resolver: CeTraitResolverService,
    private registry: CeSchemaRegistryService,
    private templates: CeTemplateService,
    private traits: CeTraitService,
    private schemaSvc: CeSchemaService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadRegistry();
    if (!this.entityId) {
      this.route.paramMap.subscribe((params) => {
        const routeId = params.get('entityId') || params.get('id');
        if (routeId) {
          this.entityId = routeId;
          this.reload();
        }
      });
    }
  }

  goBack(): void {
    if (this.embedded) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/ce']);
    }
  }

  reload(): void {
    if (!this.entityId) {
      return;
    }
    this.loading.set(true);
    this.entities.getEntity(this.entityId).subscribe((entity) => {
      this.entity.set(entity);
      this.templateLevel.set(entity.template);
      this.characterName.set(entity.name || '');
      this.traitPackIds.set([...(entity.traitPacks || [])]);
      this.traitValues.set({ ...(entity.traits || {}) });
      this.resolveTraits();
      // Sync name into the name trait so both fields agree on load
      this.syncNameTrait(entity.name || '');
      this.loading.set(false);
    });
  }

  handleNameChange(value: string): void {
    this.characterName.set(value);
    this.syncNameTrait(value);
  }

  handleSchemaChange(schemaId: string): void {
    this.newSchemaId.set(schemaId);
    this.traitPackIds.set([]);
    this.traitValues.set({});
    this.resolveTraits();
  }

  handleTemplateChange(level: CeTemplateLevel): void {
    this.templateLevel.set(level);
    const current = this.entity();
    if (current) {
      this.entity.set({ ...current, template: level });
    }
    this.resolveTraits();
  }

  handleTraitChange(traitDefId: string, value: unknown): void {
    this.traitValues.set({ ...this.traitValues(), [traitDefId]: value });
    // If the user edits the name trait directly, keep the main name field in sync too
    const nameTrait = this.resolvedTraits().find((t) => t.traitKey === 'name');
    if (nameTrait && nameTrait.traitDefId === traitDefId && typeof value === 'string') {
      this.characterName.set(value);
    }
  }

  /** Mirror the main name field into the 'name' trait value (frontend-only sync). */
  private syncNameTrait(name: string): void {
    const nameTrait = this.resolvedTraits().find((t) => t.traitKey === 'name');
    if (!nameTrait) return;
    this.traitValues.set({ ...this.traitValues(), [nameTrait.traitDefId]: name });
  }

  handleTraitPacksChange(packIds: string[]): void {
    this.traitPackIds.set(packIds);
    const current = this.entity();
    if (current) {
      this.entity.set({ ...current, traitPacks: packIds });
    }
    this.resolveTraits();
  }

  save(): void {
    if (this.isCreateMode()) {
      this.create();
    } else {
      this.update();
    }
  }

  private create(): void {
    const name = this.characterName().trim();
    if (!name) {
      this.snack.open('Name is required', 'Dismiss', { duration: 3000 });
      return;
    }
    if (!this.newSchemaId()) {
      this.snack.open('Please select a schema', 'Dismiss', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const newId = crypto.randomUUID();
    const newEntity: CeEntity = {
      id: newId,
      schema: this.newSchemaId(),
      template: this.templateLevel(),
      name,
      traitPacks: this.traitPackIds(),
      traits: {},
    };
    this.entities.createEntity(newEntity).subscribe({
      next: (created) => {
        // Save trait values if any
        const traitEntries = Object.entries(this.traitValues());
        const traits$ = traitEntries.length > 0
          ? this.entities.putEntityTraits(created.id, {
              values: traitEntries.map(([traitDefId, value]) => ({ traitDefId, value })),
            })
          : of([]);
        traits$.subscribe({
          next: () => {
            this.saving.set(false);
            this.snack.open('Character created!', undefined, { duration: 2500 });
            // Clear form fields
            this.characterName.set('');
            this.newSchemaId.set('');
            this.templateLevel.set('XS');
            this.traitPackIds.set([]);
            this.traitValues.set({});
            this.resolvedTraits.set([]);
            if (this.embedded) {
              this.created.emit(created.id);
            } else {
              this.router.navigate(['/ce/characters', created.id]);
            }
          },
          error: (err) => {
            this.saving.set(false);
            const msg = err?.error?.detail || err?.message || 'Failed to save traits';
            this.snack.open(`Created but traits failed: ${msg}`, 'Dismiss', { duration: 5000 });
            if (this.embedded) {
              this.created.emit(created.id);
            } else {
              this.router.navigate(['/ce/characters', created.id]);
            }
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.detail || err?.message || 'Create failed';
        this.snack.open(`Error: ${msg}`, 'Dismiss', { duration: 5000 });
      },
    });
  }

  private update(): void {
    const current = this.entity();
    if (!current) return;
    this.saving.set(true);

    const entityUpdate$ = this.entities.updateEntity(current.id, {
      name: this.characterName(),
      template: this.templateLevel(),
      traitPacks: this.traitPackIds(),
    });

    const traitEntries = Object.entries(this.traitValues());
    const traits$ = traitEntries.length > 0
      ? this.entities.putEntityTraits(current.id, {
          values: traitEntries.map(([traitDefId, value]) => ({ traitDefId, value })),
        })
      : of([]);

    forkJoin({ entity: entityUpdate$, traits: traits$ }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Character saved', undefined, { duration: 2500 });
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.detail || err?.message || 'Save failed';
        this.snack.open(`Error: ${msg}`, 'Dismiss', { duration: 5000 });
      },
    });
  }

  private loadRegistry(): void {
    this.loading.set(true);
    this.schemaSvc.listSchemas().subscribe((items) => {
      this.schemas.set(items);
      this.registry.setSchemas(items);
    });
    this.templates.listTemplates().subscribe((items) => {
      this.registry.setTemplates(items);
    });
    this.traits.listTraitDefs().subscribe((items) => {
      this.registry.setTraitDefs(items);
    });
    this.traits.listTraitPacks().subscribe((items) => {
      this.registry.setTraitPacks(items);
      this.loading.set(false);
      if (this.entityId) {
        this.reload();
      }
    });
  }

  private resolveTraits(): void {
    const schemaId = this.activeSchemaId();
    if (!schemaId) {
      this.resolvedTraits.set([]);
      return;
    }
    // Build a synthetic entity stub for the resolver
    const stub: CeEntity = this.entity()
      ? { ...this.entity()!, traits: this.traitValues(), template: this.templateLevel(), traitPacks: this.traitPackIds() }
      : { id: '__new__', schema: schemaId, template: this.templateLevel(), traitPacks: this.traitPackIds(), traits: this.traitValues() };
    this.resolvedTraits.set(this.resolver.resolveTraits(stub));
  }
}
