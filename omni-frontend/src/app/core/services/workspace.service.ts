import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkspaceDto {
  id: string;
  name: string;
  description: string | null;
  workspace_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface ProjectCacheDto {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  project_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface WorkspaceWithProjects extends WorkspaceDto {
  projects: ProjectCacheDto[];
}

export interface SyncWorkspacesRequest {
  force: boolean;
}

export interface SyncWorkspacesResponse {
  workspaces_synced: number;
  projects_synced: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly apiUrl = '/api/v1/workspaces';

  constructor(private http: HttpClient) {}

  /**
   * Sync workspaces and projects from RAMPS
   */
  syncWorkspaces(force: boolean = false): Observable<SyncWorkspacesResponse> {
    return this.http.post<SyncWorkspacesResponse>(`${this.apiUrl}/sync`, { force });
  }

  /**
   * Get all workspaces with their projects (cached data)
   */
  getUserWorkspaces(): Observable<WorkspaceWithProjects[]> {
    return this.http.get<WorkspaceWithProjects[]>(`${this.apiUrl}/`);
  }

  /**
   * Get projects for a specific workspace
   */
  getWorkspaceProjects(workspaceId: string): Observable<ProjectCacheDto[]> {
    return this.http.get<ProjectCacheDto[]>(`${this.apiUrl}/${workspaceId}/projects`);
  }
}
