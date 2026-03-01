import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Workspace, WorkspaceCreate, WorkspaceUpdate, WorkspaceMember, WorkspaceMemberAdd } from '../models/workspace.model';

const API_BASE = (typeof window !== 'undefined' && (window as any)['__OMNI_API_BASE__'])
  || 'http://localhost:8052/api/v1';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private readonly base = API_BASE;

  // ── State signals ──────────────────────────────────────────────────────────
  readonly workspaces = signal<Workspace[]>([]);
  readonly activeWorkspace = signal<Workspace | null>(null);
  readonly loading = signal(false);

  readonly activeWorkspaceId = computed(() => this.activeWorkspace()?.id || null);
  readonly userRole = computed(() => {
    const ws = this.activeWorkspace();
    const userId = this.getCurrentUserId();
    if (!ws || !ws.members || !userId) return null;
    const member = ws.members.find(m => m.user_id === userId);
    return member?.role || null;
  });

  // ── Permission helpers ─────────────────────────────────────────────────────
  readonly canCreateProject = computed(() => {
    const role = this.userRole();
    return role === 'owner' || role === 'admin';
  });

  readonly canEdit = computed(() => {
    const role = this.userRole();
    return role === 'owner' || role === 'admin' || role === 'editor';
  });

  readonly canDelete = computed(() => {
    const role = this.userRole();
    return role === 'owner';
  });

  readonly canManageMembers = computed(() => {
    const role = this.userRole();
    return role === 'owner';
  });

  // ── User ID management (placeholder) ──────────────────────────────────────
  private getCurrentUserId(): string | null {
    // In production, extract from JWT or auth service
    // For testing: use default ID if none exists
    let userId = localStorage.getItem('omni_user_id');
    if (!userId) {
      userId = '6c6286ff-1ff6-4f68-89be-e1e49c6be566'; // Default test user ID
      localStorage.setItem('omni_user_id', userId);
      console.log('🧪 Using default test user ID:', userId);
    }
    return userId;
  }

  setCurrentUserId(userId: string): void {
    localStorage.setItem('omni_user_id', userId);
  }

  private getHeaders(): HttpHeaders {
    const userId = this.getCurrentUserId();
    return new HttpHeaders(userId ? { 'X-User-Id': userId } : {});
  }

  // ── API calls ──────────────────────────────────────────────────────────────
  loadWorkspaces(): void {
    this.loading.set(true);
    this.http.get<Workspace[]>(`${this.base}/workspaces`, { headers: this.getHeaders() })
      .subscribe({
        next: (list) => {
          this.workspaces.set(list);
          this.loading.set(false);
          // Auto-select first workspace if none active
          if (!this.activeWorkspace() && list.length > 0) {
            this.setActiveWorkspace(list[0]);
          }
        },
        error: () => { this.loading.set(false); },
      });
  }

  setActiveWorkspace(workspace: Workspace): void {
    this.activeWorkspace.set(workspace);
    localStorage.setItem('omni_active_workspace_id', workspace.id);
  }

  restoreActiveWorkspace(): void {
    const savedId = localStorage.getItem('omni_active_workspace_id');
    if (savedId) {
      const ws = this.workspaces().find(w => w.id === savedId);
      if (ws) {
        this.activeWorkspace.set(ws);
      }
    }
  }

  createWorkspace(payload: WorkspaceCreate): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/workspaces`, payload, { headers: this.getHeaders() })
      .pipe(
        tap((created) => {
          this.workspaces.update(list => [created, ...list]);
          this.setActiveWorkspace(created);
        }),
      );
  }

  updateWorkspace(id: string, payload: WorkspaceUpdate): Observable<Workspace> {
    return this.http.patch<Workspace>(`${this.base}/workspaces/${id}`, payload, { headers: this.getHeaders() })
      .pipe(
        tap((updated) => {
          this.workspaces.update(list => list.map(w => w.id === id ? updated : w));
          if (this.activeWorkspace()?.id === id) {
            this.activeWorkspace.set(updated);
          }
        }),
      );
  }

  deleteWorkspace(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/workspaces/${id}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          this.workspaces.update(list => list.filter(w => w.id !== id));
          if (this.activeWorkspace()?.id === id) {
            this.activeWorkspace.set(null);
          }
        }),
      );
  }

  addMember(workspaceId: string, payload: WorkspaceMemberAdd): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(
      `${this.base}/workspaces/${workspaceId}/members`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  removeMember(workspaceId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/workspaces/${workspaceId}/members/${userId}`,
      { headers: this.getHeaders() }
    );
  }
}
