import {
  Component,
  OnInit,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { OmniApiService } from '../../../core/services/omni-api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { SchemaLoaderService, SchemaOption } from '../services/schema-loader.service';
import { TreeEditorComponent } from './tree-editor.component';
import { NodeInspectorComponent } from './node-inspector.component';
import { NodeContentEditorComponent } from './node-content-editor.component';
import {
  TreeNode,
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeRenamedEvent,
} from '../models/tree-node.model';

interface Project {
  id: string;
  owner_id: string;
  title: string;
  active_schema_id?: string;
  schema_version_id?: string;
  created_at: string;
  updated_at: string;
}

interface BackendNode {
  id: string;
  project_id: string;
  parent_id?: string;
  depth: number;
  order_index: number;
  node_role: string;
  title?: string;
  content?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  children?: BackendNode[];
}

interface Schema {
  id: string;
  name: string;
  version: number;
  definition: Record<string, unknown>;
}

/**
 * Project Tree Editor Component
 * 
 * Wraps the generic TreeEditorComponent with project-specific logic.
 * Handles loading project data, CRUD operations on nodes, and project creation.
 * 
 * Usage:
 * ```
 * <omni-project-tree-editor 
 *   [projectId]="projectId"
 *   [projectName]="projectName">
 * </omni-project-tree-editor>
 * ```
 * 
 * @Input projectId - UUID of the project to load
 * @Input projectName - Optional project name to prepopulate when creating a new project
 */
@Component({
  selector: 'omni-project-tree-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    MatSnackBarModule,
    MatSidenavModule,
    TreeEditorComponent,
    NodeInspectorComponent,
    NodeContentEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="project-tree-editor">
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading project...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Error Loading Project</h3>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="retry()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      } @else if (!project()) {
        <div class="no-project-state">
          <mat-icon class="info-icon">info</mat-icon>
          <h3>No Project Found</h3>
          <p>This project does not exist yet.</p>
          <button mat-raised-button color="primary" (click)="openCreateProjectDialog()">
            <mat-icon>add</mat-icon>
            Create Project
          </button>
        </div>
      } @else {
        <!-- Three-Panel Layout -->
        <mat-sidenav-container class="editor-container">
          
          <!-- LEFT PANEL - Tree Editor -->
          <mat-sidenav mode="side" opened class="tree-panel">
            <div class="panel-header">
              <h3>
                <mat-icon>account_tree</mat-icon>
                {{ project()!.title }}
              </h3>
              <button mat-icon-button [matMenuTriggerFor]="projectMenu" matTooltip="Project actions">
                <mat-icon>more_vert</mat-icon>
              </button>
            </div>

            @if (treeNodes().length === 0) {
              <!-- Schema selection for empty project -->
              <div class="schema-selection">
                <mat-icon class="schema-icon">account_tree</mat-icon>
                <h4>Initialize Project</h4>
                <p>Choose a schema template to get started.</p>
                
                @if (loadingSchemas()) {
                  <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                } @else if (initializingWithSchema()) {
                  <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
                  <p>Initializing project...</p>
                } @else if (availableSchemas().length > 0) {
                  <div class="schema-list">
                    @for (schema of availableSchemas(); track schema.id) {
                      <button mat-raised-button class="schema-option" (click)="initializeWithSchema(schema)">
                        <mat-icon>folder_special</mat-icon>
                        <div class="schema-info">
                          <span class="schema-name">{{ schema.name }}</span>
                          <span class="schema-version">v{{ schema.version }}</span>
                        </div>
                      </button>
                    }
                  </div>
                  <button mat-button (click)="loadSchemas()">
                    <mat-icon>refresh</mat-icon>
                    Refresh
                  </button>
                } @else {
                  <button mat-raised-button color="primary" (click)="loadSchemas()">
                    <mat-icon>refresh</mat-icon>
                    Load Schemas
                  </button>
                }
              </div>
            } @else {
              <omni-tree-editor
                [nodes]="treeNodes()"
                (nodeSelected)="handleNodeSelected($event)"
                (nodeCreated)="handleNodeCreated($event)"
                (nodeDeleted)="handleNodeDeleted($event)"
                (nodeRenamed)="handleNodeRenamed($event)">
              </omni-tree-editor>
            }
          </mat-sidenav>

          <!-- CENTER PANEL - Content Editor -->
          <div class="content-panel">
            <omni-node-content-editor
              [node]="selectedNode()">
            </omni-node-content-editor>
          </div>

          <!-- RIGHT PANEL - Inspector -->
          <mat-sidenav
            position="end"
            mode="side"
            opened
            class="inspector-panel">
            <omni-node-inspector
              [node]="selectedNode()"
              (nodeSaved)="handleNodeSaved()"
              (nodeDeleted)="handleInspectorNodeDeleted()"
              (childNodeRequested)="handleChildNodeRequested($event)">
            </omni-node-inspector>
          </mat-sidenav>

        </mat-sidenav-container>
      }
    </div>

    <mat-menu #projectMenu="matMenu">
      <button mat-menu-item (click)="refreshProject()">
        <mat-icon>refresh</mat-icon>
        <span>Refresh</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .project-tree-editor {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .loading-state,
    .error-state,
    .no-project-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      height: 100%;
    }

    .loading-state p,
    .error-state p,
    .no-project-state p {
      color: rgba(0, 0, 0, 0.54);
      margin: 16px 0;
    }

    .error-icon,
    .info-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .error-icon {
      color: #f44336;
    }

    .info-icon {
      color: #2196f3;
      opacity: 0.7;
    }

    .error-state h3,
    .no-project-state h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 500;
    }

    /* Three-Panel Layout */
    .editor-container {
      height: 100%;
      flex: 1;
    }

    .tree-panel {
      width: 300px;
      border-right: 1px solid rgba(0, 0, 0, 0.12);
    }

    .inspector-panel {
      width: 350px;
      border-left: 1px solid rgba(0, 0, 0, 0.12);
    }

    .content-panel {
      height: 100%;
      background: #fafafa;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      background: var(--omni-surface, white);
    }

    .panel-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .panel-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Schema Selection (in tree panel) */
    .schema-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      text-align: center;
    }

    .schema-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--primary-500);
      margin-bottom: 12px;
      opacity: 0.7;
    }

    .schema-selection h4 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .schema-selection p {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .schema-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-bottom: 12px;
    }

    .schema-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      text-align: left;
      width: 100%;
      transition: all 0.2s;
    }

    .schema-option:hover {
      transform: translateX(4px);
    }

    .schema-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .schema-name {
      font-weight: 500;
      font-size: 13px;
    }

    .schema-version {
      font-size: 11px;
      color: var(--text-secondary);
    }
  `],
})
export class ProjectTreeEditorComponent implements OnInit {
  private api = inject(OmniApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authState = inject(AuthStateService);
  private schemaLoader = inject(SchemaLoaderService);

  // Inputs
  projectId = input.required<string>();
  projectName = input<string>(''); // Optional project name from RAMPS dashboard

  // Outputs
  nodeSelected = output<TreeNode>();

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  project = signal<Project | null>(null);
  treeNodes = signal<TreeNode[]>([]);
  backendNodes = signal<BackendNode[]>([]);
  selectedNode = signal<TreeNode | null>(null);
  
  // Schema initialization state
  availableSchemas = signal<SchemaOption[]>([]);
  loadingSchemas = signal(false);
  initializingWithSchema = signal(false);

  constructor() {
    // Watch for projectId changes and reload project
    effect(() => {
      const id = this.projectId();
      if (id) {
        // Use untracked to avoid additional tracking in async operation
        queueMicrotask(() => this.loadProject());
      }
    }, { allowSignalWrites: true });

    // Debug: Log projectName changes
    effect(() => {
      const name = this.projectName();
      console.log('ProjectTreeEditor projectName effect triggered:');
      console.log('  - Current projectName value:', name);
      console.log('  - Type:', typeof name);
      console.log('  - Is truthy?', !!name);
      console.log('  - Length:', name?.length);
    });
  }

  ngOnInit(): void {
    // loadProject is now called by the effect when projectId is set
  }

  async loadProject(): Promise<void> {
    console.log('loadProject called - projectName at this point:', this.projectName());
    this.loading.set(true);
    this.error.set(null);

    try {
      // Try to load project
      const project = await this.api.getProject(this.projectId()).toPromise() as Project;
      
      if (project) {
        console.log('Project loaded successfully, projectName value:', this.projectName());
        this.project.set(project);
        await this.loadNodes();
      } else {
        console.log('No project found, projectName value:', this.projectName());
        this.project.set(null);
      }
    } catch (err: any) {
      if (err.status === 404) {
        // Project not found
        this.project.set(null);
      } else {
        this.error.set(err.error?.detail || 'Failed to load project');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async loadNodes(): Promise<void> {
    try {
      const nodes = await this.api.getProjectNodes(this.projectId()).toPromise() as BackendNode[];
      this.backendNodes.set(nodes || []);
      this.treeNodes.set(this.convertToTreeNodes(nodes || []));
      
      // If project has no nodes, load available schemas
      if (nodes && nodes.length === 0) {
        await this.loadSchemas();
      }
    } catch (err: any) {
      console.error('Failed to load nodes:', err);
      this.snackBar.open('Failed to load project nodes', 'Close', { duration: 3000 });
    }
  }

  // ─── Schema Initialization ──────────────────────────────────────────────────

  async loadSchemas(): Promise<void> {
    this.loadingSchemas.set(true);
    try {
      const schemas = await this.schemaLoader.listSchemas();
      this.availableSchemas.set(schemas);
    } catch (err: any) {
      console.error('Failed to load schemas:', err);
      this.snackBar.open('Failed to load schemas', 'Close', { duration: 3000 });
    } finally {
      this.loadingSchemas.set(false);
    }
  }

  async initializeWithSchema(schema: SchemaOption): Promise<void> {
    this.initializingWithSchema.set(true);
    try {
      await this.schemaLoader.initializeProjectWithSchema(this.projectId(), schema.id);
      this.snackBar.open(`Project initialized with ${schema.name}`, 'Close', { duration: 3000 });
      
      // Reload project and nodes
      await this.loadProject();
    } catch (err: any) {
      console.error('Failed to initialize with schema:', err);
      this.snackBar.open('Failed to initialize project with schema', 'Close', { duration: 5000 });
    } finally {
      this.initializingWithSchema.set(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────

  retry(): void {
    this.loadProject();
  }

  refreshProject(): void {
    this.loadProject();
  }

  // ─── Node Event Handlers ────────────────────────────────────────────────────

  handleNodeSelected(node: TreeNode): void {
    this.selectedNode.set(node);
    this.nodeSelected.emit(node);
  }

  async handleNodeCreated(event: NodeCreatedEvent): Promise<void> {
    try {
      const backendParent = this.findBackendNode(event.parentNode.id);
      if (!backendParent) {
        throw new Error('Parent node not found');
      }

      const newNode = await this.api.createNode({
        project_id: this.projectId(),
        parent_id: event.parentNode.id,
        node_role: backendParent.node_role, // Use same role as parent for now
        title: event.label,
        content: '',
        metadata: {},
      }).toPromise();

      this.snackBar.open(`Node "${event.label}" created`, 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Failed to create node:', err);
      this.snackBar.open('Failed to create node', 'Close', { duration: 3000 });
    }
  }

  async handleNodeDeleted(event: NodeDeletedEvent): Promise<void> {
    try {
      await this.api.deleteNode(event.node.id).toPromise();
      this.snackBar.open(`Node "${event.node.label}" deleted`, 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Failed to delete node:', err);
      this.snackBar.open('Failed to delete node', 'Close', { duration: 3000 });
    }
  }

  async handleNodeRenamed(event: NodeRenamedEvent): Promise<void> {
    try {
      await this.api.updateNode(event.node.id, {
        title: event.newLabel,
      }).toPromise();
      this.snackBar.open(`Node renamed to "${event.newLabel}"`, 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Failed to rename node:', err);
      this.snackBar.open('Failed to rename node', 'Close', { duration: 3000 });
    }
  }

  // ─── Inspector Panel Event Handlers ─────────────────────────────────────────

  async handleNodeSaved(): Promise<void> {
    // Reload nodes to reflect changes
    await this.loadNodes();
    
    // Update the selected node with fresh data
    const currentlySelected = this.selectedNode();
    if (currentlySelected) {
      const updatedNode = this.findTreeNode(currentlySelected.id);
      if (updatedNode) {
        this.selectedNode.set(updatedNode);
      }
    }
  }

  async handleInspectorNodeDeleted(): Promise<void> {
    // Clear selection
    this.selectedNode.set(null);
    
    // Reload nodes
    await this.loadNodes();
  }

  async handleChildNodeRequested(parentNode: TreeNode): Promise<void> {
    const label = prompt('Enter child node name:');
    if (!label) return;

    await this.handleNodeCreated({ parentNode, label });
    
    // Reload to get the updated tree
    await this.loadNodes();
  }

  // ─── Project Creation ───────────────────────────────────────────────────────

  openCreateProjectDialog(): void {
    console.log('\n=== CREATE PROJECT DIALOG OPENED ===');
    console.log('Checking projectName input signal...');
    
    const nameFromInput = this.projectName();
    console.log('1. Raw projectName from input:', nameFromInput);
    console.log('2. Type:', typeof nameFromInput);
    console.log('3. Is truthy?', !!nameFromInput);
    console.log('4. Length:', nameFromInput?.length || 0);
    console.log('5. JSON stringify:', JSON.stringify(nameFromInput));
    
    // Use projectName from RAMPS dashboard if available, otherwise prompt
    const defaultName = nameFromInput || '';
    console.log('6. Default name (after || empty string):', defaultName);
    
    if (defaultName && defaultName.trim()) {
      console.log('✓ Using default name from RAMPS:', defaultName);
      const title = prompt('Enter project title:', defaultName);
      if (!title) {
        console.log('User cancelled prompt');
        return;
      }
      console.log('User entered title:', title);
      this.createProject(title);
    } else {
      console.log('✗ No project name provided, prompting user without default');
      const title = prompt('Enter project title:');
      if (!title) {
        console.log('User cancelled prompt');
        return;
      }
      console.log('User entered title:', title);
      this.createProject(title);
    }
  }

  async createProject(title: string, schemaId?: string): Promise<void> {
    this.loading.set(true);
    
    try {
      // Use the existing project ID from RAMPS (passed via route)
      const projectId = this.projectId();
      
      // Get current user ID from auth service
      const currentUser = this.authState.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const ownerId = currentUser.id;

      const project = await this.api.createProject({
        id: projectId,
        owner_id: ownerId,
        title: title,
        active_schema_id: schemaId,
      }).toPromise() as Project;

      this.project.set(project);
      this.snackBar.open(`Project "${title}" created`, 'Close', { duration: 3000 });
      
      await this.loadNodes();
    } catch (err: any) {
      console.error('Failed to create project:', err);
      this.snackBar.open('Failed to create project', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Conversion Utilities ───────────────────────────────────────────────────

  private convertToTreeNodes(backendNodes: BackendNode[]): TreeNode[] {
    return backendNodes.map(node => this.backendNodeToTreeNode(node));
  }

  private backendNodeToTreeNode(node: BackendNode): TreeNode {
    return {
      id: node.id,
      label: node.title || '(untitled)',
      parentId: node.parent_id,
      children: node.children ? node.children.map(c => this.backendNodeToTreeNode(c)) : [],
      expanded: true, // Expand all by default
      data: node, // Store full backend node data
    };
  }

  private findBackendNode(nodeId: string): BackendNode | null {
    const search = (nodes: BackendNode[]): BackendNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.backendNodes());
  }

  private findTreeNode(nodeId: string): TreeNode | null {
    const search = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.treeNodes());
  }
}
