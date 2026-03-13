import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { WorkspaceActivity } from '../models/workspace.models';
import { environment } from '../../../../environments/environment';

interface ActivityApiResponse {
  id: string;
  object_type: string;
  object_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function toActivity(r: ActivityApiResponse): WorkspaceActivity {
  return {
    id: r.id,
    objectType: r.object_type,
    objectId: r.object_id,
    action: r.action,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly base = environment.apiBase.replace('/v1', '');

  recentActivity = signal<WorkspaceActivity[]>([]);

  constructor(private http: HttpClient) {}

  getRecentActivity(limit = 20): Observable<WorkspaceActivity[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http
      .get<ActivityApiResponse[]>(`${this.base}/user-context/activity/recent`, { params })
      .pipe(
        map((items) => items.map(toActivity)),
        tap((items) => this.recentActivity.set(items)),
      );
  }

  getActivityHistory(limit = 50, objectType?: string): Observable<WorkspaceActivity[]> {
    let params = new HttpParams().set('limit', limit);
    if (objectType) params = params.set('object_type', objectType);
    return this.http
      .get<ActivityApiResponse[]>(`${this.base}/user-context/activity/recent`, { params })
      .pipe(map((items) => items.map(toActivity)));
  }

  recordActivity(objectType: string, objectId: string, action: string, metadata: Record<string, unknown> = {}): Observable<WorkspaceActivity> {
    return this.http
      .post<ActivityApiResponse>(`${this.base}/user-context/activity`, {
        object_type: objectType,
        object_id: objectId,
        action,
        metadata,
      })
      .pipe(map(toActivity));
  }
}
