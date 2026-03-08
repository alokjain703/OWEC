import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export type UserRole = 'sc-acct-mgr' | 'sc-mgr' | 'sc-user';

export interface RoleDashboardMapping {
  role: UserRole;
  route: string;
  label: string;
  priority: number;
}

/**
 * Service for managing role-based routing and dashboard selection
 */
@Injectable({
  providedIn: 'root'
})
export class RoleRoutingService {
  // Role to dashboard mappings with priority
  private readonly roleMappings: RoleDashboardMapping[] = [
    { role: 'sc-acct-mgr', route: '/dashboard/account-manager', label: 'Account Manager', priority: 1 },
    { role: 'sc-mgr', route: '/dashboard/manager', label: 'Manager', priority: 2 },
    { role: 'sc-user', route: '/dashboard/user', label: 'User', priority: 3 }
  ];

  // Current active role signal
  private readonly _currentRole = signal<UserRole | null>(null);
  readonly currentRole = this._currentRole.asReadonly();

  // Available roles for the user
  private readonly _availableRoles = signal<UserRole[]>([]);
  readonly availableRoles = this._availableRoles.asReadonly();

  // Computed signals
  readonly hasMultipleRoles = computed(() => this._availableRoles().length > 1);
  readonly currentDashboard = computed(() => {
    const role = this._currentRole();
    if (!role) return null;
    return this.roleMappings.find(m => m.role === role) || null;
  });

  constructor(private router: Router) {
    // Load current role and available roles from localStorage
    this.loadCurrentRole();
    this.loadAvailableRoles();
  }

  /**
   * Initialize with user's roles from JWT token
   */
  initializeRoles(roles: string[], forceUpdate: boolean = false): void {
    console.log('RoleRoutingService - initializeRoles called with:', { roles, forceUpdate });
    
    // Normalize and filter to valid roles
    const validRoles = roles
      .map(r => this.normalizeRole(r))
      .filter(r => r !== null) as UserRole[];

    console.log('RoleRoutingService - valid roles after normalization:', validRoles);
    
    this._availableRoles.set(validRoles);
    
    // Persist available roles to localStorage
    try {
      localStorage.setItem('availableRoles', JSON.stringify(validRoles));
    } catch (error) {
      console.error('Error saving available roles:', error);
    }

    // Set current role if not already set OR if forcing update (e.g., on fresh login)
    if (!this._currentRole() || forceUpdate) {
      if (validRoles.length > 0) {
        const primaryRole = this.getPrimaryRole(validRoles);
        console.log('RoleRoutingService - setting primary role:', primaryRole);
        this.setCurrentRole(primaryRole);
      }
    } else {
      console.log('RoleRoutingService - keeping existing role:', this._currentRole());
    }
  }

  /**
   * Set the current active role
   */
  setCurrentRole(role: UserRole): void {
    if (!this._availableRoles().includes(role)) {
      console.warn(`Role ${role} not available for user`);
      return;
    }

    this._currentRole.set(role);
    localStorage.setItem('currentRole', role);
  }

  /**
   * Navigate to the dashboard for the current role
   */
  navigateToCurrentDashboard(): void {
    const dashboard = this.currentDashboard();
    console.log('RoleRoutingService - navigateToCurrentDashboard:', {
      currentRole: this._currentRole(),
      dashboard: dashboard,
      route: dashboard?.route
    });
    
    if (dashboard) {
      this.router.navigate([dashboard.route]);
    } else {
      // Fallback to user dashboard if no role is set
      console.warn('No current role set, navigating to user dashboard');
      this.router.navigate(['/dashboard/user']);
    }
  }

  /**
   * Navigate to the dashboard for a specific role
   */
  navigateToDashboard(role: UserRole): void {
    const mapping = this.roleMappings.find(m => m.role === role);
    if (mapping) {
      this.setCurrentRole(role);
      this.router.navigate([mapping.route]);
    }
  }

  /**
   * Get the primary role (highest priority) from a list of roles
   */
  getPrimaryRole(roles: UserRole[]): UserRole {
    if (roles.length === 0) return 'sc-user';
    
    // Find role with highest priority (lowest number)
    let primaryRole: UserRole = 'sc-user';
    let highestPriority = 999;

    for (const role of roles) {
      const mapping = this.roleMappings.find(m => m.role === role);
      if (mapping && mapping.priority < highestPriority) {
        highestPriority = mapping.priority;
        primaryRole = role;
      }
    }

    return primaryRole;
  }

  /**
   * Get dashboard route for a given role
   */
  getDashboardRoute(role: UserRole): string {
    const mapping = this.roleMappings.find(m => m.role === role);
    return mapping?.route || '/dashboard/user';
  }

  /**
   * Get dashboard label for a given role
   */
  getDashboardLabel(role: UserRole): string {
    const mapping = this.roleMappings.find(m => m.role === role);
    return mapping?.label || 'User Dashboard';
  }

  /**
   * Get all available dashboard options for the user
   */
  getAvailableDashboards(): RoleDashboardMapping[] {
    return this._availableRoles()
      .map(role => this.roleMappings.find(m => m.role === role))
      .filter(m => m !== undefined) as RoleDashboardMapping[];
  }

  /**
   * Normalize role name from various formats
   */
  private normalizeRole(role: string): UserRole | null {
    const normalized = role.toLowerCase().trim();
    
    // Account Manager variations
    if (normalized.includes('acct') || normalized.includes('account')) {
      return 'sc-acct-mgr';
    }
    
    // Manager variations (but not account manager)
    if (normalized.includes('mgr') || normalized.includes('manager')) {
      return 'sc-mgr';
    }
    
    // User variations
    if (normalized === 'user' || normalized === 'sc-user') {
      return 'sc-user';
    }
    
    // Try exact match
    if (normalized === 'sc-acct-mgr' || normalized === 'sc-mgr' || normalized === 'sc-user') {
      return normalized as UserRole;
    }
    
    return null;
  }

  /**
   * Load current role from localStorage
   */
  private loadCurrentRole(): void {
    try {
      const savedRole = localStorage.getItem('currentRole') as UserRole | null;
      if (savedRole) {
        this._currentRole.set(savedRole);
      }
    } catch (error) {
      console.error('Error loading current role:', error);
    }
  }

  /**
   * Load available roles from localStorage
   */
  private loadAvailableRoles(): void {
    try {
      const savedRoles = localStorage.getItem('availableRoles');
      if (savedRoles) {
        const roles = JSON.parse(savedRoles) as UserRole[];
        this._availableRoles.set(roles);
      }
    } catch (error) {
      console.error('Error loading available roles:', error);
    }
  }

  /**
   * Clear role state (on logout)
   */
  clearRoles(): void {
    this._currentRole.set(null);
    this._availableRoles.set([]);
    localStorage.removeItem('currentRole');
    localStorage.removeItem('availableRoles');
  }
}
