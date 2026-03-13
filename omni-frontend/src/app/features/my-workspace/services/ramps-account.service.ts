import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/workspace.models';
import { environment } from '../../../../environments/environment';

interface RampsProfileResponse {
  id: string;
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  tenant_id: string;
  roles?: string[];
  avatar_url?: string;
}

@Injectable({ providedIn: 'root' })
export class RampsAccountService {
  private readonly rampsBase = environment.rampsApiBase;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<RampsProfileResponse>(`${this.rampsBase}/user/profile`).pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (source) => new Observable<UserProfile>((obs) => {
        source.subscribe({
          next: (r) => obs.next({
            id: r.id,
            email: r.email,
            displayName: r.display_name,
            firstName: r.first_name,
            lastName: r.last_name,
            tenantId: r.tenant_id,
            roles: r.roles,
            avatarUrl: r.avatar_url,
          }),
          error: (e) => obs.error(e),
          complete: () => obs.complete(),
        });
      }),
    );
  }

  changePasswordRedirect(): void {
    window.location.href = `${environment.rampsApiBase.replace('/api', '')}/account/security`;
  }

  manageApiKeysRedirect(): void {
    window.location.href = `${environment.rampsApiBase.replace('/api', '')}/account/api-keys`;
  }

  manageSessionsRedirect(): void {
    window.location.href = `${environment.rampsApiBase.replace('/api', '')}/account/sessions`;
  }
}
