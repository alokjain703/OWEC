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
    :host { display: flex; height: 100%; overflow: hidden; }

    .admin-shell {
      display: flex;
      width: 100%;
      height: 100%;
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
export class CeAdminShellComponent {}
