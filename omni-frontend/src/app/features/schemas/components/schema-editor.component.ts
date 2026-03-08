import { Component, input, output, signal, computed, InputSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Schema, DEFAULT_SCHEMA, SchemaValidator, RoleDefinition } from '../models/schema.model';
import { RoleListComponent } from './role-list.component';
import { RoleEditorComponent } from './role-editor.component';
import { MetadataEditorComponent } from './metadata-editor.component';

/**
 * Main Schema Editor Component
 * 
 * A reusable component for creating and editing schema templates.
 * Can be embedded in modals, drawers, or full pages.
 * 
 * Usage:
 * <omni-schema-editor
 *   [schema]="schema"
 *   (schemaChange)="onSchemaChange($event)">
 * </omni-schema-editor>
 */
@Component({
  selector: 'omni-schema-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RoleListComponent,
    RoleEditorComponent,
    MetadataEditorComponent
  ],
  template: `
    <div class="schema-editor">
      <!-- Header with actions -->
      <div class="schema-editor-header">
        <div class="header-info">
          <h2>Schema Editor</h2>
          @if (validationResult(); as validation) {
            @if (validation.valid) {
              <span class="validation-badge valid">
                <mat-icon>check_circle</mat-icon>
                Valid
              </span>
            } @else {
              <span class="validation-badge invalid">
                <mat-icon>error</mat-icon>
                {{ validation.errors.length }} error(s)
              </span>
            }
          }
        </div>
        <div class="header-actions">
          <button mat-button (click)="validateSchema()">
            <mat-icon>check</mat-icon>
            Validate
          </button>
          <button mat-button (click)="resetToDefault()">
            <mat-icon>restart_alt</mat-icon>
            Reset
          </button>
          <button mat-raised-button color="primary" (click)="exportSchema()">
            <mat-icon>download</mat-icon>
            Export JSON
          </button>
        </div>
      </div>

      <!-- Three-panel layout -->
      <div class="schema-editor-panels">
        <!-- Left: Role List -->
        <div class="panel panel-left">
          <omni-role-list
            [schema]="editableSchema()"
            [selectedRole]="selectedRole()"
            (roleSelected)="onRoleSelected($event)"
            (roleAdded)="onRoleAdded($event)"
            (roleDeleted)="onRoleDeleted($event)">
          </omni-role-list>
        </div>

        <!-- Center: Role Editor -->
        <div class="panel panel-center">
          <omni-role-editor
            [schema]="editableSchema()"
            [selectedRole]="selectedRole()"
            (roleUpdated)="onRoleUpdated($event)"
            (allowedChildrenUpdated)="onAllowedChildrenUpdated($event)">
          </omni-role-editor>
        </div>

        <!-- Right: Metadata Editor -->
        <div class="panel panel-right">
          <omni-metadata-editor
            [schema]="editableSchema()"
            [selectedRole]="selectedRole()"
            (metadataUpdated)="onMetadataUpdated($event)">
          </omni-metadata-editor>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .schema-editor {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: var(--omni-bg, #fafafa);
    }

    .schema-editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--omni-surface, white);
      border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      z-index: 10;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-info h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .validation-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
    }

    .validation-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .validation-badge.valid {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .validation-badge.invalid {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .schema-editor-panels {
      display: grid;
      grid-template-columns: 300px 1fr 400px;
      gap: 0;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }

    .panel {
      background: var(--omni-surface, white);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .panel-left {
      border-right: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
    }

    .panel-center {
      border-right: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
    }

    /* Responsive layout */
    @media (max-width: 1200px) {
      .schema-editor-panels {
        grid-template-columns: 280px 1fr 350px;
      }
    }

    @media (max-width: 900px) {
      .schema-editor-panels {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
      }

      .panel {
        border-right: none !important;
        border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      }

      .panel:last-child {
        border-bottom: none;
      }
    }
  `]
})
export class SchemaEditorComponent {
  // Input schema (can be provided or will use default)
  schema: InputSignal<Schema> = input<Schema>(DEFAULT_SCHEMA);

  // Output events
  schemaChange = output<Schema>();

  // Internal editable schema state
  private _editableSchema = signal<Schema>(DEFAULT_SCHEMA);
  editableSchema = this._editableSchema.asReadonly();

  // Selected role for editing
  selectedRole = signal<string | null>(null);

  // Validation state
  validationResult = signal<{ valid: boolean; errors: string[] } | null>(null);

