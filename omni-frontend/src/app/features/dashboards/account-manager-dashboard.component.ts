import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { WorkspaceWithProjects, ProjectCacheDto } from '../../core/services/workspace.service';

type ViewMode = 'table' | 'tree';

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
    MatSnackBarModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-title">
          <h1>Account Manager Dashboard</h1>
          <p class="subtitle">Manage all workspaces and projects across the organization</p>
        </div>
        <div class="header-actions">
          <mat-button-toggle-group [(value)]="viewMode" aria-label="View mode">
            <mat-button-toggle value="table">
              <mat-icon>view_list</mat-icon>
              Table
            </mat-button-toggle>
            <mat-button-toggle value="tree">
              <mat-icon>account_tree</mat-icon>
              Tree
            </mat-button-toggle>
          </mat-button-toggle-group>
          <button mat-raised-button color="primary" (click)="refreshWorkspaces()">
            <mat-icon>refresh</mat-icon>
            Sync from RAMPS
          </button>
        </div>
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
        <!-- Table View -->
        @if (viewMode() === 'table') {
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
                                @if (project.project_type) {
                                  <span class="node-type">{{ project.project_type }}</span>
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
          border: 1px solid var(--primary-500);
        }
        
        .project-icon {
          color: var(--text-secondary);
          font-size: 20px;
          width: 20px;
          height: 20px;
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
      
      .node-type {
        font-size: 12px;
        color: var(--text-secondary);
        padding: 2px 8px;
        background-color: var(--surface-variant, #f5f5f5);
        border-radius: 4px;
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
export class AccountManagerDashboardComponent implements OnInit {
  viewMode = signal<ViewMode>('table');
  
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
