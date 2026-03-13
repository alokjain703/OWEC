import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BookmarksService } from '../services/bookmarks.service';
import { FavoriteToggleComponent } from './favorite-toggle.component';
import { WorkspaceBookmark } from '../models/workspace.models';

@Component({
  selector: 'omni-favorites-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule,
    FavoriteToggleComponent,
  ],
  template: `
    <mat-card class="widget-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>star</mat-icon>
        <mat-card-title>Favorites</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="spinner-wrap"><mat-spinner diameter="32" /></div>
        } @else if (items().length === 0) {
          <p class="empty-hint">No favorites yet. Star items to add them here.</p>
        } @else {
          <ul class="item-list">
            @for (item of items(); track item.id) {
              <li class="item-row">
                <mat-icon class="item-icon">{{ iconFor(item.objectType) }}</mat-icon>
                <div class="item-info">
                  <span class="item-label">{{ item.objectId }}</span>
                  <span class="item-meta">{{ item.objectType }}</span>
                </div>
                <omni-favorite-toggle
                  [objectType]="item.objectType"
                  [objectId]="item.objectId" />
              </li>
            }
          </ul>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .widget-card { height: 100%; }
    .spinner-wrap { display: flex; justify-content: center; padding: 24px; }
    .empty-hint { color: var(--omni-text-muted); font-size: 13px; padding: 8px 0; }
    .item-list { list-style: none; padding: 0; margin: 0; }
    .item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 4px;
    }
    .item-icon { color: var(--omni-accent-light); font-size: 20px; width: 20px; height: 20px; }
    .item-info { flex: 1; min-width: 0; }
    .item-label { display: block; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { display: block; font-size: 12px; color: var(--omni-text-muted); }
  `],
})
export class FavoritesWidgetComponent implements OnInit {
  private bookmarksSvc = inject(BookmarksService);

  loading = signal(true);
  items = signal<WorkspaceBookmark[]>([]);

  ngOnInit(): void {
    this.bookmarksSvc.getBookmarks().subscribe({
      next: (data) => {
        // show non-pinned bookmarks (pinned are shown in PinnedItemsWidget)
        this.items.set(data.filter((b) => !b.metadata?.['pinned']));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  iconFor(objectType: string): string {
    const map: Record<string, string> = {
      ce_entity: 'person',
      ce_schema: 'schema',
      node: 'account_tree',
      project: 'folder',
    };
    return map[objectType] ?? 'bookmark';
  }
}
