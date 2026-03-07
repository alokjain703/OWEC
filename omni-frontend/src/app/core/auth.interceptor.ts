import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

/**
 * HTTP Interceptor that adds Authorization header to requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const token = authState.getToken();

  // If we have a token, clone the request and add the Authorization header
  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedRequest);
  }

  // If no token, proceed with the original request
  return next(req);
};
