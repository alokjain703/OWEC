# OWEC Authentication Integration with RAMPS

## Overview

OWEC (OMNI Narrative Engine) integrates with RAMPS (Resource Access Management Platform Service) for authentication and user management. This document explains how the authentication flow works.

## Architecture

### Components

1. **RAMPS Control Plane** (http://localhost:8051)
   - Centralized authentication service
   - Manages users, roles, and permissions
   - Provides login UI and API endpoints

2. **OWEC Frontend** (http://localhost:4252)
   - Narrative engine application
   - Delegates authentication to RAMPS
   - Displays logged-in user information

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. User visits OWEC → Not authenticated
   │
   ├─→ User clicks "Sign In" button
   │
2. OWEC redirects to RAMPS Login
   │   URL: http://localhost:8051/login?returnUrl=http://localhost:4252/auth/callback
   │
3. User enters credentials in RAMPS UI
   │
   ├─→ RAMPS validates credentials
   │
4. RAMPS redirects back to OWEC with token
   │   URL: http://localhost:4252/auth/callback?token=<access_token>
   │
5. OWEC callback handler processes token
   │   ├─→ Verifies token with RAMPS API
   │   ├─→ Stores token in localStorage
   │   └─→ Stores user info in localStorage
   │
6. OWEC redirects to home page
   │
   └─→ User info displayed in header dropdown
```

## Files Created/Modified

### OWEC Files

#### Services
- `src/app/core/services/auth-state.service.ts` - Manages authentication state
- `src/app/core/services/auth.service.ts` - Handles RAMPS API communication
- `src/app/core/auth.interceptor.ts` - Adds Authorization header to HTTP requests

#### Components
- `src/app/features/auth/auth-callback.component.ts` - Handles redirect from RAMPS
- `src/app/app.component.ts` - Updated with user dropdown menu in header

#### Configuration
- `src/environments/environment.ts` - Added RAMPS URLs
- `src/app/app.routes.ts` - Added auth/callback route
- `src/app/app.config.ts` - Registered auth interceptor
- `src/styles.scss` - Added user menu styles

### RAMPS Files

#### Components
- `apps/ramps-frontend/src/app/domains/auth/login-page.component.ts` - Updated to support returnUrl parameter

## API Endpoints Used

### RAMPS API

1. **POST /api/auth/login**
   - Request: `{ email, password }`
   - Response: `{ access_token, token_type, user: {...} }`

2. **GET /api/auth/me** (Future)
   - Headers: `Authorization: Bearer <token>`
   - Response: `{ user: {...} }`

## User Interface

### OWEC Header

The OWEC header now displays:

1. **When User is Not Authenticated:**
   - "Sign In" button → Redirects to RAMPS login

2. **When User is Authenticated:**
   - User avatar icon
   - User display name
   - Dropdown menu with:
     - Email address
     - Tenant ID (truncated)
     - My Profile link
     - Account Settings link
     - Sign Out button

### Example User Menu

```
┌──────────────────────────────────┐
│  john.doe@example.com            │
│  Tenant: a1b2c3d4...             │
├──────────────────────────────────┤
│  👤 My Profile                    │
│  ⚙️  Account Settings             │
├──────────────────────────────────┤
│  🚪 Sign Out                      │
└──────────────────────────────────┘
```

## Security Features

1. **Token Storage**: Access tokens stored in localStorage
2. **HTTP Interceptor**: Automatically adds Bearer token to API requests
3. **Token Verification**: Tokens can be verified with RAMPS `/auth/me` endpoint
4. **Logout**: Clears token and user data from localStorage

## Environment Configuration

### OWEC Environment (environment.ts)

```typescript
export const environment = {
  production: false,
  apiBase: 'http://localhost:8052/api/v1',      // OWEC backend API
  rampsApiBase: 'http://localhost:8051/api',    // RAMPS API
  rampsLoginUrl: 'http://localhost:8051/login',  // RAMPS login page
  omniBaseUrl: 'http://localhost:4252'           // OWEC frontend URL
};
```

### RAMPS Environment (env.ts)

```typescript
export const env: AppEnv = {
  apiUrl: window.__env?.apiUrl ?? 'http://localhost:8051/api',
  authUrl: window.__env?.authUrl ?? 'http://localhost:8051/api/auth',
};
```

## Testing the Flow

### Prerequisites
1. Start RAMPS backend: `cd RAMPS && npm run dev` (or appropriate command)
2. Start RAMPS frontend: `cd RAMPS/apps/ramps-frontend && npm run dev`
3. Start OWEC backend: `cd OWEC && make start-backend` (if needed)
4. Start OWEC frontend: `cd OWEC && make start`

### Test Steps

1. Open OWEC at http://localhost:4252
2. Click "Sign In" button in top-right corner
3. Browser redirects to RAMPS login at http://localhost:8051/login
4. Enter valid RAMPS credentials
5. After successful login, browser redirects back to OWEC
6. User info appears in header dropdown

## Logout Flow

1. User clicks "Sign Out" in dropdown menu
2. OWEC clears localStorage (token and user data)
3. OWEC redirects to RAMPS login page
4. User is signed out

## Future Enhancements

### Planned Features
1. **Refresh Token Flow**: Implement token refresh mechanism
2. **Auth Guard**: Protect routes requiring authentication
3. **Role-Based Access**: Show/hide features based on user roles
4. **Session Timeout**: Auto-logout after inactivity
5. **Remember Me**: Optional persistent sessions
6. **Multi-Factor Authentication**: Support RAMPS MFA flow

### API Improvements
1. **GET /api/auth/me**: Verify and get current user info
2. **POST /api/auth/logout**: Server-side logout
3. **POST /api/auth/refresh**: Refresh access token

## Troubleshooting

### Common Issues

**Issue**: Redirect loop between OWEC and RAMPS
- **Solution**: Check that returnUrl parameter is correctly encoded
- **Solution**: Verify both apps are running on correct ports

**Issue**: Token not being stored
- **Solution**: Check browser console for errors
- **Solution**: Verify localStorage is not disabled

**Issue**: User info not displaying
- **Solution**: Check that token is valid
- **Solution**: Verify user object structure matches UserInfo interface

**Issue**: 401 Unauthorized errors
- **Solution**: Check that auth interceptor is registered
- **Solution**: Verify token format is `Bearer <token>`

## Code Examples

### Checking Authentication Status

```typescript
import { AuthStateService } from './core/services/auth-state.service';

constructor(private authState: AuthStateService) {
  // Subscribe to auth state
  this.authState.isAuthenticated$.subscribe(isAuth => {
    console.log('User authenticated:', isAuth);
  });
  
  // Get current user
  this.authState.currentUser$.subscribe(user => {
    console.log('Current user:', user);
  });
}
```

### Manual Login Redirect

```typescript
import { AuthService } from './core/services/auth.service';

constructor(private authService: AuthService) {}

login() {
  this.authService.redirectToLogin();
}
```

### Getting Current User (Synchronous)

```typescript
import { AuthStateService } from './core/services/auth-state.service';

constructor(private authState: AuthStateService) {}

getCurrentUserInfo() {
  const user = this.authState.getCurrentUser();
  if (user) {
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Roles:', user.roles);
  }
}
```

## References

- RAMPS Documentation: `/2026/RAMPS/ZZ_DOCS/`
- Angular HTTP Interceptors: https://angular.io/guide/http-interceptor-use-cases
- Material Design Menus: https://material.angular.io/components/menu/overview
