import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Schema, MetadataFieldDefinition, MetadataFieldType, MetadataDefinitions } from '../models/schema.model';

interface MetadataUpdate {
  roleKey: string;
  metadata: MetadataDefinitions;
}

/**
 * Component for editing metadata field definitions for a role
 */
@Component({
  selector: 'omni-metadata-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    @if (selectedRole()) {
      <div class="metadata-editor-container">
        <div class="metadata-editor-header">
          <h3>Metadata Fields</h3>
          <button mat-icon-button (click)="toggleAddField()" matTooltip="Add metadata field">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <div class="metadata-editor-content">
          @if (showAddField()) {
            <div class="add-field-form">
              <mat-form-field appearance="outline">
                <mat-label>Field Name</mat-label>
                <input matInput 
                       [(ngModel)]="newFieldName"
                       placeholder="e.g., genre"
                       (keyup.enter)="addField()">
              </mat-form-field>
              <div class="add-field-actions">
                <button mat-button (click)="cancelAddField()">Cancel</button>
                <button mat-raised-button color="primary" (click)="addField()">Add</button>
              </div>
            </div>
          }

          @if (metadataFieldKeys().length > 0) {
            <div class="fields-list">
              @for (fieldName of metadataFieldKeys(); track fieldName) {
                <div class="field-card" [class.expanded]="expandedField() === fieldName">
                  <div class="field-header" (click)="toggleFieldExpand(fieldName)">
                    <div class="field-header-info">
                      <mat-icon>{{ getFieldIcon(metadataFields()[fieldName].type) }}</mat-icon>
                      <span class="field-name">{{ fieldName }}</span>
                      <span class="field-type-badge">{{ metadataFields()[fieldName].type }}</span>
                      @if (metadataFields()[fieldName].required) {
                        <mat-icon class="required-icon" matTooltip="Required">star</mat-icon>
                      }
                    </div>
                    <button mat-icon-button 
                            (click)="deleteField(fieldName, $event)"
                            matTooltip="Delete field">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  @if (expandedField() === fieldName) {
                    <div class="field-details">
                      <mat-form-field appearance="outline">
                        <mat-label>Type</mat-label>
                        <mat-select [(ngModel)]="editFieldType"
                                    (ngModelChange)="onFieldTypeChange(fieldName)">
                          <mat-option value="string">String</mat-option>
                          <mat-option value="integer">Integer</mat-option>
                          <mat-option value="number">Number</mat-option>
                          <mat-option value="boolean">Boolean</mat-option>
                          <mat-option value="array">Array</mat-option>
                          <mat-option value="object">Object</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-checkbox [(ngModel)]="editFieldRequired"
                                    (ngModelChange)="onFieldRequiredChange(fieldName)">
                        Required field
                      </mat-checkbox>

                      <mat-form-field appearance="outline">
                        <mat-label>Description</mat-label>
                        <textarea matInput 
                                  [(ngModel)]="editFieldDescription"
                                  (ngModelChange)="onFieldDescriptionChange(fieldName)"
                                  rows="2"
                                  placeholder="Describe this field"></textarea>
                      </mat-form-field>

                      @if (editFieldType === 'string' || editFieldType === 'integer') {
                        <mat-form-field appearance="outline">
                          <mat-label>Enum Values (comma-separated)</mat-label>
                          <input matInput 
                                 [(ngModel)]="editFieldEnum"
                                 (ngModelChange)="onFieldEnumChange(fieldName)"
                                 placeholder="e.g., action, dialogue, internal">
                          <mat-hint>Optional: restrict to specific values</mat-hint>
                        </mat-form-field>
                      }

                      @if (editFieldType === 'array') {
                        <mat-form-field appearance="outline">
                          <mat-label>Array Item Type</mat-label>
                          <mat-select [(ngModel)]="editArrayItemType"
                                      (ngModelChange)="onArrayItemTypeChange(fieldName)">
                            <mat-option value="string">String</mat-option>
                            <mat-option value="integer">Integer</mat-option>
                            <mat-option value="number">Number</mat-option>
                            <mat-option value="boolean">Boolean</mat-option>
                          </mat-select>
                        </mat-form-field>
                      }

                      <mat-form-field appearance="outline">
                        <mat-label>Default Value</mat-label>
                        <input matInput 
                               [(ngModel)]="editFieldDefault"
                               (ngModelChange)="onFieldDefaultChange(fieldName)"
                               placeholder="Optional default value">
                      </mat-form-field>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>label_off</mat-icon>
              <p>No metadata fields defined for this role</p>
              <button mat-raised-button color="primary" (click)="toggleAddField()">
                <mat-icon>add</mat-icon>
                Add First Field
              </button>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="no-selection">
        <mat-icon>arrow_back</mat-icon>
        <p>Select a role to manage metadata fields</p>
      </div>
    }
  `,
  styles: [`
    .metadata-editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .metadata-editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
    }

    .metadata-editor-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .metadata-editor-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .add-field-form {
      padding: 16px;
      background: var(--surface-variant, rgba(0, 0, 0, 0.05));
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .add-field-form mat-form-field {
      width: 100%;
    }

    .add-field-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }

    .fields-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-card {
      border: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .field-card.expanded {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
    }

    .field-header:hover {
      background: var(--surface-variant, rgba(0, 0, 0, 0.03));
    }

    .field-header-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .field-name {
      font-weight: 500;
      font-family: monospace;
    }

    .field-type-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: var(--primary-100, rgba(124, 92, 191, 0.15));
      color: var(--primary-600, #1976d2);
      border-radius: 4px;
    }

    .required-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--warn, #f44336);
    }

    .field-details {
      padding: 16px;
      border-top: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
      background: var(--omni-bg, #fafafa);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field-details mat-form-field {
      width: 100%;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      color: var(--omni-text-muted, rgba(0, 0, 0, 0.6));
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0 0 16px 0;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 48px 16px;
      text-align: center;
      color: var(--omni-text-muted, rgba(0, 0, 0, 0.6));
    }

    .no-selection mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-selection p {
      margin: 0;
    }
  `]
})
export class MetadataEditorComponent {
  // Inputs
  schema = input.required<Schema>();
  selectedRole = input<string | null>(null);

  // Outputs
  metadataUpdated = output<MetadataUpdate>();

  // Local state
  showAddField = signal(false);
  newFieldName = '';
  expandedField = signal<string | null>(null);

  // Edit state for expanded field
  editFieldType: MetadataFieldType = 'string';
  editFieldRequired = false;
  editFieldDescription = '';
  editFieldEnum = '';
  editArrayItemType = 'string';
  editFieldDefault = '';

  // Computed
  metadataFields = computed(() => {
    const role = this.selectedRole();
    return role ? (this.schema().metadata_definitions[role] || {}) : {};
  });

  metadataFieldKeys = computed(() => Object.keys(this.metadataFields()));

  constructor() {
    // Sync edit state when expanded field changes
    effect(() => {
      const fieldName = this.expandedField();
      if (fieldName) {
        const field = this.metadataFields()[fieldName];
        if (field) {
          this.editFieldType = field.type;
          this.editFieldRequired = field.required || false;
          this.editFieldDescription = field.description || '';
          this.editFieldEnum = field.enum ? field.enum.join(', ') : '';
          this.editArrayItemType = field.items?.type || 'string';
          this.editFieldDefault = field.default?.toString() || '';
        }
      }
    });
  }

  toggleAddField(): void {
    this.showAddField.set(!this.showAddField());
    if (this.showAddField()) {
      this.newFieldName = '';
    }
  }

  cancelAddField(): void {
    this.showAddField.set(false);
    this.newFieldName = '';
  }

  addField(): void {
    const fieldName = this.newFieldName.trim();
    if (!fieldName) return;

    const role = this.selectedRole();
    if (!role) return;

    const currentMetadata = { ...this.metadataFields() };
    
    if (currentMetadata[fieldName]) {
      alert(`Field "${fieldName}" already exists`);
      return;
    }

    currentMetadata[fieldName] = {
      type: 'string',
      required: false
    };

    this.metadataUpdated.emit({
      roleKey: role,
      metadata: currentMetadata
    });

    this.cancelAddField();
    this.expandedField.set(fieldName);
  }

  deleteField(fieldName: string, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Delete field "${fieldName}"?`)) return;

    const role = this.selectedRole();
    if (!role) return;

    const currentMetadata = { ...this.metadataFields() };
    delete currentMetadata[fieldName];

    this.metadataUpdated.emit({
      roleKey: role,
      metadata: currentMetadata
    });

    if (this.expandedField() === fieldName) {
      this.expandedField.set(null);
    }
  }

  toggleFieldExpand(fieldName: string): void {
    this.expandedField.set(
      this.expandedField() === fieldName ? null : fieldName
    );
  }

  getFieldIcon(type: MetadataFieldType): string {
    const icons: Record<MetadataFieldType, string> = {
      string: 'text_fields',
      integer: 'numbers',
      number: 'numbers',
      boolean: 'toggle_on',
      array: 'list',
      object: 'data_object'
    };
    return icons[type] || 'label';
  }

  private updateField(fieldName: string, updates: Partial<MetadataFieldDefinition>): void {
    const role = this.selectedRole();
    if (!role) return;

    const currentMetadata = { ...this.metadataFields() };
    currentMetadata[fieldName] = {
      ...currentMetadata[fieldName],
      ...updates
    };

    this.metadataUpdated.emit({
      roleKey: role,
      metadata: currentMetadata
    });
  }

  onFieldTypeChange(fieldName: string): void {
    this.updateField(fieldName, { type: this.editFieldType });
  }

  onFieldRequiredChange(fieldName: string): void {
    this.updateField(fieldName, { required: this.editFieldRequired });
  }

  onFieldDescriptionChange(fieldName: string): void {
    this.updateField(fieldName, { description: this.editFieldDescription });
  }

  onFieldEnumChange(fieldName: string): void {
    const enumValues = this.editFieldEnum
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    this.updateField(fieldName, { 
      enum: enumValues.length > 0 ? enumValues : undefined 
    });
  }

  onArrayItemTypeChange(fieldName: string): void {
    this.updateField(fieldName, { 
      items: { type: this.editArrayItemType } 
    });
  }

  onFieldDefaultChange(fieldName: string): void {
    let defaultValue: any = this.editFieldDefault;
    
    // Parse default value based on type
    if (this.editFieldType === 'integer') {
      defaultValue = parseInt(this.editFieldDefault, 10);
    } else if (this.editFieldType === 'number') {
      defaultValue = parseFloat(this.editFieldDefault);
    } else if (this.editFieldType === 'boolean') {
      defaultValue = this.editFieldDefault.toLowerCase() === 'true';
    }

    this.updateField(fieldName, { 
      default: this.editFieldDefault ? defaultValue : undefined 
    });
  }
}
