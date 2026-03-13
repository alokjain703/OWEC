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
import { BookmarksService } from '../services/bookmarks.service';
import { WorkspaceBookmark } from '../models/workspace.models';

@Component({
  selector: 'omni-pinned-items-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="widget-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>push_pin</mat-icon>
        <mat-card-title>Pinned Items</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="spinner-wrap"><mat-spinner diameter="32" /></div>
        } @else if (items().length === 0) {
          <p class="empty-hint">No pinned items. Add <code>pinned: true</code> metadata to a bookmark to pin it here.</p>
        } @else {
          <ul class="item-list">
            @for (item of items(); track item.id) {
              <li class="item-row">
                <mat-icon class="pin-icon">push_pin</mat-icon>
                <div class="item-info">
                  <span class="item-label">{{ item.objectId }}</span>
                  <span class="item-meta">{{ item.objectType }}</span>
                </div>
                <button mat-icon-button (click)="unpin(item)" aria-label="Unpin">
                  <mat-icon>close</mat-icon>
                </button>
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
    .pin-icon { color: #f5a623; font-size: 18px; width: 18px; height: 18px; }
    .item-info { flex: 1; min-width: 0; }
    .item-label { display: block; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { display: block; font-size: 12px; color: var(--omni-text-muted); }
  `],
})
export class PinnedItemsWidgetComponent implements OnInit {
  private bookmarksSvc = inject(BookmarksService);

  loading = signal(true);
  items = signal<WorkspaceBookmark[]>([]);

  ngOnInit(): void {
    this.bookmarksSvc.getBookmarks().subscribe({
      next: () => {
        this.items.set(this.bookmarksSvc.getPinnedItems());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  unpin(item: WorkspaceBookmark): void {
    this.bookmarksSvc.removeBookmark(item.objectType, item.objectId).subscribe({
      next: () => this.items.update((list) => list.filter((i) => i.id !== item.id)),
    });
  }
}
