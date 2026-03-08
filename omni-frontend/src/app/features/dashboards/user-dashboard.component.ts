import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { WorkspaceWithProjects, ProjectCacheDto } from '../../core/services/workspace.service';

type ViewMode = 'table' | 'tree';

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
    MatChipsModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-title">
          <h1>My Projects</h1>
          <p class="subtitle">Select a project to start working</p>
        </div>
        <div class="header-actions">
          <mat-button-toggle-group [(value)]="viewMode" aria-label="View mode">
            <mat-button-toggle value="tree">
              <mat-icon>account_tree</mat-icon>
              Tree
            </mat-button-toggle>
            <mat-button-toggle value="table">
              <mat-icon>view_list</mat-icon>
              Table
            </mat-button-toggle>
          </mat-button-toggle-group>
          <button mat-raised-button color="primary" (click)="refreshWorkspaces()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
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
          
          <!-- Table View -->
          @if (viewMode() === 'table') {
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
          }
          
          <!-- Tree View -->
          @if (viewMode() === 'tree') {
            <div class="tree-view">
              <mat-card>
                <mat-card-content>
                  <div class="tree-container">
                    @for (workspace of workspaceState.workspaces(); track workspace.id) {
                      <div class="tree-workspace">
                        <div class="tree-node workspace-node">
                          <mat-icon class="expand-icon">business</mat-icon>
                          <span class="node-label">{{ workspace.name }}</span>
                          <span class="node-badge">{{ workspace.projects.length }} projects</span>
                        </div>
                        
                        @if (workspace.projects.length > 0) {
                          <div class="tree-children">
                            @for (project of workspace.projects; track project.id; let isLast = $last) {
                              <div class="tree-project" [class.last-child]="isLast">
                                <div class="tree-line"></div>
                                <button 
                                  class="tree-node project-node"
                                  mat-button
                                  (click)="selectProject(workspace, project)"
                                  [class.selected]="isCurrentProject(project.id)">
                                  <mat-icon class="project-icon">description</mat-icon>
                                  <span class="node-label">{{ project.name }}</span>
                                  @if (isCurrentProject(project.id)) {
                                    <mat-chip class="active-chip">
                                      <mat-icon>check</mat-icon>
                                      Active
                                    </mat-chip>
                                  }
                                </button>
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="tree-children">
                            <div class="tree-empty">
                              <mat-icon>info</mat-icon>
                              <span>No projects in this workspace</span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          }
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
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      
      .header-title {
        flex: 1;
        
        h1 {
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }
        
        .subtitle {
          margin: 0;
          color: var(--text-secondary);
        }
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
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
    
    /* Tree View Styles */
    .tree-view {
      mat-card {
        padding: 0;
      }
    }
    
    .tree-container {
      padding: 16px;
    }
    
    .tree-workspace {
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .tree-node {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 4px;
      
      &.workspace-node {
        background-color: var(--primary-100, #e3f2fd);
        border: 2px solid var(--primary-300, #90caf9);
        font-weight: 500;
        font-size: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        
        .expand-icon {
          color: var(--primary-600, #1976d2);
        }
      }
      
      &.project-node {
        width: 100%;
        justify-content: flex-start;
        text-align: left;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: var(--surface-variant, #f5f5f5);
        }
        
        &.selected {
          background-color: var(--primary-50);
          border: 2px solid var(--primary-500);
        }
        
        .project-icon {
          color: var(--primary-500);
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
        
        .active-chip {
          margin-left: auto;
          background-color: var(--success-500);
          color: white;
          
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
      
      .node-label {
        flex: 1;
      }
      
      .node-badge {
        font-size: 12px;
        color: var(--text-secondary);
        background-color: var(--background, white);
        padding: 4px 8px;
        border-radius: 12px;
      }
    }
    
    .tree-children {
      margin-left: 32px;
      margin-top: 8px;
      position: relative;
    }
    
    .tree-project {
      position: relative;
      margin-bottom: 4px;
      
      .tree-line {
        position: absolute;
        left: -20px;
        top: 0;
        bottom: 50%;
        width: 20px;
        border-left: 2px solid var(--divider, #e0e0e0);
        border-bottom: 2px solid var(--divider, #e0e0e0);
        border-bottom-left-radius: 8px;
      }
      
      &.last-child .tree-line {
        bottom: 50%;
      }
    }
    
    .tree-empty {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: var(--text-secondary);
      font-style: italic;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class UserDashboardComponent implements OnInit {
  viewMode = signal<ViewMode>('tree');
  
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
    this.router.navigate(['/projects', project.id, 'tree'], { 
      queryParams: { projectName: project.name } 
    });
  }

  openCurrentProject(): void {
    const project = this.workspaceState.currentProject();
    if (project) {
      this.router.navigate(['/projects', project.id, 'tree'], { 
        queryParams: { projectName: project.name } 
      });
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
