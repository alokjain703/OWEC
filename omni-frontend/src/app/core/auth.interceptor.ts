import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

/**
 * HTTP Interceptor that adds Authorization header to requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  let token = authState.getToken();

  // Fallback: if state doesn't have token, try localStorage directly
  if (!token) {
    token = localStorage.getItem('access_token');
    console.log('[AuthInterceptor] Token not in state, checking localStorage directly:', !!token);
  }

  console.log('[AuthInterceptor] Request to:', req.url, 'Has token:', !!token);

  // Build headers: Authorization + X-User-Roles
  const roles = authState.getCurrentUser()?.roles ?? [];
  const rolesHeader = roles.join(',');

  if (token) {
    let headers = req.headers.set('Authorization', `Bearer ${token}`);
    if (rolesHeader) {
      headers = headers.set('X-User-Roles', rolesHeader);
    }
    const clonedRequest = req.clone({ headers });
    console.log('[AuthInterceptor] Added Authorization header, roles:', rolesHeader || '(none)');
    return next(clonedRequest);
  }

  // If no token, proceed with the original request
  console.log('[AuthInterceptor] No token available, proceeding without auth');
  return next(req);
};