  constructor(private snackBar: MatSnackBar) {
    // Initialize editable schema from input
    const inputSchema = this.schema();
    this._editableSchema.set(this.deepClone(inputSchema));
  }

  // ──────────────────────────────────────────────────────────────
  // Role Management
  // ──────────────────────────────────────────────────────────────

  onRoleSelected(roleKey: string): void {
    this.selectedRole.set(roleKey);
  }

  onRoleAdded(event: { key: string }): void {
    const current = this._editableSchema();
    const updated = this.deepClone(current);

    // Add new role with default values
    updated.roles[event.key] = {
      label: this.toTitleCase(event.key),
      description: ''
    };

    // Initialize empty allowed children
    updated.allowed_children[event.key] = [];

    // Initialize empty metadata
    updated.metadata_definitions[event.key] = {};

    this.updateSchema(updated);
    this.selectedRole.set(event.key);
    
    this.snackBar.open(`Role "${event.key}" added`, 'Close', { duration: 3000 });
  }

  onRoleDeleted(roleKey: string): void {
    const current = this._editableSchema();
    const updated = this.deepClone(current);

    // Remove role
    delete updated.roles[roleKey];

    // Remove from allowed_children (as parent and child)
    delete updated.allowed_children[roleKey];
    for (const parentRole of Object.keys(updated.allowed_children)) {
      updated.allowed_children[parentRole] = updated.allowed_children[parentRole].filter(
        r => r !== roleKey
      );
    }

    // Remove metadata definitions
    delete updated.metadata_definitions[roleKey];

    this.updateSchema(updated);
    
    if (this.selectedRole() === roleKey) {
      this.selectedRole.set(null);
    }

    this.snackBar.open(`Role "${roleKey}" deleted`, 'Close', { duration: 3000 });
  }

  onRoleUpdated(event: { roleKey: string; updates: Partial<RoleDefinition> }): void {
    const current = this._editableSchema();
    const updated = this.deepClone(current);

    updated.roles[event.roleKey] = {
      ...updated.roles[event.roleKey],
      ...event.updates
    };

    this.updateSchema(updated);
  }

  onAllowedChildrenUpdated(event: { parentRole: string; children: string[] }): void {
    const current = this._editableSchema();
    const updated = this.deepClone(current);

    updated.allowed_children[event.parentRole] = event.children;

    this.updateSchema(updated);
  }

  // ──────────────────────────────────────────────────────────────
  // Metadata Management
  // ──────────────────────────────────────────────────────────────

  onMetadataUpdated(event: { roleKey: string; metadata: any }): void {
    const current = this._editableSchema();
    const updated = this.deepClone(current);

    updated.metadata_definitions[event.roleKey] = event.metadata;

    this.updateSchema(updated);
  }

  // ──────────────────────────────────────────────────────────────
  // Schema Actions
  // ──────────────────────────────────────────────────────────────

  validateSchema(): void {
    const schema = this._editableSchema();
    const validation = SchemaValidator.validate(schema);
    const cycles = SchemaValidator.detectCycles(schema);

    if (cycles.hasCycles) {
      validation.valid = false;
      validation.errors.push(...cycles.cycles.map(c => `Circular dependency: ${c}`));
    }

    this.validationResult.set(validation);

    if (validation.valid) {
      this.snackBar.open('Schema is valid!', 'Close', { duration: 3000 });
    } else {
      const errors = validation.errors.join('\n');
      this.snackBar.open(`Validation failed:\n${errors}`, 'Close', { duration: 5000 });
    }
  }

  resetToDefault(): void {
    if (confirm('Reset to default schema? This will discard all changes.')) {
      this._editableSchema.set(this.deepClone(DEFAULT_SCHEMA));
      this.selectedRole.set(null);
      this.validationResult.set(null);
      this.emitChange();
      this.snackBar.open('Schema reset to default', 'Close', { duration: 3000 });
    }
  }

  exportSchema(): void {
    const schema = this._editableSchema();
    const json = JSON.stringify(schema, null, 2);
    
    // Create blob and download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.snackBar.open('Schema exported', 'Close', { duration: 3000 });
  }

  // ──────────────────────────────────────────────────────────────
  // Utility Methods
  // ──────────────────────────────────────────────────────────────

  private updateSchema(updated: Schema): void {
    this._editableSchema.set(updated);
    this.emitChange();
  }

  private emitChange(): void {
    this.schemaChange.emit(this._editableSchema());
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private toTitleCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
