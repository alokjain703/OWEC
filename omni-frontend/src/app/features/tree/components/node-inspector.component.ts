import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TreeNode } from '../models/tree-node.model';
import { OmniApiService } from '../../../core/services/omni-api.service';

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
}

interface MetadataField {
  name: string;
  type: string;
  label?: string;
}

/**
 * Node Inspector Component
 * 
 * Right-side panel for editing node properties and metadata.
 * Displays node details and provides forms for editing.
 */
@Component({
  selector: 'omni-node-inspector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inspector-container">
      @if (!node()) {
        <div class="no-selection">
          <mat-icon class="no-selection-icon">info_outline</mat-icon>
          <p>Select a node to edit properties</p>
        </div>
      } @else {
        <mat-card class="inspector-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>settings</mat-icon>
              Node Properties
            </mat-card-title>
          </mat-card-header>

          <mat-divider></mat-divider>

          <mat-card-content>
            <!-- Title -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="editableTitle" placeholder="Enter node title">
            </mat-form-field>

            <!-- Role (read-only) -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Role</mat-label>
              <input matInput [value]="backendNode()?.node_role || 'N/A'" disabled>
            </mat-form-field>

            <!-- Depth (read-only) -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Depth</mat-label>
              <input matInput [value]="backendNode()?.depth || 0" disabled>
            </mat-form-field>

            <!-- Content -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Content</mat-label>
              <textarea 
                matInput 
                [(ngModel)]="editableContent"
                rows="4"
                placeholder="Enter node content">
              </textarea>
            </mat-form-field>

            <mat-divider></mat-divider>

            <!-- Metadata Section -->
            <div class="metadata-section">
              <h3>
                <mat-icon>data_object</mat-icon>
                Metadata
              </h3>

              @if (metadataFields().length > 0) {
                @for (field of metadataFields(); track field.name) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                    @if (field.type === 'integer' || field.type === 'number') {
                      <input 
                        matInput 
                        type="number"
                        [(ngModel)]="editableMetadata[field.name]"
                        [placeholder]="'Enter ' + formatFieldName(field.name)">
                    } @else {
                      <input 
                        matInput 
                        [(ngModel)]="editableMetadata[field.name]"
                        [placeholder]="'Enter ' + formatFieldName(field.name)">
                    }
                    <mat-hint>{{ field.type }}</mat-hint>
                  </mat-form-field>
                }
              } @else {
                <p class="no-metadata">No metadata fields defined</p>
              }
            </div>

            <mat-divider></mat-divider>

            <!-- Node Info -->
            <div class="node-info">
              <h3>
                <mat-icon>info</mat-icon>
                Node Information
              </h3>
              <div class="info-row">
                <span class="info-label">ID:</span>
                <span class="info-value">{{ node()!.id }}</span>
              </div>
              @if (backendNode()?.created_at) {
                <div class="info-row">
                  <span class="info-label">Created:</span>
                  <span class="info-value">{{ formatDate(backendNode()!.created_at) }}</span>
                </div>
              }
              @if (backendNode()?.updated_at) {
                <div class="info-row">
                  <span class="info-label">Updated:</span>
                  <span class="info-value">{{ formatDate(backendNode()!.updated_at) }}</span>
                </div>
              }
            </div>
          </mat-card-content>

          <mat-divider></mat-divider>

          <mat-card-actions class="inspector-actions">
            <button 
              mat-raised-button 
              color="primary"
              [disabled]="saving()"
              (click)="saveNode()">
              <mat-icon>save</mat-icon>
              Save
            </button>
            <button 
              mat-button 
              (click)="resetChanges()">
              <mat-icon>undo</mat-icon>
              Reset
            </button>
            <button 
              mat-button 
              color="accent"
              (click)="addChildNode()">
              <mat-icon>add</mat-icon>
              Add Child
            </button>
            <button 
              mat-button 
              color="warn"
              [disabled]="deleting()"
              (click)="deleteNode()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .inspector-container {
      height: 100%;
      overflow-y: auto;
      padding: 16px;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }

    .no-selection-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .inspector-card {
      margin: 0;
    }

    .inspector-card mat-card-header {
      padding: 16px;
    }

    .inspector-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }

    .inspector-card mat-card-content {
      padding: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }

    .metadata-section,
    .node-info {
      margin-top: 16px;
      margin-bottom: 16px;
    }

    .metadata-section h3,
    .node-info h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 12px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .metadata-section h3 mat-icon,
    .node-info h3 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .no-metadata {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
      font-style: italic;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }

    .info-label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .info-value {
      color: rgba(0, 0, 0, 0.87);
      font-family: 'Courier New', monospace;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .inspector-actions {
      padding: 12px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .inspector-actions button {
      flex: 1 1 auto;
      min-width: 100px;
    }

    mat-divider {
      margin: 16px 0;
    }
  `],
})
export class NodeInspectorComponent {
  private api = inject(OmniApiService);
  private snackBar = inject(MatSnackBar);

  // Inputs
  node = input<TreeNode | null>(null);

  // Outputs
  @Output() nodeSaved = new EventEmitter<void>();
  @Output() nodeDeleted = new EventEmitter<void>();
  @Output() childNodeRequested = new EventEmitter<TreeNode>();

  // State
  saving = signal(false);
  deleting = signal(false);

  // Computed
  backendNode = computed(() => {
    const n = this.node();
    return n?.data as BackendNode | undefined;
  });

  metadataFields = computed((): MetadataField[] => {
    const backend = this.backendNode();
    if (!backend?.metadata) return [];

    // Extract field names from existing metadata
    const fields: MetadataField[] = [];
    Object.keys(backend.metadata).forEach(key => {
      const value = backend.metadata[key];
      let type: string = typeof value;
      if (type === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'number';
      }
      fields.push({ name: key, type });
    });

    return fields;
  });

  // Editable state
  editableTitle = '';
  editableContent = '';
  editableMetadata: Record<string, unknown> = {};

  constructor() {
    // Watch for node changes and reset editable values
    this.node;
    this.resetChanges();
  }

  ngOnChanges(): void {
    this.resetChanges();
  }

  resetChanges(): void {
    const backend = this.backendNode();
    if (backend) {
      this.editableTitle = backend.title || '';
      this.editableContent = backend.content || '';
      this.editableMetadata = { ...backend.metadata };
    } else {
      this.editableTitle = '';
      this.editableContent = '';
      this.editableMetadata = {};
    }
  }

  async saveNode(): Promise<void> {
    const n = this.node();
    const backend = this.backendNode();
    if (!n || !backend) return;

    this.saving.set(true);
    try {
      await this.api.updateNode(backend.id, {
        title: this.editableTitle,
        content: this.editableContent,
        metadata: this.editableMetadata,
      }).toPromise();

      this.snackBar.open('Node saved successfully', 'Close', { duration: 2000 });
      this.nodeSaved.emit();
    } catch (err: any) {
      console.error('Failed to save node:', err);
      this.snackBar.open('Failed to save node', 'Close', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  async deleteNode(): Promise<void> {
    const n = this.node();
    const backend = this.backendNode();
    if (!n || !backend) return;

    const confirmMsg = `Delete "${backend.title || 'this node'}"?`;
    if (!confirm(confirmMsg)) return;

    this.deleting.set(true);
    try {
      await this.api.deleteNode(backend.id).toPromise();
      this.snackBar.open('Node deleted successfully', 'Close', { duration: 2000 });
      this.nodeDeleted.emit();
    } catch (err: any) {
      console.error('Failed to delete node:', err);
      this.snackBar.open('Failed to delete node', 'Close', { duration: 3000 });
    } finally {
      this.deleting.set(false);
    }
  }

  addChildNode(): void {
    const n = this.node();
    if (n) {
      this.childNodeRequested.emit(n);
    }
  }

  formatFieldName(name: string): string {
    // Convert snake_case to Title Case
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
