import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WorkspaceService } from './core/services/workspace.service';
import { Workspace } from './core/models/workspace.model';
import { WorkspaceDialogComponent } from './workspace-dialog.component';

@Component({
  selector: 'omni-workspace-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    @if (workspaceSvc.loading()) {
      <mat-spinner diameter="24"></mat-spinner>
    } @else {
      <button mat-button [matMenuTriggerFor]="workspaceMenu" class="workspace-selector">
        <mat-icon>business</mat-icon>
        <span class="workspace-name">
          {{ workspaceSvc.activeWorkspace()?.name || 'Select Workspace' }}
        </span>
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #workspaceMenu="matMenu">
        @for (ws of workspaceSvc.workspaces(); track ws.id) {
          <button 
            mat-menu-item 
            (click)="selectWorkspace(ws)"
            [class.active]="ws.id === workspaceSvc.activeWorkspace()?.id"
          >
            <span class="menu-item-content">
              <span>{{ ws.name }}</span>
              @if (ws.id === workspaceSvc.activeWorkspace()?.id) {
                <mat-icon class="check-icon">check</mat-icon>
              }
            </span>
          </button>
        }
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          <span>New Workspace</span>
        </button>
      </mat-menu>
    }
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
    }

    .workspace-selector {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .workspace-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-item-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .check-icon {
      margin-left: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .active {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `],
})
export class WorkspaceSelectorComponent implements OnInit {
  workspaceSvc = inject(WorkspaceService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.workspaceSvc.loadWorkspaces();
  }

  selectWorkspace(workspace: Workspace): void {
    this.workspaceSvc.setActiveWorkspace(workspace);
  }

  openCreateDialog(): void {
    this.dialog.open(WorkspaceDialogComponent, {
      width: '500px',
      data: { mode: 'create' },
    });
  }
}
