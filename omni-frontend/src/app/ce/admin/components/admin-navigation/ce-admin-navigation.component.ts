import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

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
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <!-- Header -->
    <div class="nav-header">
      <mat-icon class="nav-header-icon">settings</mat-icon>
      <div class="nav-header-text">
        <span class="nav-title">⚙ Character Engine</span>
        <span class="nav-subtitle">Administration</span>
      </div>
    </div>

    <div class="nav-badge-row">
      <span class="admin-badge">Admin</span>
    </div>

    <mat-divider />

    <!-- Navigation links (role-filtered) -->
    <mat-nav-list dense>
      @for (item of visibleItems; track item.path) {
        <a mat-list-item
           [routerLink]="item.path"
           routerLinkActive="nav-active"
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

    .nav-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 14px 10px;
    }

    .nav-header-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--mat-primary, #6200ea);
    }

    .nav-header-text {
      display: flex;
      flex-direction: column;
    }

    .nav-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.3;
    }

    .nav-subtitle {
      font-size: 11px;
      color: var(--mat-secondary-text, #757575);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-badge-row {
      padding: 0 14px 10px;
    }

    .admin-badge {
      display: inline-block;
      background: var(--mat-warn, #e53935);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .nav-active {
      background: rgba(98, 0, 234, 0.1) !important;
      border-radius: 0 24px 24px 0;
      font-weight: 600;
    }
  `],
})
export class CeAdminNavigationComponent {
  private auth = inject(AuthStateService);

  get visibleItems(): NavItem[] {
    return NAV_ITEMS.filter((item) => hasAdminRole(this.auth, ...item.roles));
  }
}
