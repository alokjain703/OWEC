import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { RoleRoutingService } from '../../../core/services/role-routing.service';
import { WorkspaceStateService } from '../../../core/services/workspace-state.service';

@Component({
  selector: 'omni-avatar-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule],
  template: `
    @if (currentUser$ | async; as currentUser) {
      <button mat-button [matMenuTriggerFor]="avatarMenu" class="avatar-button" aria-label="Account menu">
        <mat-icon>account_circle</mat-icon>
        <span class="user-name">{{ currentUser.display_name }}</span>
        <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
      </button>

      <mat-menu #avatarMenu="matMenu" class="avatar-dropdown">
        <!-- User info header -->
        <div class="menu-user-info" mat-menu-item disabled>
          <mat-icon class="menu-avatar-icon">account_circle</mat-icon>
          <div class="menu-user-text">
            <div class="menu-display-name">{{ currentUser.display_name }}</div>
            <div class="menu-email">{{ currentUser.email }}</div>
          </div>
        </div>
        <mat-divider />

        <button mat-menu-item routerLink="/me">
          <mat-icon>home_work</mat-icon>
          <span>My Workspace</span>
        </button>
        <button mat-menu-item routerLink="/me/activity">
          <mat-icon>history</mat-icon>
          <span>Activity</span>
        </button>
        <button mat-menu-item routerLink="/me/settings">
          <mat-icon>tune</mat-icon>
          <span>Settings</span>
        </button>
        <mat-divider />
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
  `,
  styles: [`
    .avatar-button {
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
    .avatar-button:hover {
      background-color: rgba(124, 92, 191, 0.12);
      border-color: rgba(124, 92, 191, 0.3);
    }
    .user-name { font-size: 14px; font-weight: 500; }
    .dropdown-icon { font-size: 20px; width: 20px; height: 20px; }

    .menu-user-info {
      display: flex !important;
      align-items: center !important;
      gap: 12px;
      padding: 12px 16px !important;
      min-height: 56px !important;
      pointer-events: none;
    }
    .menu-avatar-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--omni-accent-light);
    }
    .menu-display-name {
      font-weight: 600;
      font-size: 14px;
    }
    .menu-email {
      font-size: 12px;
      color: var(--omni-text-muted);
    }
  `],
})
export class AvatarMenuComponent {
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private authService = inject(AuthService);
  private roleRouting = inject(RoleRoutingService);
  private workspaceState = inject(WorkspaceStateService);

  currentUser$ = this.authState.currentUser$;

  login(): void {
    this.authService.redirectToLogin(true);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {},
    });
    this.authState.logout();
    this.roleRouting.clearRoles();
    this.workspaceState.clearSelection();
  }
}
