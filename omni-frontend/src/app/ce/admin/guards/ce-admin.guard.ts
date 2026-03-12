import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../../../core/services/auth-state.service';

/** Roles allowed to access the CE admin area. */
export const CE_ADMIN_ROLES = ['sc-mgr', 'sc-acct-mgr'] as const;
export type CeAdminRole = (typeof CE_ADMIN_ROLES)[number];

/**
 * Per-section role requirements.
 *
 * sc-user     — no admin access
 * sc-mgr      — trait groups, trait packs, relationship types
 * sc-acct-mgr — all sections
 */
export const CE_ADMIN_PERMISSIONS: Record<string, CeAdminRole[]> = {
  schemas:              ['sc-acct-mgr'],
  'trait-groups':       ['sc-mgr', 'sc-acct-mgr'],
  'trait-defs':         ['sc-acct-mgr'],
  'trait-options':      ['sc-acct-mgr'],
  'trait-packs':        ['sc-mgr', 'sc-acct-mgr'],
  'relationship-types': ['sc-mgr', 'sc-acct-mgr'],
};

/**
 * Route guard — allows sc-mgr and sc-acct-mgr only.
 * Unauthorized users are redirected to /ce.
 */
export const ceAdminGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthStateService);
  const router = inject(Router);

  const roles     = auth.getCurrentUser()?.roles ?? [];
  const hasAccess = CE_ADMIN_ROLES.some((r) => roles.includes(r));

  if (hasAccess) return true;

  console.warn(`[ceAdminGuard] Access denied to "${state.url}" — roles: ${roles.join(', ') || 'none'}`);
  return router.createUrlTree(['/ce']);
};

/**
 * Helper — returns true when the user holds at least one of the required roles.
 * Safe to use in components/templates for conditional rendering.
 */
export function hasAdminRole(auth: AuthStateService, ...required: CeAdminRole[]): boolean {
  const roles = auth.getCurrentUser()?.roles ?? [];
  return required.some((r) => roles.includes(r));
}
