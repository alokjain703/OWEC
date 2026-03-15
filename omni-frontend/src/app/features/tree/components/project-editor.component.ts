import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OmniApiService } from '../../../core/services/omni-api.service';

interface Schema {
  id: string;
  name: string;
  version: number;
  definition: Record<string, unknown>;
}

interface ProjectPayload {
  id: string;
  owner_id: string;
  title: string;
  active_schema_id?: string;
}

/**
 * Project Editor Component
 * 
 * Reusable component for creating and editing OMNI projects.
 * Project ID and title come from RAMPS and are read-only in OMNI.
 * Can be embedded in dialogs, drawers, or page layouts.
 */
@Component({
  selector: 'omni-project-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="project-editor">
      <mat-card-header>
        <mat-card-title>
          <div class="header-title">
            <mat-icon>{{ mode === 'create' ? 'add_circle' : 'edit' }}</mat-icon>
            <span>{{ mode === 'create' ? 'Create New Project' : 'Edit Project' }}</span>
          </div>
        </mat-card-title>
      </mat-card-header>
      
      <!-- ----------------- ->
      <!-- Card content is conditionally rendered based on loading state and mode -->
      <mat-card-content>
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading schemas...</p>
          </div>
        } @else {
          <div class="form-section">
            <h3>
              <mat-icon>info</mat-icon>
              Project Information
            </h3>
            <p class="section-description">
              Project details are managed by RAMPS and cannot be edited here.
            </p>

            <!-- Project ID (read-only) -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Project ID</mat-label>
              <input 
                matInput 
                [value]="projectId" 
                readonly>
              <mat-icon matPrefix>badge</mat-icon>
              <mat-hint>Provided by RAMPS</mat-hint>
            </mat-form-field>

            <!-- Project Title (read-only) -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Project Title</mat-label>
              <input 
                matInput 
                [value]="projectTitle" 
                readonly>
              <mat-icon matPrefix>title</mat-icon>
              <mat-hint>Provided by RAMPS</mat-hint>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <div class="form-section">
            <h3>
              <mat-icon>schema</mat-icon>
              Schema Configuration
            </h3>
            <p class="section-description">
              @if (mode === 'create') {
                Choose a schema template to define your project structure.
              } @else {
                Schema cannot be changed after project creation.
              }
            </p>

            @if (mode === 'create') {
              <!-- Schema Selector (create mode) -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Schema</mat-label>
                <mat-select 
                  [(ngModel)]="selectedSchemaId"
                  required>
                  <mat-option [value]="null">-- Select a schema --</mat-option>
                  @for (schema of schemas(); track schema.id) {
                    <mat-option [value]="schema.id">
                      {{ schema.name }} (v{{ schema.version }})
                    </mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>folder_special</mat-icon>
                <mat-hint>This determines the structure of your project</mat-hint>
              </mat-form-field>

              @if (selectedSchemaId && getSelectedSchema()) {
                <div class="schema-preview">
                  <mat-icon>visibility</mat-icon>
                  <div class="schema-info">
                    <strong>{{ getSelectedSchema()!.name }}</strong>
                    <span>Version {{ getSelectedSchema()!.version }}</span>
                  </div>
                </div>
              }
            } @else {
              <!-- Schema Display (edit mode) -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Active Schema</mat-label>
                <input 
                  matInput 
                  [value]="activeSchemaName()" 
                  readonly>
                <mat-icon matPrefix>schema</mat-icon>
                <mat-hint>Schema is locked after project creation</mat-hint>
              </mat-form-field>
            }
          </div>
        }
      </mat-card-content>

      <mat-divider></mat-divider>

      <mat-card-actions align="end">
        <button 
          mat-button 
          (click)="cancel()">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        
        @if (mode === 'create') {
          <button 
            mat-raised-button 
            color="primary"
            (click)="createProject()"
            [disabled]="!isValid() || saving()">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>add</mat-icon>
            }
            Create Project
          </button>
        } @else {
          <button 
            mat-raised-button 
            color="primary"
            (click)="updateProject()"
            [disabled]="saving()">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Save Changes
          </button>
        }
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .project-editor {
      max-width: 600px;
      height: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    mat-card-header {
      padding: 24px 24px 0;
      flex-shrink: 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 500;
    }

    .header-title mat-icon {
      color: #7c5cbf;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    mat-card-content {
      padding: 24px;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }

    .loading-state p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.54);
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-section:last-of-type {
      margin-bottom: 0;
    }

    .form-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .form-section h3 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #7c5cbf;
    }

    .section-description {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      margin: 0 0 16px 0;
      line-height: 1.4;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .schema-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #7c5cbf;
      margin-top: -8px;
    }

    .schema-preview mat-icon {
      color: #7c5cbf;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .schema-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .schema-info strong {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }

    .schema-info span {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    mat-card-actions {
      padding: 16px 24px;
      gap: 8px;
      flex-shrink: 0;
    }

    mat-card-actions button {
      min-width: 120px;
    }

    mat-card-actions button mat-spinner {
      margin-right: 8px;
    }

    mat-divider {
      margin: 16px 0;
      flex-shrink: 0;
    }

    ::ng-deep .mat-mdc-form-field-hint {
      font-size: 12px;
    }
  `],
})
export class ProjectEditorComponent implements OnInit {
  @Input() projectId!: string;
  @Input() projectTitle!: string;
  @Input() mode!: 'create' | 'edit';
  @Input() activeSchemaId?: string;
  @Input() ownerId!: string;

  @Output() projectCreated = new EventEmitter<any>();
  @Output() projectUpdated = new EventEmitter<any>();
  @Output() editorClosed = new EventEmitter<void>();

  // State
  loading = signal(false);
  saving = signal(false);
  schemas = signal<Schema[]>([]);
  selectedSchemaId: string | null = null;
  activeSchemaName = signal<string>('');

  constructor(
    private api: OmniApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.mode === 'create') {
      this.loadSchemas();
    } else if (this.mode === 'edit' && this.activeSchemaId) {
      this.loadActiveSchemaName();
    }
  }

  async loadSchemas(): Promise<void> {
    this.loading.set(true);
    try {
      const schemas = await this.api.listSchemas().toPromise() as Schema[];
      this.schemas.set(schemas);
    } catch (err: any) {
      console.error('Failed to load schemas:', err);
      this.snackBar.open('Failed to load schemas', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async loadActiveSchemaName(): Promise<void> {
    if (!this.activeSchemaId) return;

    try {
      const schema = await this.api.getSchema(this.activeSchemaId).toPromise() as Schema;
      this.activeSchemaName.set(`${schema.name} v${schema.version}`);
    } catch (err: any) {
      console.error('Failed to load active schema:', err);
      this.activeSchemaName.set('Unknown Schema');
    }
  }

  getSelectedSchema(): Schema | null {
    if (!this.selectedSchemaId) return null;
    return this.schemas().find(s => s.id === this.selectedSchemaId) || null;
  }

  isValid(): boolean {
    if (this.mode === 'create') {
      return !!(this.projectId && this.projectTitle && this.selectedSchemaId && this.ownerId);
    }
    return true; // Edit mode is always valid (nothing to change yet)
  }

  async createProject(): Promise<void> {
    if (!this.isValid()) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);

    try {
      const payload: ProjectPayload = {
        id: this.projectId,
        owner_id: this.ownerId,
        title: this.projectTitle,
        active_schema_id: this.selectedSchemaId || undefined,
      };

      const project = await this.api.createProject(payload).toPromise();

      this.snackBar.open(
        `Project "${this.projectTitle}" created successfully`, 
        'Close', 
        { duration: 3000 }
      );

      this.projectCreated.emit(project);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      this.snackBar.open(
        err.error?.detail || 'Failed to create project', 
        'Close', 
        { duration: 5000 }
      );
    } finally {
      this.saving.set(false);
    }
  }

  async updateProject(): Promise<void> {
    this.saving.set(true);

    try {
      // In the future, this could update other project metadata
      // For now, projects cannot be modified after creation
      const project = await this.api.getProject(this.projectId).toPromise();

      this.snackBar.open(
        'Project updated successfully', 
        'Close', 
        { duration: 3000 }
      );

      this.projectUpdated.emit(project);
    } catch (err: any) {
      console.error('Failed to update project:', err);
      this.snackBar.open(
        'Failed to update project', 
        'Close', 
        { duration: 3000 }
      );
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.editorClosed.emit();
  }
}
