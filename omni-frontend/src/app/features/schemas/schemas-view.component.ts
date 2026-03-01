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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="schemas-page">

      <!-- Page header -->
      <mat-card class="page-header-card" appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">schema</mat-icon>
          <mat-card-title>Bible Schemas</mat-card-title>
          <mat-card-subtitle>Swappable writing-mode definitions — switch the schema to change your universe's vocabulary</mat-card-subtitle>
        </mat-card-header>
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
  `],
})
export class SchemasViewComponent implements OnInit {
  private api = inject(OmniApiService);

  schemas = signal<NarrativeSchema[]>([]);
  selected = signal<NarrativeSchema | null>(null);
  activeId = signal<string | null>(null);

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
}
