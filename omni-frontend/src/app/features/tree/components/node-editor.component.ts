import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

interface NodeRole {
  label: string;
  description?: string;
}

interface MetadataFieldDefinition {
  type: 'string' | 'integer' | 'enum' | 'array';
  required?: boolean;
  enum?: string[];
  items?: { type: string };
}

interface Schema {
  roles: Record<string, NodeRole>;
  allowed_children: Record<string, string[]>;
  metadata_definitions: Record<string, Record<string, MetadataFieldDefinition>>;
}

interface Node {
  id?: string;
  project_id?: string;
  parent_id?: string;
  depth?: number;
  order_index?: number;
  node_role: string;
  title?: string;
  content?: string;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Node Editor Component
 * 
 * Reusable component for creating and editing nodes.
 * Supports schema-driven metadata fields and can be embedded in other components.
 */
@Component({
  selector: 'omni-node-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="node-editor">
      <div class="editor-header">
        <h2>
          <mat-icon>{{ mode === 'create' ? 'add_circle' : 'edit' }}</mat-icon>
          {{ mode === 'create' ? 'Create New' : 'Edit' }}
          {{ editableNode.node_role ? getRoleLabel(editableNode.node_role) : (mode === 'create' ? 'Node' : 'Node') }}
        </h2>
        <button mat-icon-button (click)="closeEditor()" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="editor-content">
        <!-- Title -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input 
            matInput 
            [(ngModel)]="editableNode.title"
            placeholder="Enter node title"
            required>
          <mat-icon matPrefix>title</mat-icon>
          <mat-hint>Required</mat-hint>
        </mat-form-field>

        <!-- Node Role -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Node Role</mat-label>
          <mat-select 
            [(ngModel)]="editableNode.node_role"
            (selectionChange)="onRoleChanged()"
            [disabled]="mode === 'edit'"
            required>
            @for (role of allowedRoles; track role) {
              <mat-option [value]="role">
                {{ getRoleLabel(role) }}
                @if (getRoleDescription(role)) {
                  <span class="role-description"> - {{ getRoleDescription(role) }}</span>
                }
              </mat-option>
            }
          </mat-select>
          <mat-icon matPrefix>label</mat-icon>
          @if (mode === 'edit') {
            <mat-hint>Role cannot be changed after creation</mat-hint>
          } @else {
            <mat-hint>Choose the type of node to create</mat-hint>
          }
        </mat-form-field>

        <!-- Content Editor -->
        <mat-form-field appearance="outline" class="full-width content-editor">
          <mat-label>Content</mat-label>
          <textarea
            matInput
            [(ngModel)]="editableNode.content"
            rows="8"
            placeholder="Enter node content">
          </textarea>
          <mat-icon matPrefix>description</mat-icon>
          <mat-hint>Main content for this node</mat-hint>
        </mat-form-field>

        <mat-divider></mat-divider>

        <!-- Metadata Fields -->
        <div class="metadata-section">
          <h3>
            <mat-icon>data_object</mat-icon>
            Metadata
            @if (metadataFields.length === 0) {
              <span class="metadata-empty">(No metadata fields for this role)</span>
            }
          </h3>

          @if (metadataFields.length > 0) {
            @for (field of metadataFields; track field.name) {
              <!-- String Field -->
              @if (field.definition.type === 'string' && !field.definition.enum) {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                  <input 
                    matInput 
                    [(ngModel)]="editableNode.metadata[field.name]"
                    [placeholder]="'Enter ' + formatFieldName(field.name)"
                    [required]="field.definition.required || false">
                  @if (field.definition.required) {
                    <mat-hint>Required</mat-hint>
                  }
                </mat-form-field>
              }

              <!-- Integer Field -->
              @if (field.definition.type === 'integer') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                  <input 
                    matInput 
                    type="number"
                    [(ngModel)]="editableNode.metadata[field.name]"
                    [placeholder]="'Enter ' + formatFieldName(field.name)"
                    [required]="field.definition.required || false">
                  <mat-icon matPrefix>tag</mat-icon>
                  @if (field.definition.required) {
                    <mat-hint>Required</mat-hint>
                  }
                </mat-form-field>
              }

              <!-- Enum Field -->
              @if (field.definition.type === 'string' && field.definition.enum) {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                  <mat-select 
                    [(ngModel)]="editableNode.metadata[field.name]"
                    [required]="field.definition.required || false">
                    <mat-option [value]="null">-- None --</mat-option>
                    @for (option of field.definition.enum; track option) {
                      <mat-option [value]="option">{{ option }}</mat-option>
                    }
                  </mat-select>
                  @if (field.definition.required) {
                    <mat-hint>Required</mat-hint>
                  }
                </mat-form-field>
              }

              <!-- Array Field (comma-separated) -->
              @if (field.definition.type === 'array') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                  <input 
                    matInput 
                    [value]="getArrayFieldValue(field.name)"
                    (blur)="setArrayFieldValue(field.name, $event)"
                    [placeholder]="'Enter comma-separated ' + formatFieldName(field.name)"
                    [required]="field.definition.required || false">
                  <mat-icon matPrefix>list</mat-icon>
                  <mat-hint>Separate multiple values with commas</mat-hint>
                </mat-form-field>
              }
            }
          } @else {
            <p class="no-metadata">No metadata fields defined for this node role</p>
          }
        </div>

