import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivityService } from '../services/activity.service';
import { WorkspaceActivity } from '../models/workspace.models';

@Component({
  selector: 'omni-recent-work-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="widget-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>history</mat-icon>
        <mat-card-title>Recent Work</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="spinner-wrap">
            <mat-spinner diameter="32" />
          </div>
        } @else if (items().length === 0) {
          <p class="empty-hint">No recent activity yet.</p>
        } @else {
          <ul class="item-list">
            @for (item of items(); track item.id) {
              <li class="item-row" (click)="navigate(item)" role="button" [attr.aria-label]="'View ' + item.objectId">
                <mat-icon class="item-icon">{{ iconFor(item.objectType) }}</mat-icon>
                <div class="item-info">
                  <span class="item-label">{{ item.objectId }}</span>
                  <span class="item-meta">{{ item.action }} · {{ item.objectType }}</span>
                </div>
                <mat-icon class="item-arrow">chevron_right</mat-icon>
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
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .item-row:hover { background: rgba(124, 92, 191, 0.08); }
    .item-icon { color: var(--omni-accent-light); font-size: 20px; width: 20px; height: 20px; }
    .item-info { flex: 1; min-width: 0; }
    .item-label { display: block; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { display: block; font-size: 12px; color: var(--omni-text-muted); }
    .item-arrow { font-size: 18px; width: 18px; height: 18px; color: var(--omni-text-muted); }
  `],
})
export class RecentWorkWidgetComponent implements OnInit {
  private activitySvc = inject(ActivityService);
  private router = inject(Router);

  loading = signal(true);
  items = signal<WorkspaceActivity[]>([]);

  ngOnInit(): void {
    this.activitySvc.getRecentActivity(20).subscribe({
      next: (data) => {
        this.items.set(data);
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
    return map[objectType] ?? 'description';
  }

  navigate(item: WorkspaceActivity): void {
    if (item.objectType === 'ce_entity') {
      this.router.navigate(['/ce/entities', item.objectId]);
    }
    // extend for other object types as needed
  }
}
