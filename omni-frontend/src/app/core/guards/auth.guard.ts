import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AuthGuard] Checking authentication for route:', state.url);

  // Check if user is authenticated
  const isAuthenticated = authState.isAuthenticated();
  console.log('[AuthGuard] isAuthenticated:', isAuthenticated);
  
  if (isAuthenticated) {
    console.log('[AuthGuard] User is authenticated, allowing access');
    return true;
  }

  // Not authenticated - redirect to RAMPS login
  console.log('[AuthGuard] User not authenticated, redirecting to RAMPS login...');
  authService.redirectToLogin();
  return false;
};
