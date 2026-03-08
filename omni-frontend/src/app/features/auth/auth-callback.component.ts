import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RoleRoutingService } from '../../core/services/role-routing.service';
import { WorkspaceStateService } from '../../core/services/workspace-state.service';

@Component({
  selector: 'omni-auth-callback',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
      <p>Processing authentication...</p>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private isProcessing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authState: AuthStateService,
    private authService: AuthService,
    private roleRouting: RoleRoutingService,
    private workspaceState: WorkspaceStateService
  ) {}

  async ngOnInit(): Promise<void> {
    // Get token and user info from query parameters
    this.subscription = this.route.queryParams.subscribe(params => {
      // Prevent re-processing if already in progress
      if (this.isProcessing) {
        console.log('[AuthCallback] Already processing, skipping...');
        return;
      }

      const token = params['token'];
      const userJson = params['user'];
      
      console.log('[AuthCallback] Received params:', { hasToken: !!token, hasUser: !!userJson });
      
      if (token && userJson) {
        this.isProcessing = true;
        
        try {
          // Decode user info from query parameter
          const user = JSON.parse(decodeURIComponent(userJson));
          console.log('[AuthCallback] Parsed user:', { id: user.id, email: user.email, roles: user.roles });
          
          // CRITICAL: Store token and user info IMMEDIATELY (not in setTimeout)
          // This ensures the token is available before any navigation/loading happens
          this.authState.login(token, user);
          console.log('[AuthCallback] Token saved immediately');
          
          // Defer navigation and workspace loading to avoid change detection errors
          setTimeout(() => {
            // Initialize role routing with user's roles (force update on fresh login)
            if (user.roles && user.roles.length > 0) {
              this.roleRouting.initializeRoles(user.roles, true);
              console.log('[AuthCallback] Initialized roles:', user.roles);
            } else {
              // Default to 'sc-user' role if no roles provided
              this.roleRouting.initializeRoles(['sc-user'], true);
              console.log('[AuthCallback] No roles provided, defaulting to sc-user');
            }
            
            // Navigate to appropriate dashboard based on primary role
            console.log('[AuthCallback] Navigating to dashboard for role:', this.roleRouting.currentRole());
            this.roleRouting.navigateToCurrentDashboard();
            
            // Load workspaces in the background after navigation
            // Dashboard will use these once loaded
            console.log('[AuthCallback] Starting workspace load...');
            this.workspaceState.loadWorkspaces(true).catch(err => {
              console.error('[AuthCallback] Failed to load workspaces:', err);
            });
          }, 0);
        } catch (err) {
          console.error('[AuthCallback] Failed to parse user data:', err);
          this.isProcessing = false;
          // Redirect to RAMPS login
          this.authService.redirectToLogin();
        }
      } else {
        console.warn('[AuthCallback] Missing token or user, redirecting to login');
        // No token or user provided, redirect to login
        this.authService.redirectToLogin();
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
