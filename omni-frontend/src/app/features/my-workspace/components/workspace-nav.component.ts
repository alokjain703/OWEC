import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'omni-workspace-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="workspace-nav" aria-label="My Workspace navigation">
      <a class="nav-tab" routerLink="/me" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <mat-icon>dashboard</mat-icon>
        Dashboard
      </a>
      <a class="nav-tab" routerLink="/me/activity" routerLinkActive="active">
        <mat-icon>history</mat-icon>
        Activity
      </a>
      <a class="nav-tab" routerLink="/me/settings" routerLinkActive="active">
        <mat-icon>tune</mat-icon>
        Settings
      </a>
    </nav>
  `,
  styles: [`
    .workspace-nav {
      display: flex;
      gap: 4px;
      padding: 8px 24px 0;
      border-bottom: 1px solid var(--omni-border);
      background: var(--omni-surface);
    }
    .nav-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--omni-text-muted);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: color 0.2s, border-color 0.2s;
    }
    .nav-tab mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .nav-tab:hover {
      color: var(--omni-text);
    }
    .nav-tab.active {
      color: var(--omni-accent-light);
      border-bottom-color: var(--omni-accent);
    }
  `],
})
export class WorkspaceNavComponent {}
