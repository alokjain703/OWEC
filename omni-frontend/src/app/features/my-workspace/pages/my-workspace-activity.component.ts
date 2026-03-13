import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { WorkspaceNavComponent } from '../components/workspace-nav.component';
import { ActivityService } from '../services/activity.service';
import { WorkspaceActivity } from '../models/workspace.models';

@Component({
  selector: 'omni-my-workspace-activity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WorkspaceNavComponent,
    TitleCasePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatChipsModule,
  ],
  template: `
    <div class="workspace-page">
      <div class="workspace-header">
        <h1 class="page-title">My Workspace</h1>
      </div>

      <omni-workspace-nav />

      <div class="activity-content">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Activity History</mat-card-title>
            <mat-card-subtitle>Your recent actions across OMNI</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loading()) {
              <div class="spinner-wrap"><mat-spinner diameter="36" /></div>
            } @else if (pagedItems().length === 0) {
              <div class="empty-state">
                <mat-icon>history</mat-icon>
                <p>No activity recorded yet.</p>
              </div>
            } @else {
              <ul class="activity-list">
                @for (item of pagedItems(); track item.id) {
                  <li class="activity-row">
                    <mat-icon class="action-icon">{{ iconFor(item.action) }}</mat-icon>
                    <div class="activity-info">
                      <span class="activity-label">
                        <strong>{{ item.action | titlecase }}</strong>
                        {{ item.objectType }}:
                        <code>{{ item.objectId }}</code>
                      </span>
                      <span class="activity-time">{{ formatTime(item.createdAt) }}</span>
                    </div>
                    <mat-chip class="type-chip">{{ item.objectType }}</mat-chip>
                  </li>
                }
              </ul>
              <mat-paginator
                [length]="allItems().length"
                [pageSize]="pageSize"
                [pageSizeOptions]="[10, 20, 50]"
                (page)="onPage($event)"
                aria-label="Activity pagination" />
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .workspace-page { display: flex; flex-direction: column; height: 100%; background: var(--omni-bg); }
    .workspace-header { padding: 24px 24px 0; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--omni-text); margin: 0 0 4px; }
    .activity-content { padding: 24px; overflow-y: auto; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px;
      color: var(--omni-text-muted);
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .activity-list { list-style: none; padding: 0; margin: 0; }
    .activity-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 4px;
      border-bottom: 1px solid var(--omni-border);
    }
    .activity-row:last-child { border-bottom: none; }
    .action-icon { color: var(--omni-accent-light); font-size: 20px; width: 20px; height: 20px; }
    .activity-info { flex: 1; min-width: 0; }
    .activity-label { display: block; font-size: 14px; }
    .activity-label code { font-size: 12px; background: rgba(124,92,191,0.12); padding: 1px 4px; border-radius: 3px; }
    .activity-time { display: block; font-size: 12px; color: var(--omni-text-muted); margin-top: 2px; }
    .type-chip { font-size: 11px; height: 22px; }
  `],
})
export class MyWorkspaceActivityComponent implements OnInit {
  private activitySvc = inject(ActivityService);

  loading = signal(true);
  allItems = signal<WorkspaceActivity[]>([]);
  pagedItems = signal<WorkspaceActivity[]>([]);
  pageSize = 20;
  private pageIndex = 0;

  ngOnInit(): void {
    this.activitySvc.getActivityHistory(100).subscribe({
      next: (data) => {
        this.allItems.set(data);
        this.updatePage();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(ev: PageEvent): void {
    this.pageSize = ev.pageSize;
    this.pageIndex = ev.pageIndex;
    this.updatePage();
  }

  private updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedItems.set(this.allItems().slice(start, start + this.pageSize));
  }

  iconFor(action: string): string {
    const map: Record<string, string> = {
      view: 'visibility',
      edit: 'edit',
      create: 'add_circle',
      delete: 'delete',
    };
    return map[action.toLowerCase()] ?? 'radio_button_unchecked';
  }

  formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
}
