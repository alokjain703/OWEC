import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CeAdminNavigationComponent } from '../admin-navigation/ce-admin-navigation.component';

/**
 * CE Admin Shell — 3-panel host.
 *
 * Structure:
 *   LEFT  — CeAdminNavigationComponent (role-filtered nav links)
 *   RIGHT — <router-outlet> (list-view + editor panels)
 */
@Component({
  selector: 'ce-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, CeAdminNavigationComponent],
  templateUrl: './ce-admin-shell.component.html',
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .admin-shell-header {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 16px;
      background: var(--omni-surface);
      border-bottom: 1px solid var(--mat-divider, #e0e0e0);
      flex-shrink: 0;
    }

    .admin-shell-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--mat-secondary-text, #777);
    }

    .admin-shell {
      display: flex;
      width: 100%;
      flex: 1;
      overflow: hidden;
    }

    .admin-nav {
      width: 240px;
      flex-shrink: 0;
      border-right: 1px solid var(--mat-divider, #e0e0e0);
      overflow-y: auto;
      background: var(--mat-sidenav-container-background-color, #fafafa);
    }

    .admin-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class CeAdminShellComponent {
  readonly title = 'Character Engine Admin';
}
