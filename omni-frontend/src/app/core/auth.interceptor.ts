import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

/**
 * HTTP Interceptor that adds Authorization header to requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const token = authState.getToken();

  console.log('[AuthInterceptor] Request to:', req.url, 'Has token:', !!token);

  // If we have a token, clone the request and add the Authorization header
  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    console.log('[AuthInterceptor] Added Authorization header');
    return next(clonedRequest);
  }

  // If no token, proceed with the original request
  console.log('[AuthInterceptor] No token available, proceeding without auth');
  return next(req);
};
