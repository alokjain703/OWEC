import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { ThemeService } from './core/services/theme.service';
import { ThemeSwitcherComponent } from './theme-switcher.component';
import { AuthStateService } from './core/services/auth-state.service';
import { AuthService } from './core/services/auth.service';
import { RoleRoutingService } from './core/services/role-routing.service';
import { WorkspaceStateService } from './core/services/workspace-state.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  tooltip: string;
}

@Component({
  selector: 'omni-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule, MatMenuModule, MatChipsModule,
    ThemeSwitcherComponent,
  ],
  template: `
    <mat-sidenav-container class="omni-container">

      <!-- Sidenav -->
      <mat-sidenav
        #sidenav
        [mode]="sidenavMode()"
        [opened]="sidenavOpen()"
        class="omni-sidenav"
        fixedInViewport>

        <!-- Logo / brand -->
        <div class="omni-brand">
          <mat-icon class="brand-icon">auto_stories</mat-icon>
          <span class="brand-text">OMNI</span>
        </div>

        <mat-divider />

        <!-- Navigation -->
        <mat-nav-list class="omni-nav-list">
          @for (item of navItems(); track item.path) {
            <a
              mat-list-item
              [routerLink]="item.path"
              routerLinkActive="active-link"
              [matTooltip]="item.tooltip"
              matTooltipPosition="right"
              (click)="isMobile() && sidenav.close()">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <mat-divider />
          <span class="footer-text">v0.1.0 · Narrative Engine</span>
        </div>
      </mat-sidenav>

      <!-- Main content area -->
      <mat-sidenav-content class="omni-content">
        <!-- Top toolbar -->
        <mat-toolbar class="omni-toolbar" color="primary">
          <button mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle navigation">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">OMNI – Narrative Engine</span>
          
          <!-- Workspace and Project Display -->
          @if (workspaceState.currentWorkspace()) {
            <div class="workspace-project-display">
              <mat-chip class="workspace-chip">
                <mat-icon>business</mat-icon>
                {{ workspaceState.currentWorkspace()!.name }}
              </mat-chip>
              @if (workspaceState.currentProject()) {
                <mat-icon class="separator-icon">chevron_right</mat-icon>
                <mat-chip class="project-chip">
                  <mat-icon>folder</mat-icon>
                  {{ workspaceState.currentProject()!.name }}
                </mat-chip>
              }
            </div>
          }
          
          <span class="toolbar-spacer"></span>
          
          <!-- Role Switcher -->
          @if (roleRouting.hasMultipleRoles() && roleRouting.currentRole()) {
            <button mat-button [matMenuTriggerFor]="roleMenu" class="role-switcher-button">
              <mat-icon>swap_horiz</mat-icon>
              <span>{{ roleRouting.getDashboardLabel(roleRouting.currentRole()!) }}</span>
              <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
            </button>
            <mat-menu #roleMenu="matMenu">
              <div mat-menu-item disabled class="menu-header">Switch Dashboard</div>
              <mat-divider></mat-divider>
              @for (dashboard of roleRouting.getAvailableDashboards(); track dashboard.role) {
                <button 
                  mat-menu-item 
                  (click)="switchRole(dashboard.role)"
                  [class.active-role]="roleRouting.currentRole() === dashboard.role">
                  @if (roleRouting.currentRole() === dashboard.role) {
                    <mat-icon>check</mat-icon>
                  } @else {
                    <mat-icon></mat-icon>
                  }
                  <span>{{ dashboard.label }}</span>
                </button>
              }
            </mat-menu>
          }
          
          <omni-theme-switcher />
          
          @if (currentUser$ | async; as currentUser) {
            <!-- User Menu -->
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
              <mat-icon>account_circle</mat-icon>
              <span class="user-name">{{ currentUser.display_name }}</span>
              <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu" class="user-menu">
              <div class="user-info" mat-menu-item disabled>
                <div class="user-email">{{ currentUser.email }}</div>
                <div class="user-tenant">Tenant: {{ currentUser.tenant_id.substring(0, 8) }}...</div>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="navigateToProfile()">
                <mat-icon>person</mat-icon>
                <span>My Profile</span>
              </button>
              <button mat-menu-item (click)="navigateToSettings()">
                <mat-icon>settings</mat-icon>
                <span>Account Settings</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          } @else {
            <button mat-raised-button color="accent" (click)="login()">
              <mat-icon>login</mat-icon>
              Sign In
            </button>
          }
          
          <button mat-icon-button matTooltip="Settings (coming soon)" aria-label="Settings">
            <mat-icon>settings</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Routed feature views -->
        <div class="omni-view-area">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .omni-container { height: 100vh; }

    /* ── Sidenav ── */
    .omni-sidenav {
      width: 220px;
      background: var(--omni-surface);
      border-right: 1px solid var(--omni-border);
      display: flex;
      flex-direction: column;
    }

    .omni-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 16px;
    }
    .brand-icon { color: var(--omni-accent-light); font-size: 28px; }
    .brand-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--omni-accent-light);
    }

    .omni-nav-list { padding-top: 8px; flex: 1; }

    /* Active route highlight */
    .omni-nav-list a.active-link {
      background: rgba(124, 92, 191, 0.18) !important;
      border-left: 3px solid var(--omni-accent);
      color: var(--omni-text) !important;
    }
    .omni-nav-list a { color: var(--omni-text-muted); border-left: 3px solid transparent; }
    .omni-nav-list a:hover { color: var(--omni-text); background: rgba(255,255,255,0.04) !important; }
    .omni-nav-list mat-icon { color: inherit; }

    .sidenav-footer {
      padding: 8px 16px 12px;
    }
    .footer-text {
      font-size: 11px;
      color: var(--omni-text-muted);
      display: block;
      padding-top: 8px;
    }

    /* ── Toolbar ── */
    .omni-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--omni-surface) !important;
      border-bottom: 1px solid var(--omni-border);
      color: var(--omni-text) !important;
      min-height: 56px;
    }
    .toolbar-title {
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.5px;
      color: var(--omni-text);
    }
    .toolbar-spacer { flex: 1; }
    
    /* Workspace and Project Display */
    .workspace-project-display {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: 24px;
      padding: 4px 12px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
    }
    .workspace-chip,
    .project-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      height: 28px;
      padding: 0 10px;
      background-color: rgba(255, 255, 255, 0.1);
    }
    .workspace-chip mat-icon,
    .project-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .separator-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--omni-text-muted);
    }
    
    /* Role Switcher */
    .role-switcher-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      margin-left: 16px;
      border-radius: 24px;
      background-color: rgba(255, 255, 255, 0.05);
      transition: background-color 0.2s;
    }
    .role-switcher-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .menu-header {
      font-size: 12px;
      font-weight: 500;
      color: var(--omni-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .active-role {
      background-color: rgba(124, 92, 191, 0.15);
    }
    
    /* User menu button */
    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      margin-left: 8px;
      border-radius: 24px;
      transition: background-color 0.2s;
    }
    .user-menu-button:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }
    .user-name {
      font-size: 14px;
      font-weight: 500;
    }
    .dropdown-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* ── Content area ── */
    .omni-content { background: var(--omni-bg); }
    .omni-view-area {
      height: calc(100vh - 56px);
      overflow: auto;
    }
  `],
})
export class AppComponent {
  private bp = inject(BreakpointObserver);
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private authService = inject(AuthService);
  public roleRouting = inject(RoleRoutingService);
  public workspaceState = inject(WorkspaceStateService);
  // Inject ThemeService here so its effect() runs at app startup
  private themeSvc = inject(ThemeService);

