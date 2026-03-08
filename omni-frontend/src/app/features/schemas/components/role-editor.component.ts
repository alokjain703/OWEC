import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Schema, RoleDefinition } from '../models/schema.model';

interface RoleUpdate {
  roleKey: string;
  updates: Partial<RoleDefinition>;
}

interface AllowedChildrenUpdate {
  parentRole: string;
  children: string[];
}

/**
 * Component for editing a single role's properties and allowed children
 */
@Component({
  selector: 'omni-role-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    @if (selectedRole()) {
      <div class="role-editor-container">
        <div class="role-editor-header">
          <h3>Configure Role</h3>
        </div>

        <div class="role-editor-content">
          <!-- Role Properties -->
          <section class="editor-section">
            <h4>Properties</h4>
            
            <mat-form-field appearance="outline">
              <mat-label>Role Key</mat-label>
              <input matInput [value]="selectedRole()" disabled>
              <mat-hint>Cannot be changed</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Display Label</mat-label>
              <input matInput 
                     [(ngModel)]="editLabel"
                     (ngModelChange)="onLabelChange()"
                     placeholder="e.g., Chapter">
              <mat-hint>Human-readable name for this role</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput 
                        [(ngModel)]="editDescription"
                        (ngModelChange)="onDescriptionChange()"
                        rows="3"
                        placeholder="Describe the purpose of this role"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Icon</mat-label>
              <input matInput 
                     [(ngModel)]="editIcon"
                     (ngModelChange)="onIconChange()"
                     placeholder="Material icon name">
              <mat-icon matPrefix>{{ editIcon || 'label' }}</mat-icon>
              <mat-hint>Material icon name (optional)</mat-hint>
            </mat-form-field>
          </section>

          <mat-divider></mat-divider>

          <!-- Allowed Children -->
          <section class="editor-section">
            <h4>Allowed Children</h4>
            <p class="section-description">
              Select which roles can be direct children of this role in the tree
            </p>

            @if (availableChildRoles().length > 0) {
              <div class="checkbox-list">
                @for (roleKey of availableChildRoles(); track roleKey) {
                  <mat-checkbox
                    [checked]="isChildAllowed(roleKey)"
                    (change)="toggleChildRole(roleKey)">
                    <div class="checkbox-content">
                      <mat-icon>{{ getRole(roleKey).icon || 'label' }}</mat-icon>
                      <span class="role-label">{{ getRole(roleKey).label }}</span>
                      <span class="role-key-badge">{{ roleKey }}</span>
                    </div>
                  </mat-checkbox>
                }
              </div>
            } @else {
              <div class="empty-hint">
                <mat-icon>info</mat-icon>
                <span>No other roles available as children</span>
              </div>
            }
          </section>
        </div>
      </div>
    } @else {
      <div class="no-selection">
        <mat-icon>arrow_back</mat-icon>
        <p>Select a role from the list to edit</p>
      </div>
    }
  `,
  styles: [`
    .role-editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .role-editor-header {
      padding: 16px;
      border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
    }

    .role-editor-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .role-editor-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .editor-section {
      margin-bottom: 24px;
    }

    .editor-section h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .section-description {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: var(--omni-text-muted, rgba(0, 0, 0, 0.6));
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 8px;
    }

    mat-divider {
      margin: 24px 0;
    }

    .checkbox-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-list mat-checkbox {
      margin: 0;
    }

    .checkbox-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .checkbox-content mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .role-key-badge {
      font-size: 11px;
      font-family: monospace;
      padding: 2px 6px;
      background: var(--surface-variant, rgba(0, 0, 0, 0.08));
      border-radius: 4px;
      color: var(--omni-text-muted, rgba(0, 0, 0, 0.6));
    }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--surface-variant, rgba(0, 0, 0, 0.05));
      border-radius: 8px;
      color: var(--omni-text-muted, rgba(0, 0, 0, 0.6));
    }

    .empty-hint mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
export class RoleEditorComponent {
  // Inputs
  schema = input.required<Schema>();
  selectedRole = input<string | null>(null);

  // Outputs
  roleUpdated = output<RoleUpdate>();
  allowedChildrenUpdated = output<AllowedChildrenUpdate>();

  // Local edit state
  editLabel = '';
  editDescription = '';
  editIcon = '';
  editAllowedChildren: string[] = [];

  // Computed
  roleDefinition = computed(() => {
    const role = this.selectedRole();
    return role ? this.schema().roles[role] : null;
  });

  availableChildRoles = computed(() => {
    const currentRole = this.selectedRole();
    return Object.keys(this.schema().roles).filter(key => key !== currentRole);
  });

  constructor() {
    // Sync local edit state when selection changes
    effect(() => {
      const role = this.selectedRole();
      if (role) {
        const def = this.schema().roles[role];
        this.editLabel = def.label || '';
        this.editDescription = def.description || '';
        this.editIcon = def.icon || '';
        this.editAllowedChildren = this.schema().allowed_children[role] || [];
      }
    });
  }

  getRole(roleKey: string): RoleDefinition {
    return this.schema().roles[roleKey];
  }

  isChildAllowed(roleKey: string): boolean {
    return this.editAllowedChildren.includes(roleKey);
  }

  toggleChildRole(roleKey: string): void {
    const index = this.editAllowedChildren.indexOf(roleKey);
    if (index >= 0) {
      this.editAllowedChildren = this.editAllowedChildren.filter(r => r !== roleKey);
    } else {
      this.editAllowedChildren = [...this.editAllowedChildren, roleKey];
    }
    this.emitAllowedChildrenUpdate();
  }

  onLabelChange(): void {
    const role = this.selectedRole();
    if (!role) return;
    
    this.roleUpdated.emit({
      roleKey: role,
      updates: { label: this.editLabel }
    });
  }

  onDescriptionChange(): void {
    const role = this.selectedRole();
    if (!role) return;
    
    this.roleUpdated.emit({
      roleKey: role,
      updates: { description: this.editDescription }
    });
  }

  onIconChange(): void {
    const role = this.selectedRole();
    if (!role) return;
    
    this.roleUpdated.emit({
      roleKey: role,
      updates: { icon: this.editIcon }
    });
  }

  private emitAllowedChildrenUpdate(): void {
    const role = this.selectedRole();
    if (!role) return;

    this.allowedChildrenUpdated.emit({
      parentRole: role,
      children: this.editAllowedChildren
    });
  }
}
