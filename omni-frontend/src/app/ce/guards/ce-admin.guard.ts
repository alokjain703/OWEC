import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../../core/services/auth-state.service';

/** Roles that are allowed to enter the admin section at all. */
export const CE_ADMIN_ROLES = ['sc-mgr', 'sc-acct-mgr'] as const;
export type CeAdminRole = (typeof CE_ADMIN_ROLES)[number];

/** Full permissions map — controls per-section access within admin. */
export const CE_ADMIN_PERMISSIONS: Record<string, CeAdminRole[]> = {
  schemas:            ['sc-acct-mgr'],
  'trait-groups':     ['sc-acct-mgr'],
  'trait-defs':       ['sc-acct-mgr'],
  'trait-options':    ['sc-acct-mgr'],
  'trait-packs':      ['sc-mgr', 'sc-acct-mgr'],
  'relationship-types': ['sc-mgr', 'sc-acct-mgr'],
};

/**
 * Route guard for the CE admin area.
 *
 * Requires: sc-mgr OR sc-acct-mgr
 * Unauthorized users are redirected to /ce.
 *
 * Usage in routes:
 *   canActivate: [ceAdminGuard]
 */
export const ceAdminGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router    = inject(Router);

  const user  = authState.getCurrentUser();
  const roles = user?.roles ?? [];

  const hasAccess = CE_ADMIN_ROLES.some((r) => roles.includes(r));

  if (hasAccess) {
    return true;
  }

  console.warn(`[ceAdminGuard] Access denied to "${state.url}" — user roles: ${roles.join(', ') || 'none'}`);
  return router.createUrlTree(['/ce']);
};

/**
 * Helper — returns true when the current user holds a given admin role.
 * Use inside components to conditionally show/hide admin UI elements.
 */
export function hasAdminRole(
  authState: AuthStateService,
  ...required: CeAdminRole[]
): boolean {
  const roles = authState.getCurrentUser()?.roles ?? [];
  return required.some((r) => roles.includes(r));
}
