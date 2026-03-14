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
import { TreeService } from '../services/tree.service';
import { TreeEditorComponent } from './tree-editor.component';
import { NodeInspectorComponent } from './node-inspector.component';
import { NodeContentEditorComponent } from './node-content-editor.component';
import { NodeEditorComponent } from './node-editor.component';
import { ProjectEditorComponent } from './project-editor.component';
import {
  BackendNode,
  TreeNode,
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeRenamedEvent,
  NodeInsertAboveEvent,
  NodeInsertBelowEvent,
  NodeDuplicateEvent,
  NodeMoveRequestedEvent,
  NodeSplitEvent,
  NodeMergeEvent,
  NodeDroppedEvent,
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
    NodeEditorComponent,
    ProjectEditorComponent,
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
        @if (showProjectEditor()) {
          <div class="project-editor-container">
            <omni-project-editor
              [projectId]="projectId()"
              [projectTitle]="projectName()"
              [mode]="'create'"
              [ownerId]="getCurrentUserId()"
              (projectCreated)="handleProjectCreated($event)"
              (editorClosed)="handleProjectEditorClosed()">
            </omni-project-editor>
          </div>
        } @else {
          <div class="no-project-state">
            <mat-icon class="info-icon">info</mat-icon>
            <h3>No Project Found</h3>
            <p>This project does not exist yet.</p>
            <button mat-raised-button color="primary" (click)="openCreateProjectDialog()">
              <mat-icon>add</mat-icon>
              Create Project
            </button>
          </div>
        }
      } @else {
        <!-- Project Header -->
        <div class="project-header">
          <div class="project-header-main">
            <div class="project-title-section">
              <mat-icon class="project-icon">folder_open</mat-icon>
              <div class="project-title-info">
                <h2>{{ project()!.title }}</h2>
                <span class="project-id">ID: {{ project()!.id }}</span>
              </div>
            </div>
            <div class="project-actions">
              <button mat-icon-button matTooltip="Refresh project" (click)="refreshProject()">
                <mat-icon>refresh</mat-icon>
              </button>
              <button mat-icon-button [matMenuTriggerFor]="projectMenu" matTooltip="Project options">
                <mat-icon>more_vert</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="project-metadata">
            @if (activeSchema()) {
              <div class="metadata-item">
                <mat-icon>schema</mat-icon>
                <span class="metadata-label">Schema:</span>
                <span class="metadata-value">{{ activeSchema()!.name }} v{{ activeSchema()!.version }}</span>
              </div>
            }
            @if (project()!.created_at) {
              <div class="metadata-item">
                <mat-icon>schedule</mat-icon>
                <span class="metadata-label">Created:</span>
                <span class="metadata-value">{{ formatProjectDate(project()!.created_at) }}</span>
              </div>
            }
            <div class="metadata-item">
              <mat-icon>account_tree</mat-icon>
              <span class="metadata-label">Nodes:</span>
              <span class="metadata-value">{{ treeNodes().length }}</span>
            </div>
          </div>
        </div>

        <!-- Three-Panel Layout -->
        <mat-sidenav-container class="editor-container">
          
          <!-- LEFT PANEL - Tree Editor -->
          <mat-sidenav mode="side" opened class="tree-panel">
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
                (nodeRenamed)="handleNodeRenamed($event)"
                (nodeInsertAbove)="handleInsertAbove($event)"
                (nodeInsertBelow)="handleInsertBelow($event)"
                (nodeDuplicate)="handleDuplicate($event)"
                (nodeMoveRequested)="handleMoveRequested($event)"
                (nodeSplit)="handleSplit($event)"
                (nodeMerge)="handleMerge($event)"
                (nodeDropped)="handleNodeDropped($event)">
              </omni-tree-editor>
            }
          </mat-sidenav>

          <!-- CENTER PANEL - Content Editor -->
          <div class="content-panel">
            <omni-node-content-editor
              [node]="selectedNode()">
            </omni-node-content-editor>
          </div>

          <!-- RIGHT PANEL - Inspector or Node Editor -->
          <mat-sidenav
            position="end"
            mode="side"
            [opened]="selectedNode() !== null"
            [class.inspector-panel]="!editorOpen()"
            [class.node-editor-panel]="editorOpen()">
            
            @if (editorOpen()) {
              <!-- Node Editor -->
              <omni-node-editor
                [node]="editingNode()"
                [parentNode]="editorParentNode()"
                [schema]="activeSchema()?.definition"
                [mode]="editorMode()"
                (nodeSaved)="handleEditorNodeSaved($event)"
                (nodeDeleted)="handleEditorNodeDeleted($event)"
                (editorClosed)="closeNodeEditor()">
              </omni-node-editor>
            } @else {
              <!-- Inspector -->
              <omni-node-inspector
                [node]="selectedNode()"
                [schema]="activeSchema()?.definition"
                (nodeSaved)="handleNodeSaved()"
                (nodeDeleted)="handleInspectorNodeDeleted()"
                (childNodeRequested)="handleChildNodeRequested($event)">
              </omni-node-inspector>
            }
          </mat-sidenav>

        </mat-sidenav-container>
      }
    </div>

    <mat-menu #projectMenu="matMenu">
      <button mat-menu-item (click)="refreshProject()">
        <mat-icon>refresh</mat-icon>
        <span>Refresh</span>
      </button>
      <button mat-menu-item (click)="changeSchema()">
        <mat-icon>schema</mat-icon>
        <span>Change Schema</span>
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

    /* Project Header */
    .project-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .project-header-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .project-title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .project-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: rgba(255, 255, 255, 0.9);
    }

    .project-title-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      line-height: 1.2;
    }

    .project-id {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-family: 'Courier New', monospace;
      margin-top: 4px;
      display: block;
    }

    .project-actions {
      display: flex;
      gap: 4px;
    }

    .project-actions button {
      color: white;
    }

    .project-actions button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .project-metadata {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.95);
    }

    .metadata-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      opacity: 0.8;
    }

    .metadata-label {
      font-weight: 500;
      opacity: 0.8;
    }

    .metadata-value {
      font-weight: 400;
    }

    /* Three-Panel Layout */
    .editor-container {
      flex: 1;
      min-height: 0; /* Important for flex children with scrolling */
    }

    .tree-panel {
      width: 300px;
      border-right: 1px solid rgba(0, 0, 0, 0.12);
    }

    mat-sidenav[position="end"] {
      border-left: 1px solid rgba(0, 0, 0, 0.12);
      transition: width 0.3s ease;
    }

    mat-sidenav[position="end"].inspector-panel {
      width: 525px;
    }

    mat-sidenav[position="end"].node-editor-panel {
      width: 525px;
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

    .project-editor-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      height: 100%;
      background: #fafafa;
    }
  `],
})
export class ProjectTreeEditorComponent implements OnInit {
  private api = inject(OmniApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  /** Ensures stats backfill runs only once per project load session */
  private _statsBackfilled = false;
  private authState = inject(AuthStateService);
  private schemaLoader = inject(SchemaLoaderService);
  private treeService = inject(TreeService);

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
  activeSchema = signal<Schema | null>(null);
  
  // Schema initialization state
  availableSchemas = signal<SchemaOption[]>([]);
  loadingSchemas = signal(false);
  initializingWithSchema = signal(false);

  // Node editor state
  editorOpen = signal(false);
  editorMode = signal<'create' | 'edit'>('create');
  editingNode = signal<BackendNode | null>(null);
  editorParentNode = signal<BackendNode | null>(null);

  // Project editor state
  showProjectEditor = signal(false);

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
        
        // Load active schema if available
        if (project.active_schema_id) {
          await this.loadActiveSchema(project.active_schema_id);
        }
        
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
      
      // If we have nodes but no active schema, try to load it
      if (nodes && nodes.length > 0 && !this.activeSchema() && this.project()?.active_schema_id) {
        console.log('Nodes exist but schema not loaded. Loading schema...');
        await this.loadActiveSchema(this.project()!.active_schema_id!);
      }

      // Backfill metadata.stats once per session for existing nodes that lack them
      if (!this._statsBackfilled && nodes && nodes.length > 0) {
        this._statsBackfilled = true;
        this.api.backfillProjectStats(this.projectId()).subscribe({
          next: async (r) => {
            if (r.updated > 0) {
              console.log(`Stats backfilled for ${r.updated} node(s). Reloading tree…`);
              await this.loadNodes();
            }
          },
          error: (e) => console.warn('Stats backfill failed (non-critical):', e),
        });
      }
    } catch (err: any) {
      console.error('Failed to load nodes:', err);
      this.snackBar.open('Failed to load project nodes', 'Close', { duration: 3000 });
    }
  }

  // ─── Schema Initialization ──────────────────────────────────────────────────

  async loadActiveSchema(schemaId: string): Promise<void> {
    try {
      const schema = await this.api.getSchema(schemaId).toPromise() as Schema;
      if (schema) {
        this.activeSchema.set(schema);
        console.log('Active schema loaded:', schema.name, 'v' + schema.version);
      }
    } catch (err: any) {
      console.error('Failed to load active schema:', err);
      
      // If schema not found (404), try to load any available schema as fallback
      if (err.status === 404) {
        console.warn(`Schema ${schemaId} not found. Attempting to load and set a fallback schema...`);
        try {
          const schemas = await this.api.listSchemas().toPromise() as Schema[];
          if (schemas && schemas.length > 0) {
            // Use the first available schema as fallback
            const fallbackSchema = schemas[0];
            this.activeSchema.set(fallbackSchema);
            console.log('Loaded fallback schema:', fallbackSchema.name, 'v' + fallbackSchema.version);
            
            // Update the project to use this schema
            try {
              await this.api.activateSchema(this.projectId(), fallbackSchema.id).toPromise();
              console.log('Project schema reference updated to:', fallbackSchema.id);
              this.snackBar.open(
                `Warning: Original schema not found. Project updated to use "${fallbackSchema.name}".`, 
                'Close', 
                { duration: 7000 }
              );
            } catch (updateErr: any) {
              console.error('Failed to update project schema reference:', updateErr);
              this.snackBar.open(
                `Warning: Using "${fallbackSchema.name}" but couldn't update project. Use "Change Schema" to fix.`, 
                'Close', 
                { duration: 7000 }
              );
            }
          } else {
            this.snackBar.open('No schemas available. Please create or import a schema.', 'Close', { duration: 5000 });
          }
        } catch (listErr: any) {
          console.error('Failed to load fallback schema:', listErr);
          this.snackBar.open('Failed to load any schema. Node editing may not work.', 'Close', { duration: 5000 });
        }
      } else {
        this.snackBar.open('Failed to load schema. Node editing may not work.', 'Close', { duration: 5000 });
      }
    }
  }

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

  async changeSchema(): Promise<void> {
    try {
      // Load available schemas
      const schemas = await this.schemaLoader.listSchemas();
      
      if (schemas.length === 0) {
        this.snackBar.open('No schemas available', 'Close', { duration: 3000 });
        return;
      }

      // Create a simple selection prompt
      const schemaList = schemas.map((s, i) => `${i + 1}. ${s.name} (v${s.version})`).join('\n');
      const selection = prompt(
        `Select a schema (enter number 1-${schemas.length}):\n\n${schemaList}`
      );

      if (!selection) return;

      const index = parseInt(selection) - 1;
      if (isNaN(index) || index < 0 || index >= schemas.length) {
        this.snackBar.open('Invalid selection', 'Close', { duration: 3000 });
        return;
      }

      const selectedSchema = schemas[index];
      
      // Activate the schema for this project
      await this.api.activateSchema(this.projectId(), selectedSchema.id).toPromise();
      
      // Reload the schema
      await this.loadActiveSchema(selectedSchema.id);
      
      this.snackBar.open(`Schema changed to "${selectedSchema.name}"`, 'Close', { duration: 3000 });
      
    } catch (err: any) {
      console.error('Failed to change schema:', err);
      this.snackBar.open('Failed to change schema', 'Close', { duration: 5000 });
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
    // Close the create-node editor when selecting a different node
    if (this.editorOpen() && this.editorMode() === 'create') {
      this.closeNodeEditor();
    }
    this.selectedNode.set(node);
    this.nodeSelected.emit(node);
  }

  async handleNodeCreated(event: NodeCreatedEvent): Promise<void> {
    // Open node editor instead of using prompt
    const backendParent = this.findBackendNode(event.parentNode.id);
    if (!backendParent) {
      this.snackBar.open('Parent node not found', 'Close', { duration: 3000 });
      return;
    }

    this.openNodeEditor(backendParent, 'create');
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

  // ─── New Tree Operations ─────────────────────────────────────────────────────

  async handleInsertAbove(event: NodeInsertAboveEvent): Promise<void> {
    const ref = this.findBackendNode(event.referenceNode.id);
    if (!ref) { this.snackBar.open('Node not found', 'Close', { duration: 2000 }); return; }

    const siblings = this.backendNodes()
      .flatMap(n => this._flattenBackend(n))
      .filter(n => n.parent_id === ref.parent_id);

    const nodeRole = ref.node_role || 'scene';
    try {
      await this.treeService.insertAbove(ref, siblings, nodeRole, '');
      this.snackBar.open('Node inserted above', 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Insert above failed:', err);
      this.snackBar.open('Failed to insert node', 'Close', { duration: 3000 });
    }
  }

  async handleInsertBelow(event: NodeInsertBelowEvent): Promise<void> {
    const ref = this.findBackendNode(event.referenceNode.id);
    if (!ref) { this.snackBar.open('Node not found', 'Close', { duration: 2000 }); return; }

    try {
      await this.treeService.insertBelow(ref, '');
      this.snackBar.open('Node inserted below', 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Insert below failed:', err);
      this.snackBar.open('Failed to insert node', 'Close', { duration: 3000 });
    }
  }

  async handleDuplicate(event: NodeDuplicateEvent): Promise<void> {
    try {
      await this.treeService.duplicateNode(event.node.id);
      this.snackBar.open(`Duplicated "${event.node.label}"`, 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Duplicate failed:', err);
      this.snackBar.open('Failed to duplicate node', 'Close', { duration: 3000 });
    }
  }

  async handleMoveRequested(event: NodeMoveRequestedEvent): Promise<void> {
    // Simple prompt-based move: ask for target node title and find it
    const targetTitle = prompt(
      `Move "${event.node.label}" to:\nEnter the title of the target parent node (leave blank to make root):`
    );
    if (targetTitle === null) return; // cancelled

    const allBackend = this.backendNodes()
      .flatMap(n => this._flattenBackend(n));

    let newParentId: string | null = null;
    if (targetTitle.trim() !== '') {
      const target = allBackend.find(n =>
        n.title?.toLowerCase() === targetTitle.trim().toLowerCase()
      );
      if (!target) {
        this.snackBar.open(`Node "${targetTitle}" not found`, 'Close', { duration: 3000 });
        return;
      }
      newParentId = target.id;
    }

    try {
      await this.api.moveNode(event.node.id, { new_parent_id: newParentId }).toPromise();
      this.snackBar.open(`Moved "${event.node.label}"`, 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Move failed:', err);
      this.snackBar.open('Failed to move node', 'Close', { duration: 3000 });
    }
  }

  async handleSplit(event: NodeSplitEvent): Promise<void> {
    const title = prompt(`Split "${event.node.label}" — title for the new node:`) ?? '';
    try {
      await this.treeService.splitNode(event.node.id, title);
      this.snackBar.open('Node split', 'Close', { duration: 2000 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Split failed:', err);
      this.snackBar.open('Failed to split node', 'Close', { duration: 3000 });
    }
  }

  async handleMerge(event: NodeMergeEvent): Promise<void> {
    if (!confirm(`Merge "${event.node.label}" with its previous sibling? Their content will be combined.`)) return;
    try {
      await this.treeService.mergeNode(event.node.id);
      this.snackBar.open('Nodes merged', 'Close', { duration: 2000 });
      this.selectedNode.set(null);
      await this.loadNodes();
    } catch (err: any) {
      console.error('Merge failed:', err);
      this.snackBar.open(err?.error?.detail ?? 'Failed to merge — ensure a previous sibling exists', 'Close', { duration: 4000 });
    }
  }

  async handleNodeDropped(event: NodeDroppedEvent): Promise<void> {
    const draggedBackend = this.findBackendNode(event.draggedNode.id);
    const targetBackend  = this.findBackendNode(event.targetNode.id);
    if (!draggedBackend || !targetBackend) return;

    const allFlat = this.backendNodes().flatMap(n => this._flattenBackend(n));

    try {
      await this.treeService.moveNode(draggedBackend, targetBackend, event.position, allFlat);
      this.snackBar.open('Node moved', 'Close', { duration: 1500 });
      await this.loadNodes();
    } catch (err: any) {
      console.error('Drag-drop move failed:', err);
      this.snackBar.open('Failed to move node', 'Close', { duration: 3000 });
    }
  }

  /** Flatten a BackendNode tree into a depth-first list. */
  private _flattenBackend(node: BackendNode): BackendNode[] {
    return [node, ...(node.children ?? []).flatMap(c => this._flattenBackend(c))];
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
    // Open node editor for creating a child node
    const backendParent = this.findBackendNode(parentNode.id);
    if (!backendParent) {
      this.snackBar.open('Parent node not found', 'Close', { duration: 3000 });
      return;
    }

    this.openNodeEditor(backendParent, 'create');
  }

  // ─── Node Editor Methods ────────────────────────────────────────────────────

  openNodeEditor(parentNode: BackendNode | null, mode: 'create' | 'edit', nodeToEdit?: BackendNode): void {
    if (!this.activeSchema()) {
      console.error('No active schema loaded. Project:', this.project());
      console.error('Project active_schema_id:', this.project()?.active_schema_id);
      
      // Try to load the schema if project has one
      if (this.project()?.active_schema_id) {
        this.snackBar.open('Loading schema...', 'Close', { duration: 2000 });
        this.loadActiveSchema(this.project()!.active_schema_id!).then(() => {
          if (this.activeSchema()) {
            // Retry opening the editor
            this.openNodeEditor(parentNode, mode, nodeToEdit);
          } else {
            this.snackBar.open('Failed to load schema. Please refresh the page.', 'Close', { duration: 5000 });
          }
        });
        return;
      }
      
      this.snackBar.open('No active schema loaded. Please initialize the project with a schema first.', 'Close', { duration: 5000 });
      return;
    }

    this.editorMode.set(mode);
    this.editorParentNode.set(parentNode);
    
    if (mode === 'create') {
      // Create a new node structure
      this.editingNode.set({
        project_id: this.projectId(),
        parent_id: parentNode?.id,
        depth: (parentNode?.depth ?? -1) + 1,
        order_index: 0,
        node_role: '',
        title: '',
        content: '',
        metadata: {},
      } as BackendNode);
    } else {
      // Edit existing node
      this.editingNode.set(nodeToEdit || null);
    }

    this.editorOpen.set(true);
  }

  closeNodeEditor(): void {
    this.editorOpen.set(false);
    this.editingNode.set(null);
    this.editorParentNode.set(null);
  }

  async handleEditorNodeSaved(node: any): Promise<void> {
    try {
      if (this.editorMode() === 'create') {
        // Create new node
        await this.api.createNode({
          project_id: this.projectId(),
          parent_id: node.parent_id,
          node_role: node.node_role,
          title: node.title,
          content: node.content || '',
          metadata: node.metadata || {},
        }).toPromise();

        this.snackBar.open(`Node "${node.title}" created`, 'Close', { duration: 2000 });
      } else {
        // Update existing node
        await this.api.updateNode(node.id, {
          title: node.title,
          content: node.content,
          metadata: node.metadata,
        }).toPromise();

        this.snackBar.open(`Node "${node.title}" updated`, 'Close', { duration: 2000 });
      }

      // Close editor and reload nodes
      this.closeNodeEditor();
      await this.loadNodes();
      
    } catch (err: any) {
      console.error('Failed to save node:', err);
      this.snackBar.open('Failed to save node', 'Close', { duration: 3000 });
    }
  }

  async handleEditorNodeDeleted(nodeId: string): Promise<void> {
    try {
      await this.api.deleteNode(nodeId).toPromise();
      this.snackBar.open('Node deleted successfully', 'Close', { duration: 2000 });
      
      // Close editor and reload nodes
      this.closeNodeEditor();
      this.selectedNode.set(null);
      await this.loadNodes();
      
    } catch (err: any) {
      console.error('Failed to delete node:', err);
      this.snackBar.open('Failed to delete node', 'Close', { duration: 3000 });
    }
  }

  // ─── Project Creation ───────────────────────────────────────────────────────

  openCreateProjectDialog(): void {
    this.showProjectEditor.set(true);
  }

  handleProjectCreated(project: any): void {
    this.project.set(project);
    this.showProjectEditor.set(false);
    this.snackBar.open(`Project "${project.title}" created successfully`, 'Close', { duration: 3000 });
    this.loadNodes();
  }

  handleProjectEditorClosed(): void {
    this.showProjectEditor.set(false);
  }

  getCurrentUserId(): string {
    const currentUser = this.authState.getCurrentUser();
    return currentUser?.id || '';
  }

  // ─── Utility Methods ────────────────────────────────────────────────────────

  formatProjectDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
