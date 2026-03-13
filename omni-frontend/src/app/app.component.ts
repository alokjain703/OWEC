import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
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
import { AvatarMenuComponent } from './features/my-workspace/menus/avatar-menu.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  tooltip: string;
}

interface Breadcrumb {
  label: string;
  path?: string;
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
    AvatarMenuComponent,
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
        <a class="omni-brand" routerLink="/dashboard/user">
          <mat-icon class="brand-icon">auto_stories</mat-icon>
          <span class="brand-text">OMNI</span>
        </a>

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
          
          <omni-avatar-menu />
          
          <button mat-icon-button matTooltip="Settings (coming soon)" aria-label="Settings">
            <mat-icon>settings</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Routed feature views -->
        @if (breadcrumbs().length > 0) {
          <div class="omni-breadcrumb-bar">
            @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
              @if (crumb.path && !last) {
                <a class="crumb-link" [routerLink]="crumb.path">{{ crumb.label }}</a>
              } @else {
                <span class="crumb-current">{{ crumb.label }}</span>
              }
              @if (!last) {
                <mat-icon class="crumb-sep">chevron_right</mat-icon>
              }
            }
          </div>
        }

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
      text-decoration: none;
      cursor: pointer;
    }
    .brand-icon { color: var(--omni-accent-light); font-size: 28px; }
    .brand-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--omni-accent-light);
    }
    .omni-brand:hover .brand-text,
    .omni-brand:visited .brand-text { color: var(--omni-accent-light); }
    .omni-brand:hover .brand-icon,
    .omni-brand:visited .brand-icon { color: var(--omni-accent-light); }

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
      background-color: rgba(124, 92, 191, 0.12);
      border: 1px solid rgba(124, 92, 191, 0.3);
      color: var(--omni-text);
      transition: all 0.2s;
    }
    .role-switcher-button:hover {
      background-color: rgba(124, 92, 191, 0.2);
      border-color: rgba(124, 92, 191, 0.4);
    }
    .menu-header {
      font-size: 12px;
      font-weight: 500;
      color: var(--omni-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .active-role {
      background-color: rgba(124, 92, 191, 0.2);
    }
    
    /* User menu button */
    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      margin-left: 8px;
      border-radius: 24px;
      background-color: rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.2);
      color: var(--omni-text);
      transition: all 0.2s;
    }
    .user-menu-button:hover {
      background-color: rgba(124, 92, 191, 0.12);
      border-color: rgba(124, 92, 191, 0.3);
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
    .omni-content {
      background: var(--omni-bg);
      display: flex !important;
      flex-direction: column;
    }

    .omni-breadcrumb-bar {
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 16px;
      gap: 2px;
      background: var(--omni-surface);
      border-bottom: 1px solid var(--omni-border);
      flex-shrink: 0;
    }
    .crumb-link {
      font-size: 12px;
      color: var(--omni-accent-light);
      text-decoration: none;
      white-space: nowrap;
    }
    .crumb-link:hover { text-decoration: underline; }
    .crumb-current {
      font-size: 12px;
      color: var(--omni-text);
      font-weight: 500;
      white-space: nowrap;
    }
    .crumb-sep {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--omni-text-muted);
    }

    .omni-view-area {
      flex: 1;
      overflow: auto;
      min-height: 0;
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
  breadcrumbs = signal<Breadcrumb[]>([]);

  // Segment → human-readable label map
  private readonly LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    user: 'User',
    manager: 'Manager',
    schemas: 'Schemas',
    ce: 'Character Engine',
    admin: 'Admin',
    'trait-groups': 'Trait Groups',
    'trait-defs': 'Trait Definitions',
    'trait-options': 'Trait Options',
    'trait-packs': 'Trait Packs',
    'relationship-types': 'Relationship Types',
    graph: 'Graph',
    relationships: 'Relationships',
    projects: 'Projects',
    tree: 'Tree',
    characters: 'Characters',
    timeline: 'Timeline',
    profile: 'Profile',
    settings: 'Settings',
    me: 'My Workspace',
    activity: 'Activity',
  };
  
  // Auth observables
  currentUser$ = this.authState.currentUser$;
  isAuthenticated$ = this.authState.isAuthenticated$;

  // Computed nav items that update based on current project selection
  navItems = computed(() => {
    const currentProject = this.workspaceState.currentProject();
    const projectId = currentProject?.id;
    
    // If no project selected, return app-level nav items
    if (!projectId) {
      return [
        { path: this.roleRouting.currentDashboard()?.route || '/dashboard/user', label: 'Dashboard', icon: 'dashboard', tooltip: 'User dashboard' },
        { path: '/schemas', label: 'Schemas', icon: 'schema', tooltip: 'Schema templates' },
        { path: '/ce', label: 'Character Engine', icon: 'auto_fix_high', tooltip: 'Character Engine' },
      ];
    }
    
    // If project selected, return full nav with project routes
    return [
      { path: this.roleRouting.currentDashboard()?.route || '/dashboard/user', label: 'Dashboard', icon: 'dashboard', tooltip: 'Return to dashboard' },
      { path: '/schemas', label: 'Schemas', icon: 'schema', tooltip: 'Schema templates' },
      { path: `/projects/${projectId}/tree`, label: 'Tree', icon: 'account_tree', tooltip: 'Project node tree' },
      { path: `/projects/${projectId}/characters`, label: 'Characters', icon: 'people', tooltip: 'Character entity map' },
      { path: `/projects/${projectId}/timeline`, label: 'Timeline', icon: 'timeline', tooltip: 'Chronological events' },
      { path: `/projects/${projectId}/graph`, label: 'Graph', icon: 'hub', tooltip: 'Relationship graph' },
      { path: '/ce', label: 'Character Engine', icon: 'auto_fix_high', tooltip: 'Character Engine' },
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

    // Build breadcrumbs on every navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => this.breadcrumbs.set(this.buildBreadcrumbs((e as NavigationEnd).urlAfterRedirects)));
    // Set breadcrumbs for the initial URL (page load / refresh)
    this.breadcrumbs.set(this.buildBreadcrumbs(this.router.url));
      
    // Check auth state on app init
    this.authState.refresh();
    
    // Initialize roles from authenticated user (needed after page refresh)
    const currentUser = this.authState.getCurrentUser();
    if (currentUser?.roles && currentUser.roles.length > 0) {
      console.log('[AppComponent] Initializing roles from user:', currentUser.roles);
      this.roleRouting.initializeRoles(currentUser.roles, false);
    }
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
    
    // Clear role state
    this.roleRouting.clearRoles();
    
    // Clear workspace/project selection
    this.workspaceState.clearSelection();
    
    // Stay on OWEC - user will see Sign In button
    // RAMPS session will be cleared on next login
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/me']);
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/me/settings']);
  }
  
  switchRole(role: 'sc-acct-mgr' | 'sc-mgr' | 'sc-user'): void {
    // Clear current project selection when switching roles
    this.workspaceState.clearSelection();
    // Navigate to the dashboard for the selected role
    this.roleRouting.navigateToDashboard(role);
  }

  private buildBreadcrumbs(url: string): Breadcrumb[] {
    const clean = url.split('?')[0];
    const segments = clean.split('/').filter(Boolean);
    if (!segments.length) return [];

    const crumbs: Breadcrumb[] = [];
    let accumulated = '';
    for (const seg of segments) {
      accumulated += '/' + seg;
      // Skip UUID-like segments as labels but keep path accumulation
      const isId = /^[0-9a-f-]{8,}$/i.test(seg);
      if (!isId) {
        crumbs.push({
          label: this.LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          path: accumulated,
        });
      }
    }
    return crumbs;
  }
}

