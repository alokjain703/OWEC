import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { WorkspaceWithProjects, ProjectCacheDto } from '../../core/services/workspace.service';

@Component({
  selector: 'app-account-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Account Manager Dashboard</h1>
        <p class="subtitle">Manage all workspaces and projects across the organization</p>
        <button mat-raised-button color="primary" (click)="refreshWorkspaces()">
          <mat-icon>refresh</mat-icon>
          Sync from RAMPS
        </button>
      </div>

      @if (workspaceState.isLoading()) {
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
          <p>Loading workspaces...</p>
        </div>
      } @else if (workspaceState.error()) {
        <div class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ workspaceState.error() }}</p>
          <button mat-raised-button (click)="refreshWorkspaces()">Retry</button>
        </div>
      } @else if (!workspaceState.hasWorkspaces()) {
        <div class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <h2>No Workspaces Found</h2>
          <p>You don't have access to any workspaces yet.</p>
          <button mat-raised-button color="primary" (click)="refreshWorkspaces()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      } @else {
        <div class="workspaces-grid">
          @for (workspace of workspaceState.workspaces(); track workspace.id) {
            <mat-card class="workspace-card">
              <mat-card-header>
                <mat-card-title>{{ workspace.name }}</mat-card-title>
                <mat-card-subtitle>
                  {{ workspace.workspace_type || 'Workspace' }} • {{ workspace.projects.length }} projects
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (workspace.description) {
                  <p class="workspace-description">{{ workspace.description }}</p>
                }
                
                <mat-expansion-panel class="projects-expansion">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      Projects ({{ workspace.projects.length }})
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  @if (workspace.projects.length === 0) {
                    <p class="no-projects">No projects in this workspace</p>
                  } @else {
                    <div class="projects-list">
                      @for (project of workspace.projects; track project.id) {
                        <button 
                          mat-stroked-button 
                          class="project-item"
                          (click)="selectProject(workspace, project)"
                          [class.selected]="isCurrentProject(project.id)">
                          <div class="project-info">
                            <span class="project-name">{{ project.name }}</span>
                            @if (project.project_type) {
                              <span class="project-type">{{ project.project_type }}</span>
                            }
                          </div>
                          <mat-icon>arrow_forward</mat-icon>
                        </button>
                      }
                    </div>
                  }
                </mat-expansion-panel>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-button (click)="viewWorkspaceDetails(workspace)">
                  <mat-icon>info</mat-icon>
                  Details
                </button>
                <button mat-button (click)="manageWorkspace(workspace)">
                  <mat-icon>settings</mat-icon>
                  Manage
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
      
      h1 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }
      
      .subtitle {
        margin: 0 0 16px 0;
        color: var(--text-secondary);
      }
    }

    .loading-container,
    .error-container,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
    }

    .workspaces-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .workspace-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      mat-card-content {
        flex: 1;
      }
      
      .workspace-description {
        margin-bottom: 16px;
        color: var(--text-secondary);
      }
    }

    .projects-expansion {
      margin-top: 16px;
      box-shadow: none !important;
      
      .no-projects {
        color: var(--text-secondary);
        text-align: center;
        padding: 16px;
      }
    }

    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }

    .project-item {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      padding: 12px 16px;
      
      &.selected {
        background-color: var(--primary-50);
        border-color: var(--primary-500);
      }
      
      .project-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        .project-name {
          font-weight: 500;
        }
        
        .project-type {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }

    mat-card-actions {
      display: flex;
      gap: 8px;
      padding: 16px;
    }
  `]
})
export class AccountManagerDashboardComponent implements OnInit {
  constructor(
    public workspaceState: WorkspaceStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('[AccountManagerDashboard] ngOnInit() called');
    // Only load if not already loaded or loading
    if (this.workspaceState.workspaces().length === 0 && !this.workspaceState.isLoading()) {
      console.log('[AccountManagerDashboard] Loading workspaces...');
      this.workspaceState.loadWorkspaces().then(() => {
        this.workspaceState.restorePendingSelection();
      });
    } else {
      console.log('[AccountManagerDashboard] Workspaces already available or loading');
      this.workspaceState.restorePendingSelection();
    }
  }

  async refreshWorkspaces(): Promise<void> {
    try {
      await this.workspaceState.loadWorkspaces(true);
      this.snackBar.open('Workspaces synced successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to sync workspaces', 'Close', { duration: 5000 });
    }
  }

  selectProject(workspace: WorkspaceWithProjects, project: ProjectCacheDto): void {
    this.workspaceState.setCurrentWorkspace(workspace);
    this.workspaceState.setCurrentProject(project);
    
    // Navigate to project tree
    this.router.navigate(['/projects', project.id, 'tree']);
  }

  isCurrentProject(projectId: string): boolean {
    const current = this.workspaceState.currentProject();
    return current?.id === projectId;
  }

  viewWorkspaceDetails(workspace: WorkspaceWithProjects): void {
    // TODO: Implement workspace details view
    this.snackBar.open(`Viewing details for ${workspace.name}`, 'Close', { duration: 2000 });
  }

  manageWorkspace(workspace: WorkspaceWithProjects): void {
    // TODO: Redirect to RAMPS for workspace management
    this.snackBar.open(`Workspace management must be done in RAMPS`, 'OK', { duration: 3000 });
  }
}
