import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  
  // Convenience observables
  public readonly isAuthenticated$: Observable<boolean> = new BehaviorSubject<boolean>(this.authStateSubject.value.isAuthenticated);
  public readonly currentUser$: Observable<UserInfo | null> = new BehaviorSubject<UserInfo | null>(this.authStateSubject.value.user);

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
    (this.isAuthenticated$ as BehaviorSubject<boolean>).next(state.isAuthenticated);
    (this.currentUser$ as BehaviorSubject<UserInfo | null>).next(state.user);
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
    return this.authStateSubject.value.token;
  }

  /**
   * Set authentication state after login
   */
  public login(token: string, user: UserInfo): void {
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
    (this.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    (this.currentUser$ as BehaviorSubject<UserInfo | null>).next(user);
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
    (this.isAuthenticated$ as BehaviorSubject<boolean>).next(false);
    (this.currentUser$ as BehaviorSubject<UserInfo | null>).next(null);
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
    (this.currentUser$ as BehaviorSubject<UserInfo | null>).next(updatedUser);
  }

  /**
   * Refresh state from localStorage (useful after page reload)
   */
  public refresh(): void {
    this.loadFromStorage();
  }
}
