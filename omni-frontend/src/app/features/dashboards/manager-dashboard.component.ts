import { Component, OnInit } from '@angular/core';
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
  selector: 'app-manager-dashboard',
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
        <h1>Manager Dashboard</h1>
        <p class="subtitle">Oversee your team's workspaces and projects</p>
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
        <div class="workspaces-list">
          @for (workspace of workspaceState.workspaces(); track workspace.id) {
            <mat-card class="workspace-card">
              <mat-card-header>
                <div class="workspace-icon">
                  <mat-icon>business</mat-icon>
                </div>
                <mat-card-title>{{ workspace.name }}</mat-card-title>
                <mat-card-subtitle>
                  {{ workspace.projects.length }} project{{ workspace.projects.length !== 1 ? 's' : '' }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (workspace.description) {
                  <p class="workspace-description">{{ workspace.description }}</p>
                }
                
                <div class="projects-section">
                  <h3>Projects</h3>
                  @if (workspace.projects.length === 0) {
                    <p class="no-projects">No projects in this workspace</p>
                  } @else {
                    <div class="projects-grid">
                      @for (project of workspace.projects; track project.id) {
                        <button 
                          mat-raised-button 
                          class="project-card"
                          (click)="selectProject(workspace, project)"
                          [class.selected]="isCurrentProject(project.id)">
                          <mat-icon class="project-icon">folder</mat-icon>
                          <div class="project-details">
                            <span class="project-name">{{ project.name }}</span>
                            @if (project.description) {
                              <span class="project-description">{{ project.description }}</span>
                            }
                          </div>
                          <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                        </button>
                      }
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
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

    .workspaces-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .workspace-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .workspace-icon {
          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: var(--primary-500);
          }
        }
      }
      
      .workspace-description {
        margin-bottom: 24px;
        color: var(--text-secondary);
      }
      
      .projects-section {
        h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .no-projects {
          color: var(--text-secondary);
          text-align: center;
          padding: 24px;
        }
      }
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .project-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      text-align: left;
      transition: all 0.2s;
      
      &.selected {
        background-color: var(--primary-50);
        border: 2px solid var(--primary-500);
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .project-icon {
        color: var(--primary-500);
      }
      
      .project-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        
        .project-name {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .project-description {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      
      .arrow-icon {
        flex-shrink: 0;
      }
    }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  constructor(
    public workspaceState: WorkspaceStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('[ManagerDashboard] ngOnInit() called');
    // Only load if not already loaded or loading
    if (this.workspaceState.workspaces().length === 0 && !this.workspaceState.isLoading()) {
      console.log('[ManagerDashboard] Loading workspaces...');
      this.workspaceState.loadWorkspaces().then(() => {
        this.workspaceState.restorePendingSelection();
      });
    } else {
      console.log('[ManagerDashboard] Workspaces already available or loading');
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
    this.router.navigate(['/projects', project.id, 'tree']);
  }

  isCurrentProject(projectId: string): boolean {
    const current = this.workspaceState.currentProject();
    return current?.id === projectId;
  }
}
