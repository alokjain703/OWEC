import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserInfo } from './auth-state.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly rampsApiUrl = environment.rampsApiBase;

  constructor(private http: HttpClient) {}

  /**
   * Redirect to RAMPS login page
   */
  redirectToLogin(): void {
    const returnUrl = encodeURIComponent(`${environment.omniBaseUrl}/auth/callback`);
    window.location.href = `${environment.rampsLoginUrl}?returnUrl=${returnUrl}`;
  }

  /**
   * Verify token with RAMPS API
   */
  verifyToken(token: string): Observable<{ user: UserInfo }> {
    return this.http.get<{ user: UserInfo }>(`${this.rampsApiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Logout from RAMPS
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.rampsApiUrl}/auth/logout`, {});
  }

  /**
   * Refresh access token
   */
  refreshToken(refreshToken: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.rampsApiUrl}/auth/refresh`, {
      refresh_token: refreshToken
    });
  }
}
