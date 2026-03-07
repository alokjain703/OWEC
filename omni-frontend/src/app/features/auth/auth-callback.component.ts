import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'omni-auth-callback',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
      <p>Processing authentication...</p>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authState: AuthStateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get token and user info from query parameters
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userJson = params['user'];
      
      if (token && userJson) {
        try {
          // Decode user info from query parameter
          const user = JSON.parse(decodeURIComponent(userJson));
          
          // Store token and user info
          this.authState.login(token, user);
          
          // Redirect to home
          this.router.navigate(['/'], { replaceUrl: true });
        } catch (err) {
          console.error('Failed to parse user data:', err);
          // Redirect to RAMPS login
          this.authService.redirectToLogin();
        }
      } else {
        // No token or user provided, redirect to login
        this.authService.redirectToLogin();
      }
    });
  }
}
