import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface UserInfo {
  id: string;
  email: string;
  display_name: string;
  tenant_id: string;
  status: string;
  roles?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly authStateSubject = new BehaviorSubject<AuthState>(this.getInitialState());
  
  // Public observable for components to subscribe to
  public readonly authState$: Observable<AuthState> = this.authStateSubject.asObservable();
  
  // Convenience observables - derived from main state
  public readonly isAuthenticated$: Observable<boolean> = this.authState$.pipe(
    map(state => state.isAuthenticated),
    distinctUntilChanged()
  );
  
  public readonly currentUser$: Observable<UserInfo | null> = this.authState$.pipe(
    map(state => state.user),
    distinctUntilChanged()
  );

  constructor() {
    // Initialize from localStorage
    this.loadFromStorage();
  }

  /**
   * Get initial state from localStorage
   */
  private getInitialState(): AuthState {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        return {
          isAuthenticated: true,
          user,
          token
        };
      } catch {
        return {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }
    }
    
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  }

  /**
   * Load auth state from localStorage
   */
  private loadFromStorage(): void {
    const state = this.getInitialState();
    this.authStateSubject.next(state);
  }

  /**
   * Get current auth state value (synchronous)
   */
  public getCurrentState(): AuthState {
    return this.authStateSubject.value;
  }

  /**
   * Get current user (synchronous)
   */
  public getCurrentUser(): UserInfo | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  public isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Get current token (synchronous)
   */
  public getToken(): string | null {
    const token = this.authStateSubject.value.token;
    const tokenFromStorage = localStorage.getItem('access_token');
    console.log('[AuthState] getToken() - from state:', !!token, 'from localStorage:', !!tokenFromStorage);
    console.log('[AuthState] Token first 20 chars:', token ? token.substring(0, 20) + '...' : 'NULL');
    return token;
  }

  /**
   * Set authentication state after login
   */
  public login(token: string, user: UserInfo): void {
    console.log('[AuthState] login() called, saving token and user:', { email: user.email });
    console.log('[AuthState] Token to save (first 20):', token.substring(0, 20) + '...');
    
    // Save to localStorage
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update state
    const newState: AuthState = {
      isAuthenticated: true,
      user,
      token
    };
    
    this.authStateSubject.next(newState);
    
    console.log('[AuthState] Token saved to state and localStorage');
    console.log('[AuthState] Verify - isAuthenticated:', this.isAuthenticated());
    console.log('[AuthState] Verify - token from state:', !!this.authStateSubject.value.token);
    console.log('[AuthState] Verify - token from localStorage:', !!localStorage.getItem('access_token'));
  }

  /**
   * Clear authentication state on logout
   */
  public logout(): void {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    // Update state
    const newState: AuthState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    
    this.authStateSubject.next(newState);
  }

  /**
   * Update user information (e.g., after profile update)
   */
  public updateUser(user: Partial<UserInfo>): void {
    const currentState = this.authStateSubject.value;
    
    if (!currentState.user) {
      return;
    }
    
    const updatedUser = { ...currentState.user, ...user };
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update state
    const newState: AuthState = {
      ...currentState,
      user: updatedUser
    };
    
    this.authStateSubject.next(newState);
  }

  /**
   * Refresh state from localStorage (useful after page reload)
   */
  public refresh(): void {
    this.loadFromStorage();
  }
}
