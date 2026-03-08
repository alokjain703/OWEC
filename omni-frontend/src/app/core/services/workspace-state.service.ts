import { Injectable, signal, computed, effect } from '@angular/core';
import { WorkspaceWithProjects, ProjectCacheDto, WorkspaceService } from './workspace.service';
import { firstValueFrom } from 'rxjs';

export interface CurrentSelection {
  workspace: WorkspaceWithProjects | null;
  project: ProjectCacheDto | null;
}

/**
 * State management service for workspace and project selection
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceStateService {
  // Signals for reactive state
  private readonly _workspaces = signal<WorkspaceWithProjects[]>([]);
  private readonly _currentWorkspace = signal<WorkspaceWithProjects | null>(null);
  private readonly _currentProject = signal<ProjectCacheDto | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public read-only signals
  readonly workspaces = this._workspaces.asReadonly();
  readonly currentWorkspace = this._currentWorkspace.asReadonly();
  readonly currentProject = this._currentProject.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasWorkspaces = computed(() => this._workspaces().length > 0);
  readonly currentSelection = computed<CurrentSelection>(() => ({
    workspace: this._currentWorkspace(),
    project: this._currentProject()
  }));

  constructor(private workspaceService: WorkspaceService) {
    // Load from localStorage on init
    this.loadFromLocalStorage();

    // Save to localStorage on changes
    effect(() => {
      const workspace = this._currentWorkspace();
      const project = this._currentProject();
      this.saveToLocalStorage(workspace, project);
    });
  }

  /**
   * Load and sync workspaces from backend
   */
  async loadWorkspaces(forceSync: boolean = false): Promise<void> {
    console.log('[WorkspaceState] loadWorkspaces() called, forceSync:', forceSync);
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Sync from RAMPS if needed
      if (forceSync) {
        console.log('[WorkspaceState] Syncing from RAMPS...');
        await firstValueFrom(this.workspaceService.syncWorkspaces(true));
      }

      // Load cached workspaces
      console.log('[WorkspaceState] Fetching workspaces from backend...');
      const workspaces = await firstValueFrom(this.workspaceService.getUserWorkspaces());
      console.log('[WorkspaceState] Received', workspaces.length, 'workspaces');
      console.log('[WorkspaceState] Raw workspaces data:', JSON.stringify(workspaces, null, 2));
      
      try {
        // Log workspace details including projects
        console.log('[WorkspaceState] Starting to iterate workspaces...');
        for (let idx = 0; idx < workspaces.length; idx++) {
          const ws = workspaces[idx];
          console.log(`[WorkspaceState] Workspace ${idx + 1}:`, ws);
          console.log(`[WorkspaceState]   - Name: "${ws.name}"`);
          console.log(`[WorkspaceState]   - ID: ${ws.id}`);
          console.log(`[WorkspaceState]   - Projects property exists:`, 'projects' in ws);
          console.log(`[WorkspaceState]   - Projects value:`, ws.projects);
          console.log(`[WorkspaceState]   - Projects count: ${ws.projects?.length || 0}`);
          
          if (ws.projects && ws.projects.length > 0) {
            for (let projIdx = 0; projIdx < ws.projects.length; projIdx++) {
              const proj = ws.projects[projIdx];
              console.log(`[WorkspaceState]     Project ${projIdx + 1}: "${proj.name}" (ID: ${proj.id})`);
            }
          } else {
            console.log(`[WorkspaceState]     No projects in this workspace`);
          }
        }
        console.log('[WorkspaceState] Finished iterating workspaces');
      } catch (err) {
        console.error('[WorkspaceState] Error while logging workspace details:', err);
      }
      
      this._workspaces.set(workspaces);

      // If no current workspace selected but we have workspaces, select the first one
      if (!this._currentWorkspace() && workspaces.length > 0) {
        this.setCurrentWorkspace(workspaces[0]);
      } else if (this._currentWorkspace()) {
        // Update current workspace if it exists in the new list
        const currentId = this._currentWorkspace()!.id;
        const updated = workspaces.find(w => w.id === currentId);
        if (updated) {
          this._currentWorkspace.set(updated);
        }
      }
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      this._error.set(error.message || 'Failed to load workspaces');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Set the current workspace
   */
  setCurrentWorkspace(workspace: WorkspaceWithProjects | null): void {
    this._currentWorkspace.set(workspace);
    
    // Clear current project when workspace changes
    if (this._currentProject() && workspace) {
      const currentProjectId = this._currentProject()!.id;
      const projectExists = workspace.projects.some(p => p.id === currentProjectId);
      if (!projectExists) {
        this._currentProject.set(null);
      }
    } else {
      this._currentProject.set(null);
    }
  }

  /**
   * Set the current project
   */
  setCurrentProject(project: ProjectCacheDto | null): void {
    this._currentProject.set(project);
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    this._currentWorkspace.set(null);
    this._currentProject.set(null);
  }

  /**
   * Save selection to localStorage
   */
  private saveToLocalStorage(
    workspace: WorkspaceWithProjects | null,
    project: ProjectCacheDto | null
  ): void {
    try {
      if (workspace) {
        localStorage.setItem('currentWorkspaceId', workspace.id);
      } else {
        localStorage.removeItem('currentWorkspaceId');
      }

      if (project) {
        localStorage.setItem('currentProjectId', project.id);
      } else {
        localStorage.removeItem('currentProjectId');
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Load selection from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      const projectId = localStorage.getItem('currentProjectId');

      // These will be properly set when workspaces are loaded
      // Just store the IDs for now
      if (workspaceId) {
        (this as any)._pendingWorkspaceId = workspaceId;
      }
      if (projectId) {
        (this as any)._pendingProjectId = projectId;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  /**
   * Restore workspace/project from pending IDs after workspaces are loaded
   */
  restorePendingSelection(): void {
    const pendingWorkspaceId = (this as any)._pendingWorkspaceId;
    const pendingProjectId = (this as any)._pendingProjectId;

    if (pendingWorkspaceId) {
      const workspace = this._workspaces().find(w => w.id === pendingWorkspaceId);
      if (workspace) {
        this._currentWorkspace.set(workspace);

        if (pendingProjectId) {
          const project = workspace.projects.find(p => p.id === pendingProjectId);
          if (project) {
            this._currentProject.set(project);
          }
        }
      }

      delete (this as any)._pendingWorkspaceId;
      delete (this as any)._pendingProjectId;
    }
  }
}
