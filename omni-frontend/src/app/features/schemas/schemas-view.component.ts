import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { OmniApiService } from '../../core/services/omni-api.service';
import { SchemaEditorComponent } from './components/schema-editor.component';
import { Schema } from './models/schema.model';

interface NarrativeSchema {
  id: string;
  name: string;
  version: number;
  definition: Record<string, unknown>;
  created_at: string;
}

@Component({
  selector: 'omni-schemas-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatChipsModule, MatIconModule,
    MatButtonModule, MatDividerModule, MatExpansionModule, MatBadgeModule,
    SchemaEditorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="schemas-page">

      @if (!showEditor()) {
        <!-- Page header -->
        <mat-card class="page-header-card" appearance="outlined">
          <mat-card-header>
            <mat-icon mat-card-avatar class="header-icon">schema</mat-icon>
            <mat-card-title>Bible Schemas</mat-card-title>
            <mat-card-subtitle>Swappable writing-mode definitions — switch the schema to change your universe's vocabulary</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="createNewSchema()">
              <mat-icon>add</mat-icon>
              Create New Schema
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Schema cards grid -->
        <div class="schema-grid">
          @for (s of schemas(); track s.id) {
            <mat-card
              class="schema-card"
              [class.schema-card--active]="activeId() === s.id"
              appearance="outlined"
              (click)="select(s)">

              <mat-card-header>
                <mat-icon mat-card-avatar class="schema-icon">auto_stories</mat-icon>
                <mat-card-title>{{ s.name }}</mat-card-title>
                <mat-card-subtitle>Version {{ s.version }}</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <mat-chip-set class="role-chips" aria-label="Schema roles">
                  @for (role of getRoles(s); track role) {
                    <mat-chip class="role-chip" [highlighted]="activeId() === s.id">
                      {{ role }}
                    </mat-chip>
                  }
                </mat-chip-set>
              </mat-card-content>

              <mat-card-actions align="end">
                <button mat-button (click)="editSchema(s); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-button color="accent" (click)="select(s); $event.stopPropagation()">
                  <mat-icon>info_outline</mat-icon>
                  Details
                </button>
                @if (activeId() === s.id) {
                  <mat-icon class="active-indicator" color="accent">check_circle</mat-icon>
                }
              </mat-card-actions>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon class="empty-icon">folder_open</mat-icon>
              <p>No schemas loaded.</p>
              <button mat-raised-button color="primary" (click)="createNewSchema()">
                <mat-icon>add</mat-icon>
                Create Your First Schema
              </button>
            </div>
          }
        </div>

        <!-- Detail expansion panel -->
        @if (selected()) {
          <mat-expansion-panel class="detail-panel" expanded hideToggle>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="detail-icon">code</mat-icon>
                {{ selected()!.name }} — Full Definition
              </mat-panel-title>
              <mat-panel-description>
                v{{ selected()!.version }} · {{ getRoles(selected()!).length }} roles defined
              </mat-panel-description>
            </mat-expansion-panel-header>

            <pre class="definition-pre">{{ selected()!.definition | json }}</pre>

          <mat-action-row>
            <button mat-button (click)="selected.set(null)">
              <mat-icon>close</mat-icon>
              Close
            </button>
          </mat-action-row>
        </mat-expansion-panel>
      }
      } @else {
        <!-- Schema Editor -->
        <div class="editor-container">
          <div class="editor-header">
            <button mat-button (click)="closeEditor()">
              <mat-icon>arrow_back</mat-icon>
              Back to List
            </button>
            <h2>{{ editingSchema() ? 'Edit Schema' : 'Create New Schema' }}</h2>
          </div>
          <div class="editor-content">
            <omni-schema-editor
              [schema]="currentEditSchema()"
              (schemaChange)="onSchemaChange($event)">
            </omni-schema-editor>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .schemas-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      height: 100%;
      box-sizing: border-box;
      overflow: auto;
    }

    .page-header-card .header-icon {
      color: var(--omni-accent-light);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    /* ── Schema grid ── */
    .schema-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .schema-card {
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .schema-card:hover {
      border-color: var(--omni-accent) !important;
      box-shadow: 0 0 0 1px var(--omni-accent);
    }
    .schema-card--active {
      border-color: var(--omni-accent-light) !important;
      box-shadow: 0 0 0 2px var(--omni-accent-light);
    }

    .schema-icon { color: var(--omni-accent-light); }

    .role-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .role-chip {
      font-size: 11px !important;
      background: rgba(124, 92, 191, 0.2) !important;
      color: var(--omni-accent-light) !important;
    }

    .active-indicator {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-left: 4px;
      align-self: center;
    }

    /* ── Detail panel ── */
    .detail-panel {
      background: var(--omni-surface) !important;
      border: 1px solid var(--omni-border);
    }
    .detail-icon {
      margin-right: 8px;
      color: var(--omni-accent-light);
      vertical-align: middle;
    }
    .definition-pre {
      font-size: 12px;
      color: var(--omni-text-muted);
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--omni-bg);
      padding: 12px 16px;
      border-radius: 4px;
      border: 1px solid var(--omni-border);
      max-height: 300px;
      overflow: auto;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 40px; color: var(--omni-text-muted);
      grid-column: 1 / -1;
    }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }

    /* ── Schema Editor ── */
    .editor-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 96px);
      background: var(--omni-surface, white);
      border-radius: 8px;
      overflow: hidden;
    }

    .editor-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      background: var(--omni-surface, white);
    }

    .editor-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .editor-content {
      flex: 1;
      overflow: hidden;
    }
  `],
})
export class SchemasViewComponent implements OnInit {
  private api = inject(OmniApiService);

  schemas = signal<NarrativeSchema[]>([]);
  selected = signal<NarrativeSchema | null>(null);
  activeId = signal<string | null>(null);
  
  // Editor state
  showEditor = signal(false);
  editingSchema = signal<NarrativeSchema | null>(null);
  currentEditSchema = signal<Schema>({
    roles: {},
    allowed_children: {},
    metadata_definitions: {}
  });

  ngOnInit(): void {
    this.schemas.set([
      { id: 'a', name: 'BOOK_SERIES',  version: 1, created_at: '', definition: { roles: { universe: 'Universe', collection: 'Series',    major_unit: 'Book',   atomic_unit: 'Chapter'  } } },
      { id: 'b', name: 'TV_SERIES',    version: 1, created_at: '', definition: { roles: { universe: 'Universe', collection: 'Show',      major_unit: 'Season', atomic_unit: 'Episode'  } } },
      { id: 'c', name: 'MOVIE_SERIES', version: 1, created_at: '', definition: { roles: { universe: 'Universe', collection: 'Franchise', major_unit: 'Film',   atomic_unit: 'Sequence' } } },
      { id: 'd', name: 'GAME_PROJECT', version: 1, created_at: '', definition: { roles: { universe: 'Universe', collection: 'Game',      major_unit: 'Act',    atomic_unit: 'Quest'    } } },
    ]);
  }

  select(s: NarrativeSchema): void {
    this.selected.set(s);
    this.activeId.set(s.id);
  }

  getRoles(s: NarrativeSchema): string[] {
    const roles = (s.definition as any)?.roles ?? {};
    return Object.values(roles) as string[];
  }

  createNewSchema(): void {
    this.editingSchema.set(null);
    this.currentEditSchema.set({
      roles: {},
      allowed_children: {},
      metadata_definitions: {}
    });
    this.showEditor.set(true);
  }

  editSchema(s: NarrativeSchema): void {
    this.editingSchema.set(s);
    // Convert the old format to new format if needed
    this.currentEditSchema.set(s.definition as unknown as Schema);
    this.showEditor.set(true);
  }

  closeEditor(): void {
    this.showEditor.set(false);
    this.editingSchema.set(null);
  }

  onSchemaChange(schema: Schema): void {
    // Store the updated schema
    this.currentEditSchema.set(schema);
    // TODO: Save to backend
    console.log('Schema updated:', schema);
  }
}
