import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { AuthStateService } from '../../core/services/auth-state.service';
import { CE_ADMIN_PERMISSIONS, hasAdminRole, CeAdminRole } from '../guards/ce-admin.guard';

interface AdminNavItem {
  label: string;
  icon: string;
  path: string;
  /** Minimum roles required to see/use this item. */
  roles: CeAdminRole[];
}

const ALL_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Schemas',            icon: 'schema',       path: 'schemas',              roles: CE_ADMIN_PERMISSIONS['schemas']             as CeAdminRole[] },
  { label: 'Trait Groups',       icon: 'folder',       path: 'trait-groups',         roles: CE_ADMIN_PERMISSIONS['trait-groups']        as CeAdminRole[] },
  { label: 'Trait Definitions',  icon: 'tune',         path: 'trait-defs',           roles: CE_ADMIN_PERMISSIONS['trait-defs']          as CeAdminRole[] },
  { label: 'Trait Options',      icon: 'checklist',    path: 'trait-options',        roles: CE_ADMIN_PERMISSIONS['trait-options']       as CeAdminRole[] },
  { label: 'Trait Packs',        icon: 'inventory_2',  path: 'trait-packs',          roles: CE_ADMIN_PERMISSIONS['trait-packs']         as CeAdminRole[] },
  { label: 'Relationship Types', icon: 'share',        path: 'relationship-types',   roles: CE_ADMIN_PERMISSIONS['relationship-types']  as CeAdminRole[] },
];

/**
 * 3-panel admin shell:
 *   LEFT   — section navigation (filtered by role)
 *   CENTER — list + editor rendered via <router-outlet>
 */
@Component({
  selector: 'ce-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <header class="admin-shell-header">
      <span class="admin-shell-title">{{ title }}</span>
    </header>

    <div class="admin-shell">

      <!-- LEFT: Navigation panel -->
      <aside class="admin-nav">
        <div class="admin-heading">
          <mat-icon class="admin-icon">settings</mat-icon>
          <span>Admin Configuration</span>
        </div>
        <mat-divider />

        <mat-nav-list dense>
          @for (item of visibleNavItems; track item.path) {
            <a mat-list-item [routerLink]="item.path" routerLinkActive="active-nav">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </aside>

      <!-- CENTER + RIGHT: routed panel (list + editor) -->
      <main class="admin-content">
        <router-outlet />
      </main>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

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

    /* ── Left nav ── */
    .admin-nav {
      width: 220px;
      flex-shrink: 0;
      border-right: 1px solid var(--mat-divider, #e0e0e0);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .admin-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px 12px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-secondary-text, #777);
    }

    .admin-icon { font-size: 18px; width: 18px; height: 18px; }

    .active-nav {
      background: rgba(98, 0, 234, 0.08);
      border-radius: 0 24px 24px 0;
      font-weight: 600;
    }

    /* ── Main content ── */
    .admin-content {
      flex: 1;
      overflow: hidden;
      display: flex;
    }
  `],
})
export class CeAdminShellComponent {
  readonly title = 'Character Engine Admin';

  private authState = inject(AuthStateService);

  get visibleNavItems(): AdminNavItem[] {
    return ALL_NAV_ITEMS.filter((item) =>
      hasAdminRole(this.authState, ...item.roles),
    );
  }
}
