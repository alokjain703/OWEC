import { Component, OnInit, signal } from '@angular/core';
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
  selector: 'app-manager-dashboard',
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
          <h1>Manager Dashboard</h1>
          <p class="subtitle">Oversee your team's workspaces and projects</p>
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
                                <mat-icon class="project-icon">folder</mat-icon>
                                <span class="node-label">{{ project.name }}</span>
                                @if (project.description) {
                                  <span class="node-description">{{ project.description }}</span>
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
      max-width: 1200px;
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
          color: var(--primary-500);
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
      
      .node-description {
        font-size: 12px;
        color: var(--text-secondary);
        margin-left: auto;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
export class ManagerDashboardComponent implements OnInit {
  viewMode = signal<ViewMode>('tree');
  
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
    console.log(`[ManagerDashboard] Selected project: ${project.name} (ID: ${project.id}) in workspace: ${workspace.name}`);
    this.router.navigate(['/projects', project.id, 'tree'], { 
      queryParams: { projectName: project.name } 
    });
  }

  isCurrentProject(projectId: string): boolean {
    const current = this.workspaceState.currentProject();
    return current?.id === projectId;
  }
}
