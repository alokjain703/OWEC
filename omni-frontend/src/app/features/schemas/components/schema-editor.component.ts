import { Component, input, output, signal, computed, InputSignal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
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
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
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

      <!-- Tab View -->
      <mat-tab-group class="schema-editor-tabs" [(selectedIndex)]="selectedTabIndex">
        <!-- GUI Editor Tab -->
        <mat-tab label="GUI Editor">
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
        </mat-tab>

        <!-- JSON Editor Tab -->
        <mat-tab label="JSON Editor">
          <div class="json-editor-container">
            <div class="json-editor-toolbar">
              <span class="json-editor-label">Edit schema as JSON</span>
              <button mat-button (click)="formatJson()">
                <mat-icon>code</mat-icon>
                Format JSON
              </button>
              <button mat-button (click)="syncFromJson()" color="primary">
                <mat-icon>sync</mat-icon>
                Apply Changes
              </button>
            </div>
            <textarea 
              class="json-editor-textarea"
              [(ngModel)]="jsonString"
              spellcheck="false"
              placeholder="Enter schema JSON...">
            </textarea>
            @if (jsonError()) {
              <div class="json-error">
                <mat-icon>error</mat-icon>
                {{ jsonError() }}
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
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

    /* ── Tab Styles ── */
    .schema-editor-tabs {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .schema-editor-tabs ::ng-deep .mat-mdc-tab-body-wrapper {
      flex: 1;
      overflow: hidden;
    }

    .schema-editor-tabs ::ng-deep .mat-mdc-tab-body-content {
      height: 100%;
      overflow: hidden;
    }

    /* ── JSON Editor ── */
    .json-editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 16px;
      gap: 12px;
      background: var(--omni-bg, #fafafa);
    }

    .json-editor-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--omni-surface, white);
      border: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      border-radius: 4px;
    }

    .json-editor-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--omni-text, rgba(0, 0, 0, 0.87));
    }

    .json-editor-textarea {
      flex: 1;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      padding: 16px;
      border: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      border-radius: 4px;
      background: var(--omni-surface, white);
      color: var(--omni-text, rgba(0, 0, 0, 0.87));
      resize: none;
      overflow: auto;
      min-height: 0;
    }

    .json-editor-textarea:focus {
      outline: 2px solid var(--omni-accent, #7c5cbf);
      outline-offset: -2px;
    }

    .json-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid #f44336;
      border-radius: 4px;
      color: #f44336;
      font-size: 13px;
    }

    .json-error mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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

  // Tab switching
  selectedTabIndex = 0;

  // JSON editor state
  jsonString = '';
  jsonError = signal<string | null>(null);

  constructor(private snackBar: MatSnackBar) {
    // Initialize editable schema from input
    const inputSchema = this.schema();
    this._editableSchema.set(this.deepClone(inputSchema));
    this.syncToJson();

    // Select first role by default if available
    const roleKeys = Object.keys(inputSchema.roles || {});
    if (roleKeys.length > 0 && !this.selectedRole()) {
      this.selectedRole.set(roleKeys[0]);
    }

    // Watch for schema input changes and update editable schema
    effect(() => {
      const currentSchema = this.schema();
      this._editableSchema.set(this.deepClone(currentSchema));
      
      const roleKeys = Object.keys(currentSchema.roles || {});
      
      // If no role selected or current selection doesn't exist, select first role
      const currentSelection = this.selectedRole();
      if (roleKeys.length > 0 && (!currentSelection || !currentSchema.roles[currentSelection])) {
        this.selectedRole.set(roleKeys[0]);
      }
    });

    // Sync JSON when schema changes (from GUI edits)
    effect(() => {
      const schema = this._editableSchema();
      if (this.selectedTabIndex === 0) {
        // Only sync to JSON when in GUI tab to avoid circular updates
        this.syncToJson();
      }
    });
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
      // Select first available role instead of null
      const remainingRoles = Object.keys(updated.roles);
      this.selectedRole.set(remainingRoles.length > 0 ? remainingRoles[0] : null);
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

  // ──────────────────────────────────────────────────────────────
  // JSON Editor Methods
  // ──────────────────────────────────────────────────────────────

  private syncToJson(): void {
    const schema = this._editableSchema();
    this.jsonString = JSON.stringify(schema, null, 2);
    this.jsonError.set(null);
  }

  syncFromJson(): void {
    try {
      const parsed = JSON.parse(this.jsonString);
      
      // Basic validation that it looks like a schema
      if (!parsed.roles || typeof parsed.roles !== 'object') {
        throw new Error('Invalid schema: missing or invalid "roles" property');
      }
      if (!parsed.allowed_children || typeof parsed.allowed_children !== 'object') {
        throw new Error('Invalid schema: missing or invalid "allowed_children" property');
      }
      if (!parsed.metadata_definitions || typeof parsed.metadata_definitions !== 'object') {
        throw new Error('Invalid schema: missing or invalid "metadata_definitions" property');
      }

      this._editableSchema.set(parsed as Schema);
      this.emitChange();
      this.jsonError.set(null);
      this.snackBar.open('JSON changes applied', 'Close', { duration: 2000 });
    } catch (error: any) {
      const message = error?.message || 'Invalid JSON';
      this.jsonError.set(message);
      this.snackBar.open(`JSON Error: ${message}`, 'Close', { duration: 3000 });
    }
  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonString);
      this.jsonString = JSON.stringify(parsed, null, 2);
      this.jsonError.set(null);
      this.snackBar.open('JSON formatted', 'Close', { duration: 2000 });
    } catch (error: any) {
      const message = error?.message || 'Invalid JSON';
      this.jsonError.set(message);
      this.snackBar.open(`Cannot format: ${message}`, 'Close', { duration: 3000 });
    }
  }
}
