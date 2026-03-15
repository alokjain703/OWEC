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
      <div class="inspector-scroll">
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

          <!-- Role · Depth · Has Children – sub-header row -->
          <div class="card-subheader">
            <div class="node-chips-row">
              <div class="node-chip role-chip">
                <mat-icon class="chip-icon">label</mat-icon>
                <span class="chip-label">Role</span>
                <span class="chip-value">{{ roleLabel() }}</span>
              </div>
              <div class="node-chip depth-chip">
                <mat-icon class="chip-icon">account_tree</mat-icon>
                <span class="chip-label">Depth</span>
                <span class="chip-value">{{ backendNode()?.depth ?? 0 }}</span>
              </div>
              <div class="node-chip children-chip" [class.active]="backendNode()?.has_children">
                <mat-icon class="chip-icon">{{ backendNode()?.has_children ? 'folder' : 'folder_open' }}</mat-icon>
                <span class="chip-value">{{ backendNode()?.has_children ? 'Has children' : 'No children' }}</span>
              </div>
            </div>
            
          </div>

          <mat-divider></mat-divider>

          <mat-card-content>
            <!-- Title -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="editableTitle" placeholder="Enter node title">
            </mat-form-field>

            <!-- Role · Depth · Has Children (compact row) -->
            <!-- <div class="node-chips-row">
              <div class="node-chip role-chip">
                <mat-icon class="chip-icon">label</mat-icon>
                <span class="chip-label">Role</span>
                <span class="chip-value">{{ roleLabel() }}</span>
              </div>
              <div class="node-chip depth-chip">
                <mat-icon class="chip-icon">account_tree</mat-icon>
                <span class="chip-label">Depth</span>
                <span class="chip-value">{{ backendNode()?.depth ?? 0 }}</span>
              </div>
              <div class="node-chip children-chip" [class.active]="backendNode()?.has_children">
                <mat-icon class="chip-icon">{{ backendNode()?.has_children ? 'folder' : 'folder_open' }}</mat-icon>
                <span class="chip-value">{{ backendNode()?.has_children ? 'Has children' : 'No children' }}</span>
              </div>
            </div> -->

                        <!-- Content -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Content</mat-label>
              <textarea 
                matInput 
                [ngModel]="editableContent"
                (ngModelChange)="editableContent = $event; contentChange.emit($event)"
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

            <!-- Stats Section (read-only, system-computed) -->
            @if (getStats()) {
              <div class="stats-section">
                <h3>
                  <mat-icon>bar_chart</mat-icon>
                  Writing Stats
                </h3>
                <div class="stats-pills-row">
                  <div class="stat-pill">
                    <span class="stat-pill-value">{{ getStats()!.word_count | number }}</span>
                    <span class="stat-pill-label">words
                      @if (getTargetWords(); as target) {
                        <span class="stat-pill-target">&nbsp;/ {{ target | number }}</span>
                      }
                    </span>
                  </div>
                  <div class="stat-pill">
                    <span class="stat-pill-value">{{ getStats()!.reading_time_minutes }}</span>
                    <span class="stat-pill-label">min read</span>
                  </div>
                  <div class="stat-pill">
                    <span class="stat-pill-value">{{ getStats()!.sentence_count | number }}</span>
                    <span class="stat-pill-label">sentences</span>
                  </div>
                  <div class="stat-pill">
                    <span class="stat-pill-value">{{ getStats()!.paragraph_count | number }}</span>
                    <span class="stat-pill-label">paragraphs</span>
                  </div>
                </div>
                @if (getTargetWords(); as target) {
                  <div class="progress-bar-wrap">
                    <div class="progress-bar-fill"
                         [style.width.%]="getProgress()">
                    </div>
                  </div>
                  <div class="progress-label">
                    {{ getProgress() }}% of {{ target | number }} word goal
                  </div>
                }
              </div>
              <mat-divider></mat-divider>
            }

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
                @if (backendNode()?.path) {
                  <div class="path-row">
                    <mat-icon class="path-icon">route</mat-icon>
                    <span class="path-label">Path</span>
                    <span class="path-value">{{ backendNode()!.path }}</span>
                  </div>
                }
              }
            </div>
          </mat-card-content>

        </mat-card>
      }
      </div>

      @if (node()) {
        <div class="inspector-footer">
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
        </div>
      }
    </div>
  `,
  styles: [`
    .inspector-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .inspector-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 8px;
    }

    .inspector-footer {
      flex-shrink: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.12);
      background: white;
    }

    .inspector-footer button {
      flex: 1 1 auto;
      min-width: 90px;
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
      padding: 16px 16px 8px;
    }

    .card-subheader {
      padding: 0 16px 12px;
    }

    .path-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 2px 0;
      font-size: 12px;
      color: rgba(0,0,0,0.54);
      overflow: hidden;
    }
    .path-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      color: rgba(0,0,0,0.38);
    }
    .path-label {
      font-weight: 500;
      flex-shrink: 0;
      color: rgba(0,0,0,0.45);
    }
    .path-label::after { content: ':'; }
    .path-value {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: rgba(0,0,0,0.6);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .stats-section {
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .stats-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 10px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .stats-grid {
      display: none; /* replaced by stats-pills-row */
    }

    /* Stats pills row */
    .stats-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .stat-pill {
      display: flex;
      align-items: baseline;
      gap: 4px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 3px 10px;
      white-space: nowrap;
    }
    .stat-pill-value {
      font-size: 13px;
      font-weight: 700;
      color: rgba(0,0,0,0.87);
    }
    .stat-pill-label {
      font-size: 11px;
      color: rgba(0,0,0,0.5);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .stat-pill-target {
      color: #3f51b5;
      font-weight: 600;
    }

    .progress-bar-wrap {
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3f51b5, #7986cb);
      border-radius: 3px;
      transition: width 0.4s ease;
      max-width: 100%;
    }

    .progress-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.54);
      text-align: right;
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
      display: none;
    }

    .has-children-row {
      padding: 8px 0 16px 0;
    }

    /* Node chips row: Role · Depth · Has Children */
    .node-chips-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .node-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 16px;
      padding: 4px 10px 4px 6px;
      font-size: 12px;
      color: rgba(0,0,0,0.7);
      flex-shrink: 0;
    }
    .node-chip.active {
      background: #e8f5e9;
      border-color: #a5d6a7;
      color: #2e7d32;
    }
    .chip-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: rgba(0,0,0,0.45);
    }
    .node-chip.active .chip-icon { color: #2e7d32; }
    .chip-label {
      font-weight: 500;
      color: rgba(0,0,0,0.45);
      margin-right: 2px;
    }
    .chip-value {
      font-weight: 600;
      text-transform: capitalize;
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
  @Output() contentChange      = new EventEmitter<string>();

  // State
  saving   = signal(false);
  deleting = signal(false);

  // Derived backend node
  backendNode = computed(() => this.node()?.data as BackendNode | undefined);

  // ─ Stats helpers (read-only; no user editing) ─────────────────────────

  private static readonly _ROLE_LABELS: Record<string, string> = {
    book:    'Book',
    part:    'Part',
    chapter: 'Chapter',
    section: 'Section',
    scene:   'Scene',
    unknown: 'Unknown',
  };

  roleLabel(): string {
    const role = this.backendNode()?.node_role;
    if (!role) return 'N/A';
    // Prefer the schema's human-readable label (e.g. "Book" for "major_unit")
    return this.schema()?.roles?.[role]?.label
      ?? NodeInspectorComponent._ROLE_LABELS[role]
      ?? role;
  }

  getStats() {
    return this.backendNode()?.metadata?.stats ?? null;
  }

  getTargetWords(): number | null {
    const t = this.backendNode()?.metadata?.target_word_count;
    return typeof t === 'number' ? t : null;
  }

  getProgress(): number {
    const wc  = this.getStats()?.word_count ?? 0;
    const tgt = this.getTargetWords();
    if (!tgt) return 0;
    return Math.min(100, Math.round((wc / tgt) * 100));
  }

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
