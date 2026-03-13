import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceNavComponent } from '../components/workspace-nav.component';
import { RecentWorkWidgetComponent } from '../components/recent-work-widget.component';
import { FavoritesWidgetComponent } from '../components/favorites-widget.component';
import { PinnedItemsWidgetComponent } from '../components/pinned-items-widget.component';
import { AccountWidgetComponent } from '../components/account-widget.component';

@Component({
  selector: 'omni-my-workspace-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WorkspaceNavComponent,
    RecentWorkWidgetComponent,
    FavoritesWidgetComponent,
    PinnedItemsWidgetComponent,
    AccountWidgetComponent,
  ],
  template: `
    <div class="workspace-page">
      <div class="workspace-header">
        <h1 class="page-title">My Workspace</h1>
      </div>

      <omni-workspace-nav />

      <div class="dashboard-grid">
        <omni-recent-work-widget class="grid-cell" />
        <omni-favorites-widget class="grid-cell" />
        <omni-pinned-items-widget class="grid-cell" />
        <omni-account-widget class="grid-cell" />
      </div>
    </div>
  `,
  styles: [`
    .workspace-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--omni-bg);
    }
    .workspace-header {
      padding: 24px 24px 0;
    }
    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--omni-text);
      margin: 0 0 4px;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      padding: 24px;
      overflow-y: auto;
    }
    .grid-cell { min-height: 220px; }
  `],
})
export class MyWorkspaceDashboardComponent {}
