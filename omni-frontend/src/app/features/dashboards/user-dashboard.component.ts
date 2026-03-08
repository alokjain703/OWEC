import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { WorkspaceWithProjects, ProjectCacheDto } from '../../core/services/workspace.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>My Projects</h1>
        <p class="subtitle">Select a project to start working</p>
        <button mat-raised-button color="primary" (click)="refreshWorkspaces()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      @if (workspaceState.isLoading()) {
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
          <p>Loading your projects...</p>
        </div>
      } @else if (workspaceState.error()) {
        <div class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ workspaceState.error() }}</p>
          <button mat-raised-button (click)="refreshWorkspaces()">Retry</button>
        </div>
      } @else if (!workspaceState.hasWorkspaces()) {
        <div class="empty-state">
          <mat-icon>work_outline</mat-icon>
          <h2>No Projects Available</h2>
          <p>You don't have access to any projects yet.</p>
          <p class="help-text">Contact your administrator to get access to projects.</p>
          <button mat-raised-button color="primary" (click)="refreshWorkspaces()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      } @else {
        <!-- Current Selection -->
        @if (workspaceState.currentProject()) {
          <mat-card class="current-selection-card">
            <mat-card-header>
              <mat-icon class="header-icon">check_circle</mat-icon>
              <mat-card-title>Currently Active</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="current-project">
                <div class="project-info">
                  <h3>{{ workspaceState.currentProject()!.name }}</h3>
                  <p>{{ workspaceState.currentWorkspace()?.name }}</p>
                </div>
                <button mat-raised-button color="primary" (click)="openCurrentProject()">
                  <mat-icon>open_in_new</mat-icon>
                  Open Project
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- All Projects -->
        <div class="projects-section">
          <h2>All Projects</h2>
          <div class="projects-list">
            @for (workspace of workspaceState.workspaces(); track workspace.id) {
              @for (project of workspace.projects; track project.id) {
                <mat-card 
                  class="project-card"
                  [class.active]="isCurrentProject(project.id)"
                  (click)="selectProject(workspace, project)">
                  <mat-card-content>
                    <div class="project-header">
                      <mat-icon class="project-icon">description</mat-icon>
                      <div class="project-details">
                        <h3>{{ project.name }}</h3>
                        <p class="workspace-name">
                          <mat-icon>business</mat-icon>
                          {{ workspace.name }}
                        </p>
                      </div>
                      @if (isCurrentProject(project.id)) {
                        <mat-chip class="active-chip">
                          <mat-icon>check</mat-icon>
                          Active
                        </mat-chip>
                      }
                    </div>
                    
                    @if (project.description) {
                      <p class="project-description">{{ project.description }}</p>
                    }
                    
                    <div class="project-meta">
                      @if (project.project_type) {
                        <mat-chip>{{ project.project_type }}</mat-chip>
                      }
                      <span class="updated-date">
                        Updated {{ formatDate(project.updated_at) }}
                      </span>
                    </div>
                  </mat-card-content>
                  
                  <mat-card-actions>
                    <button mat-button color="primary">
                      <mat-icon>arrow_forward</mat-icon>
                      Open
                    </button>
                  </mat-card-actions>
                </mat-card>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1000px;
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
      
      .help-text {
        color: var(--text-secondary);
        margin-top: 8px;
      }
    }

    .current-selection-card {
      margin-bottom: 32px;
      background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
      
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .header-icon {
          color: var(--success-500);
        }
      }
      
      .current-project {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .project-info {
          h3 {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 600;
          }
          
          p {
            margin: 0;
            color: var(--text-secondary);
          }
        }
      }
    }

    .projects-section {
      h2 {
        margin: 0 0 24px 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .project-card {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      &.active {
        border: 2px solid var(--primary-500);
        background-color: var(--primary-50);
      }
      
      .project-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 12px;
        
        .project-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: var(--primary-500);
          flex-shrink: 0;
        }
        
        .project-details {
          flex: 1;
          min-width: 0;
          
          h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          .workspace-name {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--text-secondary);
            font-size: 14px;
            
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }
        
        .active-chip {
          background-color: var(--success-500);
          color: white;
          
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
      
      .project-description {
        margin: 0 0 12px 48px;
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .project-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: 48px;
        
        .updated-date {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px;
    }
  `]
})
export class UserDashboardComponent implements OnInit {
  constructor(
    public workspaceState: WorkspaceStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('[UserDashboard] ngOnInit() called');
    // Only load if not already loaded or loading
    if (this.workspaceState.workspaces().length === 0 && !this.workspaceState.isLoading()) {
      console.log('[UserDashboard] Loading workspaces...');
      this.workspaceState.loadWorkspaces().then(() => {
        this.workspaceState.restorePendingSelection();
      });
    } else {
      console.log('[UserDashboard] Workspaces already available or loading');
      this.workspaceState.restorePendingSelection();
    }
  }

  async refreshWorkspaces(): Promise<void> {
    try {
      await this.workspaceState.loadWorkspaces(true);
      this.snackBar.open('Projects refreshed successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to refresh projects', 'Close', { duration: 5000 });
    }
  }

  selectProject(workspace: WorkspaceWithProjects, project: ProjectCacheDto): void {
    this.workspaceState.setCurrentWorkspace(workspace);
    this.workspaceState.setCurrentProject(project);
    this.router.navigate(['/projects', project.id, 'tree']);
  }

  openCurrentProject(): void {
    const project = this.workspaceState.currentProject();
    if (project) {
      this.router.navigate(['/projects', project.id, 'tree']);
    }
  }

  isCurrentProject(projectId: string): boolean {
    const current = this.workspaceState.currentProject();
    return current?.id === projectId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }
}
