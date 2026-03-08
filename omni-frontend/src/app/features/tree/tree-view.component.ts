import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProjectTreeEditorComponent } from './components/project-tree-editor.component';
import { TreeNode } from './models/tree-node.model';

/**
 * Tree View Component
 * 
 * Main view for managing project trees.
 * Receives project information from RAMPS via route parameters.
 * 
 * Route format: /projects/:projectId/tree?projectName=NAME
 * - projectId: UUID of the project (required, in URL path)
 * - projectName: Name to prepopulate when creating projects (optional, in query params)
 */
@Component({
  selector: 'omni-tree-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    ProjectTreeEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tree-page">
      <!-- Tree editor card -->
      <mat-card class="tree-body-card" appearance="outlined">
        @if (selectedProjectId()) {
          <omni-project-tree-editor
            [projectId]="selectedProjectId()"
            [projectName]="projectNameFromRoute()"
            (nodeSelected)="onNodeSelected($event)">
          </omni-project-tree-editor>
        } @else {
          <div class="no-project-state">
            <mat-icon class="info-icon">account_tree</mat-icon>
            <h3>No Project Selected</h3>
            <p>Navigate to this page from RAMPS with a project ID in the URL path.</p>
            <p class="hint">Example URL format:</p>
            <p class="hint">/projects/550e8400-e29b-41d4-a716-446655440000/tree?projectName=My%20Project</p>
            <p>Or manually navigate to:</p>
            <p class="hint">http://localhost:4252/projects/YOUR-PROJECT-UUID/tree?projectName=Your%20Project</p>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .tree-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
    }

    .tree-body-card {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin: 0;
    }

    .tree-body-card ::ng-deep mat-card-content {
      flex: 1;
      overflow: hidden;
      padding: 0;
    }

    .no-project-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      height: 100%;
    }

    .info-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: rgba(124, 92, 191, 0.4);
    }

    .no-project-state h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 500;
    }

    .no-project-state p {
      color: rgba(0, 0, 0, 0.54);
      margin: 0 0 8px 0;
      max-width: 600px;
    }

    .no-project-state .hint {
      font-family: monospace;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.05);
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 16px;
    }
  `],
})
export class TreeViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  selectedProjectId = signal<string>('');
  selectedNode = signal<TreeNode | null>(null);
  projectNameFromRoute = signal<string>('');

  constructor() {
    // Track projectNameFromRoute signal changes
    effect(() => {
      const name = this.projectNameFromRoute();
      console.log('\\n=== TREE VIEW projectNameFromRoute SIGNAL CHANGED ===');
      console.log('New value:', name);
      console.log('Type:', typeof name);
      console.log('This will be passed as [projectName] input to child');
    });
  }

  ngOnInit(): void {
    // Read projectId from route params (path parameter)
    // Read projectName from query params (optional parameter from RAMPS)
    this.route.params.subscribe(params => {
      console.log('TreeView received route params:', params);
      console.log('Current URL:', window.location.href);
      
      if (params['projectId']) {
        this.selectedProjectId.set(params['projectId']);
        console.log('TreeView set projectId from route params:', params['projectId']);
      } else {
        console.log('TreeView: No projectId in route params');
      }
    });

    // Read optional projectName from query parameters
    this.route.queryParams.subscribe(params => {
      console.log('\\n=== TREE VIEW QUERY PARAMS ===');
      console.log('TreeView received query params:', params);
      console.log('Keys:', Object.keys(params));
      
      if (params['projectName']) {
        const name = params['projectName'];
        console.log('Found projectName in query params:');
        console.log('  - Value:', name);
        console.log('  - Type:', typeof name);
        console.log('  - Length:', name.length);
        
        this.projectNameFromRoute.set(name);
        
        console.log('\\nAfter setting signal:');
        console.log('  - Signal value:', this.projectNameFromRoute());
        console.log('  - Will pass to child component:', this.projectNameFromRoute());
      } else {
        console.log('\\u2717 No projectName in query params');
        console.log('Add \"?projectName=YourProjectName\" to the URL to prepopulate');
        console.log('Current signal value:', this.projectNameFromRoute());
      }
    });
  }

  onNodeSelected(node: TreeNode): void {
    this.selectedNode.set(node);
  }
}

