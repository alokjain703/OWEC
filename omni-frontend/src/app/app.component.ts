import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from './core/services/theme.service';
import { ThemeSwitcherComponent } from './theme-switcher.component';

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
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule,
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
          @for (item of navItems; track item.path) {
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
          <span class="toolbar-spacer"></span>
          <omni-theme-switcher />
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
  // Inject ThemeService here so its effect() runs at app startup
  private themeSvc = inject(ThemeService);

  isMobile = signal(false);
  sidenavOpen = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');

  navItems: NavItem[] = [
    { path: '/tree',       label: 'Tree',       icon: 'account_tree', tooltip: 'Project node tree' },
    { path: '/characters', label: 'Characters',  icon: 'people',       tooltip: 'Character entity map' },
    { path: '/timeline',   label: 'Timeline',    icon: 'timeline',     tooltip: 'Chronological events' },
    { path: '/graph',      label: 'Graph',       icon: 'hub',          tooltip: 'Relationship graph' },
    { path: '/schemas',    label: 'Schemas',     icon: 'schema',       tooltip: 'Bible / writing schemas' },
  ];

  constructor() {
    this.bp.observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.sidenavMode.set(result.matches ? 'over' : 'side');
        this.sidenavOpen.set(!result.matches);
      });
  }
}

