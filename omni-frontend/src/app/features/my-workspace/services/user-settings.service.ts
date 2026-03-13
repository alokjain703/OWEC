import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserSettings, SettingsResponse } from '../models/workspace.models';
import { environment } from '../../../../environments/environment';

interface SettingsApiResponse {
  id: string;
  tenant_id: string;
  user_id: string;
  scope_type: string;
  scope_id: string | null;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly base = environment.apiBase.replace('/v1', '');

  settings = signal<UserSettings>({});

  constructor(private http: HttpClient) {}

  getSettings(scopeType = 'global', scopeId?: string): Observable<SettingsResponse | null> {
    let url = `${this.base}/user-context/settings?scope_type=${scopeType}`;
    if (scopeId) url += `&scope_id=${scopeId}`;
    return this.http.get<SettingsApiResponse | null>(url).pipe(
      map((r) =>
        r
          ? ({
              id: r.id,
              tenantId: r.tenant_id,
              userId: r.user_id,
              scopeType: r.scope_type,
              scopeId: r.scope_id,
              settings: r.settings,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            } as SettingsResponse)
          : null
      ),
      tap((r) => this.settings.set(r?.settings ?? {})),
    );
  }

  updateSettings(settings: UserSettings, scopeType = 'global', scopeId?: string): Observable<SettingsResponse> {
    return this.http
      .put<SettingsApiResponse>(`${this.base}/user-context/settings`, {
        scope_type: scopeType,
        scope_id: scopeId ?? null,
        settings,
      })
      .pipe(
        map(
          (r) =>
            ({
              id: r.id,
              tenantId: r.tenant_id,
              userId: r.user_id,
              scopeType: r.scope_type,
              scopeId: r.scope_id,
              settings: r.settings,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            }) as SettingsResponse
        ),
        tap((r) => this.settings.set(r.settings)),
      );
  }
}
