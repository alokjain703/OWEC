import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthStateService } from '../../../../core/services/auth-state.service';
import { CE_ADMIN_PERMISSIONS, hasAdminRole, CeAdminRole } from '../../guards/ce-admin.guard';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: CeAdminRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Schemas',            icon: 'schema',      path: 'schemas',              roles: CE_ADMIN_PERMISSIONS['schemas']              as CeAdminRole[] },
  { label: 'Trait Groups',       icon: 'folder',      path: 'trait-groups',         roles: CE_ADMIN_PERMISSIONS['trait-groups']         as CeAdminRole[] },
  { label: 'Trait Definitions',  icon: 'tune',        path: 'trait-defs',           roles: CE_ADMIN_PERMISSIONS['trait-defs']           as CeAdminRole[] },
  { label: 'Trait Options',      icon: 'checklist',   path: 'trait-options',        roles: CE_ADMIN_PERMISSIONS['trait-options']        as CeAdminRole[] },
  { label: 'Trait Packs',        icon: 'inventory_2', path: 'trait-packs',          roles: CE_ADMIN_PERMISSIONS['trait-packs']          as CeAdminRole[] },
  { label: 'Relationship Types', icon: 'share',       path: 'relationship-types',   roles: CE_ADMIN_PERMISSIONS['relationship-types']   as CeAdminRole[] },
];

/**
 * CE Admin Navigation — left-panel nav list.
 * Filters nav items by the current user's role.
 */
@Component({
  selector: 'ce-admin-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <!-- Section header -->
    <div class="nav-section-header">
      <mat-icon class="section-icon admin-icon">settings</mat-icon>
      <span>Admin</span>
    </div>

    <!-- Navigation links (role-filtered) -->
    <mat-nav-list dense class="nav-list">
      @for (item of visibleItems; track item.path) {
        <a mat-list-item
           [routerLink]="item.path"
           routerLinkActive="active"
           [matTooltip]="item.label"
           matTooltipPosition="right">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }

      @if (visibleItems.length === 0) {
        <mat-list-item disabled>
          <mat-icon matListItemIcon>lock</mat-icon>
          <span matListItemTitle>No access</span>
        </mat-list-item>
      }
    </mat-nav-list>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; }

    .nav-section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      height: 40px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--omni-text-muted);
    }

    .section-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--omni-accent-light);
    }

    .admin-icon {
      color: #e57373 !important;
    }

    .nav-list a {
      font-size: 13px;
      height: 36px;
      color: var(--omni-text-muted);
      border-left: 3px solid transparent;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
    }

    .nav-list a:hover {
      color: var(--omni-text);
      background: rgba(255,255,255,0.04) !important;
    }

    .nav-list a.active {
      color: var(--omni-text) !important;
      background: rgba(124, 92, 191, 0.15) !important;
      border-left: 3px solid var(--omni-accent);
    }
  `],
})
export class CeAdminNavigationComponent {
  private auth = inject(AuthStateService);

  get visibleItems(): NavItem[] {
    return NAV_ITEMS.filter((item) => hasAdminRole(this.auth, ...item.roles));
  }
}