  isMobile = signal(false);
  sidenavOpen = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');
  
  // Auth observables
  currentUser$ = this.authState.currentUser$;
  isAuthenticated$ = this.authState.isAuthenticated$;

  // Computed nav items that update based on current project selection
  navItems = computed(() => {
    const currentProject = this.workspaceState.currentProject();
    const projectId = currentProject?.id;
    
    // If no project selected, return dashboard-only nav
    if (!projectId) {
      return [
        { path: this.roleRouting.currentDashboard()?.route || '/dashboard/user', label: 'Dashboard', icon: 'dashboard', tooltip: 'User dashboard' },
      ];
    }
    
    // If project selected, return full nav with project routes
    return [
      { path: this.roleRouting.currentDashboard()?.route || '/dashboard/user', label: 'Dashboard', icon: 'dashboard', tooltip: 'Return to dashboard' },
      { path: `/projects/${projectId}/tree`, label: 'Tree', icon: 'account_tree', tooltip: 'Project node tree' },
      { path: `/projects/${projectId}/characters`, label: 'Characters', icon: 'people', tooltip: 'Character entity map' },
      { path: `/projects/${projectId}/timeline`, label: 'Timeline', icon: 'timeline', tooltip: 'Chronological events' },
      { path: `/projects/${projectId}/graph`, label: 'Graph', icon: 'hub', tooltip: 'Relationship graph' },
      { path: `/projects/${projectId}/schemas`, label: 'Schemas', icon: 'schema', tooltip: 'Bible / writing schemas' },
    ];
  });

  constructor() {
    this.bp.observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.sidenavMode.set(result.matches ? 'over' : 'side');
        this.sidenavOpen.set(!result.matches);
      });
      
    // Check auth state on app init
    this.authState.refresh();
  }
  
  login(): void {
    // Always clear RAMPS session to ensure fresh login
    this.authService.redirectToLogin(true);
  }
  
  logout(): void {
    // Call RAMPS logout API (fire and forget - don't wait for response)
    // This allows RAMPS to clean up server-side sessions if needed
    this.authService.logout().subscribe({
      next: () => console.log('Logged out from RAMPS'),
      error: (err) => console.warn('RAMPS logout endpoint not available:', err)
    });
    
    // Clear local authentication state
    this.authState.logout();
    
    // Stay on OWEC - user will see Sign In button
    // RAMPS session will be cleared on next login
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }
  
  switchRole(role: 'sc-acct-mgr' | 'sc-mgr' | 'sc-user'): void {
    this.roleRouting.navigateToDashboard(role);
  }
}