        <mat-divider></mat-divider>

        <!-- Node Information (Edit mode only) -->
        @if (mode === 'edit' && node?.id) {
          <div class="node-info">
            <h3 class="collapsible-header" (click)="nodeInfoExpanded = !nodeInfoExpanded">
              <mat-icon>info</mat-icon>
              Node Information
              <mat-icon class="collapse-icon">{{ nodeInfoExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
            </h3>
            @if (nodeInfoExpanded) {
              <div class="info-row">
                <span class="info-label">ID:</span>
                <span class="info-value">{{ node!.id }}</span>
              </div>
              @if (node!.depth !== undefined) {
                <div class="info-row">
                  <span class="info-label">Depth:</span>
                  <span class="info-value">{{ node!.depth }}</span>
                </div>
              }
              @if (node!.created_at) {
                <div class="info-row">
                  <span class="info-label">Created:</span>
                  <span class="info-value">{{ formatDate(node!.created_at) }}</span>
                </div>
              }
              @if (node!.updated_at) {
                <div class="info-row">
                  <span class="info-label">Updated:</span>
                  <span class="info-value">{{ formatDate(node!.updated_at) }}</span>
                </div>
              }

              <!-- Stats (read-only, system-computed) -->
              @if (getStats()) {
                <div class="stats-row">
                  <mat-icon class="stats-icon">bar_chart</mat-icon>
                  <span class="stats-text">
                    <strong>{{ getStats()!.word_count | number }}</strong> words
                    @if (getTargetWords(); as tgt) {
                      / {{ tgt | number }} goal &nbsp;•&nbsp;
                      {{ getProgress() }}%
                    }
                    &nbsp;•&nbsp;
                    {{ getStats()!.reading_time_minutes }} min read
                  </span>
                </div>
              }
            }
          </div>

          <mat-divider></mat-divider>
        }
      </div>

      <!-- Action Buttons -->
      <div class="editor-actions">
        <button 
          mat-raised-button 
          color="primary"
          (click)="saveNode()"
          [disabled]="!isValid()">
          <mat-icon>save</mat-icon>
          Save
        </button>
        <button 
          mat-button 
          (click)="closeEditor()">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        @if (mode === 'edit' && node?.id) {
          <button 
            mat-button 
            color="warn"
            (click)="deleteNode()">
            <mat-icon>delete</mat-icon>
            Delete
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .node-editor {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
    }

    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #f5f5f5;
    }

    .editor-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .editor-header mat-icon {
      color: #7c5cbf;
    }

    .editor-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .content-editor {
      margin-bottom: 24px;
    }

    .content-editor textarea {
      font-family: 'Roboto', sans-serif;
      line-height: 1.6;
    }

    .metadata-section,
    .node-info {
      margin-bottom: 24px;
    }

    .metadata-section h3,
    .node-info h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .collapsible-header {
      cursor: pointer;
      user-select: none;
      border-radius: 4px;
      padding: 4px 0;
      transition: color 0.2s;
    }

    .collapsible-header:hover {
      color: #7c5cbf;
    }

    .collapse-icon {
      margin-left: auto;
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(0, 0, 0, 0.54);
    }

    .metadata-section h3 mat-icon,
    .node-info h3 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #7c5cbf;
    }

    .metadata-empty {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
      font-weight: normal;
      font-style: italic;
    }

    .no-metadata {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
      font-style: italic;
      margin: 8px 0;
    }

    .role-description {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }

    .info-label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .info-value {
      color: rgba(0, 0, 0, 0.87);
      font-family: 'Courier New', monospace;
      font-size: 12px;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .editor-actions {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      background: #fafafa;
    }

    .editor-actions button {
      flex: 1;
    }

    mat-divider {
      margin: 16px 0;
    }

    ::ng-deep .mat-mdc-form-field-hint {
      font-size: 12px;
    }
  `],
})
export class NodeEditorComponent implements OnInit, OnChanges {
  @Input() node: Node | null = null;
  @Input() parentNode: Node | null = null;
  @Input() schema: any = null;  // Changed from Schema to any for flexibility
  @Input() mode: 'create' | 'edit' = 'create';

  @Output() nodeSaved = new EventEmitter<Node>();
  @Output() nodeDeleted = new EventEmitter<string>();
  @Output() editorClosed = new EventEmitter<void>();

  editableNode: Node = {
    node_role: '',
    title: '',
    content: '',
    metadata: {},
  };

  allowedRoles: string[] = [];
  metadataFields: Array<{ name: string; definition: MetadataFieldDefinition }> = [];

  // ─ Stats helpers (read-only; sourced from node.metadata.stats) ─────────

  getStats() {
    return (this.node as any)?.metadata?.stats ?? null;
  }

  getTargetWords(): number | null {
    const t = (this.node as any)?.metadata?.target_word_count;
    return typeof t === 'number' ? t : null;
  }

  getProgress(): number {
    const wc  = this.getStats()?.word_count ?? 0;
    const tgt = this.getTargetWords();
    if (!tgt) return 0;
    return Math.min(100, Math.round((wc / tgt) * 100));
  }
  nodeInfoExpanded = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node'] || changes['parentNode'] || changes['schema'] || changes['mode']) {
      this.initializeEditor();
    }
  }

  private initializeEditor(): void {
    if (this.mode === 'create') {
      // Create mode: set up new node
      this.editableNode = {
        parent_id: this.parentNode?.id,
        node_role: '',
        title: '',
        content: '',
        metadata: {},
      };
      this.loadAllowedRoles();
    } else if (this.mode === 'edit' && this.node) {
      // Edit mode: copy existing node
      this.editableNode = {
        ...this.node,
        metadata: { ...this.node.metadata },
      };
      this.allowedRoles = [this.node.node_role]; // Can't change role in edit mode
      this.loadMetadataFields(this.node.node_role);
    }
  }

  private loadAllowedRoles(): void {
    if (!this.schema || !this.parentNode) {
      this.allowedRoles = [];
      return;
    }

    const parentRole = this.parentNode.node_role;
    this.allowedRoles = this.schema.allowed_children[parentRole] || [];
    
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
    
    // Auto-select first role if only one option
    if (this.allowedRoles.length === 1) {
      this.editableNode.node_role = this.allowedRoles[0];
      this.loadMetadataFields(this.allowedRoles[0]);
    }
  }

  onRoleChanged(): void {
    // Reset metadata when role changes
    this.editableNode.metadata = {};
    this.loadMetadataFields(this.editableNode.node_role);
  }

  private loadMetadataFields(role: string): void {
    if (!this.schema || !role) {
      this.metadataFields = [];
      return;
    }

    const roleMeta = this.schema.metadata_definitions[role];
    if (!roleMeta) {
      this.metadataFields = [];
      return;
    }

    this.metadataFields = Object.entries(roleMeta).map(([name, definition]) => ({
      name,
      definition: definition as MetadataFieldDefinition,
    }));

    // Don't pre-initialize metadata fields with empty values
    // This would cause validation to fail for required fields
    // Let users fill in values as needed
    
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  getRoleLabel(role: string): string {
    return this.schema?.roles[role]?.label || role;
  }

  getRoleDescription(role: string): string {
    return this.schema?.roles[role]?.description || '';
  }

  formatFieldName(name: string): string {
    // Convert snake_case to Title Case
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getArrayFieldValue(fieldName: string): string {
    const value = this.editableNode.metadata[fieldName];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return '';
  }

  setArrayFieldValue(fieldName: string, event: any): void {
    const input = event.target.value;
    if (!input || input.trim() === '') {
      this.editableNode.metadata[fieldName] = [];
    } else {
      this.editableNode.metadata[fieldName] = input
        .split(',')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }
  }

  isValid(): boolean {
    // Check required fields
    if (!this.editableNode.title?.trim() || !this.editableNode.node_role) {
      return false;
    }

    // Check required metadata fields
    for (const field of this.metadataFields) {
      if (field.definition.required) {
        const value = this.editableNode.metadata[field.name];
        if (value === null || value === undefined || value === '') {
          return false;
        }
        if (field.definition.type === 'array' && (!Array.isArray(value) || value.length === 0)) {
          return false;
        }
      }
    }

    return true;
  }

  saveNode(): void {
    if (!this.isValid()) {
      return;
    }
    this.nodeSaved.emit(this.editableNode);
  }

  deleteNode(): void {
    if (!this.node?.id) return;
    
    const confirmMsg = `Delete "${this.node.title}"?`;
    if (confirm(confirmMsg)) {
      this.nodeDeleted.emit(this.node.id);
    }
  }

  closeEditor(): void {
    this.editorClosed.emit();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
