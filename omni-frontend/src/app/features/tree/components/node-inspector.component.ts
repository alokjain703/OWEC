import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  signal,
  computed,
  effect,
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BackendNode, TreeNode } from '../models/tree-node.model';
import { OmniApiService } from '../../../core/services/omni-api.service';
import { OmniJsonEditorComponent } from '../../../shared/omni-json-editor/omni-json-editor.component';

interface MetadataFieldDef {
  type: 'string' | 'integer' | 'enum' | 'array';
  required?: boolean;
  enum?: string[];
  items?: { type: string };
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
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    OmniJsonEditorComponent,
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

            <!-- Content Format -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Content Format</mat-label>
              <mat-select [(ngModel)]="editableContentFormat">
                <mat-option value="html">HTML</mat-option>
                <mat-option value="markdown">Markdown</mat-option>
                <mat-option value="json">JSON</mat-option>
                <mat-option value="plain">Plain Text</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Path (read-only) -->
            @if (backendNode()?.path) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Path</mat-label>
                <input matInput [value]="backendNode()!.path" readonly>
              </mat-form-field>
            }

            <!-- Has Children (read-only indicator) -->
            <div class="has-children-row">
              <mat-slide-toggle
                [checked]="backendNode()?.has_children ?? false"
                disabled
                color="primary">
                Has Children
              </mat-slide-toggle>
            </div>

            <mat-divider></mat-divider>

            <!-- Metadata Section -->
            <div class="metadata-section">
              <h3>
                <mat-icon>data_object</mat-icon>
                Metadata
              </h3>

              <mat-tab-group [(selectedIndex)]="metadataTabIndex" animationDuration="150ms">

                <!-- ── Tab 1: Schema Fields ─────────────────────────────── -->
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon class="tab-icon">view_list</mat-icon>
                    Fields
                  </ng-template>

                  @if (schemaFields().length > 0) {
                    @for (field of schemaFields(); track field.name) {

                      <!-- String -->
                      @if (field.def.type === 'string' && !field.def.enum) {
                        <mat-form-field appearance="outline" class="full-width meta-field">
                          <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                          <input matInput
                                 [ngModel]="editableMetadata[field.name] ?? ''"
                                 (ngModelChange)="setMetaField(field.name, $event)"
                                 [placeholder]="'Enter ' + formatFieldName(field.name)"
                                 [required]="!!field.def.required">
                          @if (field.def.required) { <mat-hint>Required</mat-hint> }
                        </mat-form-field>
                      }

                      <!-- Integer -->
                      @if (field.def.type === 'integer') {
                        <mat-form-field appearance="outline" class="full-width meta-field">
                          <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                          <input matInput type="number"
                                 [ngModel]="editableMetadata[field.name] ?? null"
                                 (ngModelChange)="setMetaField(field.name, $event)"
                                 [placeholder]="'Enter ' + formatFieldName(field.name)"
                                 [required]="!!field.def.required">
                          <mat-icon matPrefix>tag</mat-icon>
                          @if (field.def.required) { <mat-hint>Required</mat-hint> }
                        </mat-form-field>
                      }

                      <!-- Enum (select) -->
                      @if (field.def.type === 'string' && field.def.enum) {
                        <mat-form-field appearance="outline" class="full-width meta-field">
                          <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                          <mat-select
                                 [ngModel]="editableMetadata[field.name] ?? null"
                                 (ngModelChange)="setMetaField(field.name, $event)"
                                 [required]="!!field.def.required">
                            <mat-option [value]="null">-- None --</mat-option>
                            @for (opt of field.def.enum; track opt) {
                              <mat-option [value]="opt">{{ opt }}</mat-option>
                            }
                          </mat-select>
                          @if (field.def.required) { <mat-hint>Required</mat-hint> }
                        </mat-form-field>
                      }

                      <!-- Array (comma-separated) -->
                      @if (field.def.type === 'array') {
                        <mat-form-field appearance="outline" class="full-width meta-field">
                          <mat-label>{{ formatFieldName(field.name) }}</mat-label>
                          <input matInput
                                 [value]="getArrayValue(field.name)"
                                 (blur)="setArrayValue(field.name, $event)"
                                 placeholder="Comma-separated values"
                                 [required]="!!field.def.required">
                          <mat-icon matPrefix>list</mat-icon>
                          <mat-hint>Separate values with commas</mat-hint>
                        </mat-form-field>
                      }

                    }
                  } @else {
                    <p class="no-schema-msg">
                      @if (schema()) {
                        No metadata fields defined for role <strong>{{ backendNode()?.node_role }}</strong>.
                      } @else {
                        No schema loaded — metadata fields unavailable. Switch to Raw JSON to edit.
                      }
                    </p>
                  }
                </mat-tab>

                <!-- ── Tab 2: Raw JSON ──────────────────────────────────── -->
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon class="tab-icon">code</mat-icon>
                    Raw JSON
                  </ng-template>

                  <div class="json-tab-body">
                    <omni-json-editor
                      [data]="metadataObject"
                      (dataChange)="onMetadataChange($event)"
                      mode="tree" />
                  </div>
                </mat-tab>

              </mat-tab-group>
            </div>

            <mat-divider></mat-divider>

            <!-- Node Info -->
            <div class="node-info">
              <h3 class="collapsible-header" (click)="nodeInfoExpanded = !nodeInfoExpanded">
                <mat-icon>info</mat-icon>
                Node Information
                <mat-icon class="collapse-icon">{{ nodeInfoExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
              </h3>
              @if (nodeInfoExpanded) {
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
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .tab-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
      vertical-align: middle;
    }

    .meta-field {
      margin-top: 8px;
    }

    .no-schema-msg {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
      padding: 8px 0;
    }

    .json-tab-body {
      padding-top: 8px;
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

    .has-children-row {
      padding: 8px 0 16px 0;
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
  node   = input<TreeNode | null>(null);
  schema = input<any>(null);  // same schema shape as NodeEditorComponent expects

  // Outputs
  @Output() nodeSaved          = new EventEmitter<void>();
  @Output() nodeDeleted        = new EventEmitter<void>();
  @Output() childNodeRequested = new EventEmitter<TreeNode>();

  // State
  saving   = signal(false);
  deleting = signal(false);

  // Derived backend node
  backendNode = computed(() => this.node()?.data as BackendNode | undefined);

  // Editable fields
  editableTitle         = '';
  editableContent       = '';
  editableContentFormat = 'html';
  editableMetadata: Record<string, unknown> = {};
  metadataObject: unknown = {};

  // Tab index: 0 = Schema Fields, 1 = Raw JSON
  metadataTabIndex = 0;
  nodeInfoExpanded = false;

  // ── Schema fields computed from schema input + node role ────────────────
  schemaFields = computed(() => {
    const s = this.schema();
    const role = this.backendNode()?.node_role;
    if (!s || !role) return [];
    const roleMeta: Record<string, MetadataFieldDef> | undefined =
      s.metadata_definitions?.[role];
    if (!roleMeta) return [];
    return Object.entries(roleMeta).map(([name, def]) => ({
      name,
      def: def as MetadataFieldDef,
    }));
  });

  constructor() {
    effect(() => {
      this.node(); // track
      this.resetChanges();
    });
  }

  ngOnChanges(): void {
    this.resetChanges();
  }

  resetChanges(): void {
    const backend = this.backendNode();
    if (backend) {
      this.editableTitle         = backend.title   ?? '';
      this.editableContent       = backend.content ?? '';
      this.editableContentFormat = backend.content_format ?? 'html';
      this.editableMetadata      = { ...(backend.metadata ?? {}) };
      this.metadataObject        = { ...(backend.metadata ?? {}) };
    } else {
      this.editableTitle         = '';
      this.editableContent       = '';
      this.editableContentFormat = 'html';
      this.editableMetadata      = {};
      this.metadataObject        = {};
    }
  }

  // ── Metadata helpers ────────────────────────────────────────────────────

  /** Called by schema-field inputs to update a single key. */
  setMetaField(name: string, value: unknown): void {
    this.editableMetadata = { ...this.editableMetadata, [name]: value };
    this.metadataObject   = { ...this.editableMetadata };
  }

  /** Display an array field as comma-separated string. */
  getArrayValue(name: string): string {
    const v = this.editableMetadata[name];
    return Array.isArray(v) ? v.join(', ') : '';
  }

  /** Parse comma-separated string back to array on blur. */
  setArrayValue(name: string, event: FocusEvent): void {
    const raw = (event.target as HTMLInputElement).value;
    const arr = raw
      ? raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
    this.setMetaField(name, arr);
  }

  /** Called by the JSON editor — syncs back to editableMetadata. */
  onMetadataChange(data: unknown): void {
    this.editableMetadata = (data as Record<string, unknown>) ?? {};
    // Don't reassign metadataObject (avoid infinite loop with json editor)
  }

  // ── Save / Delete ───────────────────────────────────────────────────────

  async saveNode(): Promise<void> {
    const n       = this.node();
    const backend = this.backendNode();
    if (!n || !backend) return;

    this.saving.set(true);
    try {
      await this.api.updateNode(backend.id, {
        title:          this.editableTitle,
        content:        this.editableContent,
        content_format: this.editableContentFormat,
        metadata:       this.editableMetadata,
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
    const backend = this.backendNode();
    if (!backend) return;

    if (!confirm(`Delete "${backend.title || 'this node'}"?`)) return;

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
    if (n) this.childNodeRequested.emit(n);
  }

  formatFieldName(name: string): string {
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  formatDate(dateString: string): string {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }
}
