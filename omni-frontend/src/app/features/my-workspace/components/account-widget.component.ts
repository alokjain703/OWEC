import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RampsAccountService } from '../services/ramps-account.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { UserProfile } from '../models/workspace.models';

@Component({
  selector: 'omni-account-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="widget-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>manage_accounts</mat-icon>
        <mat-card-title>Account</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="spinner-wrap"><mat-spinner diameter="32" /></div>
        } @else {
          <div class="profile-section">
            <mat-icon class="big-avatar">account_circle</mat-icon>
            <div class="profile-info">
              <div class="display-name">{{ profile()?.displayName ?? fallbackName() }}</div>
              <div class="email">{{ profile()?.email ?? fallbackEmail() }}</div>
              @if (profile()?.tenantId) {
                <div class="tenant">Tenant: {{ profile()!.tenantId.substring(0, 8) }}…</div>
              }
            </div>
          </div>

          <mat-divider class="section-divider" />

          <div class="security-section">
            <span class="section-label">Security</span>
            <div class="security-links">
              <button mat-button (click)="ramps.changePasswordRedirect()">
                <mat-icon>lock_reset</mat-icon>
                Change Password
              </button>
              <button mat-button (click)="ramps.manageApiKeysRedirect()">
                <mat-icon>vpn_key</mat-icon>
                API Keys
              </button>
              <button mat-button (click)="ramps.manageSessionsRedirect()">
                <mat-icon>devices</mat-icon>
                Sessions
              </button>
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .widget-card { height: 100%; }
    .spinner-wrap { display: flex; justify-content: center; padding: 24px; }
    .profile-section { display: flex; gap: 16px; align-items: center; padding: 8px 0 16px; }
    .big-avatar { font-size: 48px; width: 48px; height: 48px; color: var(--omni-accent-light); }
    .display-name { font-size: 16px; font-weight: 600; }
    .email { font-size: 13px; color: var(--omni-text-muted); }
    .tenant { font-size: 12px; color: var(--omni-text-muted); margin-top: 2px; }
    .section-divider { margin: 8px 0; }
    .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--omni-text-muted); }
    .security-links { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
    .security-links button { justify-content: flex-start; }
  `],
})
export class AccountWidgetComponent implements OnInit {
  ramps = inject(RampsAccountService);
  private authState = inject(AuthStateService);

  loading = signal(true);
  profile = signal<UserProfile | null>(null);

  fallbackName = signal('');
  fallbackEmail = signal('');

  ngOnInit(): void {
    // Populate fallback from auth state (always available)
    const user = this.authState.getCurrentUser() ?? null;
    if (user) {
      this.fallbackName.set(user.display_name);
      this.fallbackEmail.set(user.email);
    }

    this.ramps.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
