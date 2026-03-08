import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Schema, RoleDefinition } from '../models/schema.model';

/**
 * Component for displaying and managing the list of roles in a schema
 */
@Component({
  selector: 'omni-role-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="role-list-container">
      <div class="role-list-header">
        <h3>Roles</h3>
        <button mat-icon-button (click)="toggleAddRole()" matTooltip="Add new role">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      @if (showAddRole()) {
        <div class="add-role-form">
          <mat-form-field appearance="outline">
            <mat-label>Role Key</mat-label>
            <input matInput 
                   [(ngModel)]="newRoleKey" 
                   placeholder="e.g., chapter"
                   (keyup.enter)="addRole()">
          </mat-form-field>
          <div class="add-role-actions">
            <button mat-button (click)="cancelAddRole()">Cancel</button>
            <button mat-raised-button color="primary" (click)="addRole()">Add</button>
          </div>
        </div>
      }

      <mat-selection-list 
        [multiple]="false" 
        [(ngModel)]="selectedRolesArray"
        (ngModelChange)="onSelectionChange()">
        @for (roleKey of roleKeys(); track roleKey) {
          <mat-list-option [value]="roleKey" class="role-list-item">
            <div class="role-item-content">
              <mat-icon matListItemIcon>{{ roles()[roleKey].icon || 'label' }}</mat-icon>
              <div class="role-item-text">
                <div class="role-label">{{ roles()[roleKey].label }}</div>
                <div class="role-key">{{ roleKey }}</div>
              </div>
            </div>
            @if (selectedRole() === roleKey) {
              <button mat-icon-button 
                      matListItemMeta
                      (click)="deleteRole(roleKey, $event)"
                      matTooltip="Delete role">
                <mat-icon>delete</mat-icon>
              </button>
            }
          </mat-list-option>
        }
      </mat-selection-list>

      @if (roleKeys().length === 0) {
        <div class="empty-state">
          <mat-icon>label_off</mat-icon>
          <p>No roles defined</p>
          <button mat-raised-button color="primary" (click)="toggleAddRole()">
            <mat-icon>add</mat-icon>
            Add First Role
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .role-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .role-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
    }

    .role-list-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .add-role-form {
      padding: 16px;
      background: var(--surface-variant, rgba(0, 0, 0, 0.05));
      border-bottom: 1px solid var(--omni-border, rgba(0, 0, 0, 0.12));
    }

    .add-role-form mat-form-field {
      width: 100%;
    }

    .add-role-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }

    mat-selection-list {
      flex: 1;
      overflow-y: auto;
    }

    .role-list-item {
      min-height: 64px;
    }

    .role-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .role-item-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .role-label {
      font-weight: 500;
      font-size: 14px;
    }

    .role-key {
      font-size: 12px;
      color: var(--omni-text-muted, rgba(0, 0, 0, 0.6));
      font-family: monospace;
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
  `]
})
export class RoleListComponent {
  // Inputs
  schema = input.required<Schema>();
  selectedRole = input<string | null>(null);

  // Outputs
  roleSelected = output<string>();
  roleAdded = output<{ key: string }>();
  roleDeleted = output<string>();

  // Local state
  showAddRole = signal(false);
  newRoleKey = '';
  selectedRolesArray: string[] = [];

  // Computed
  roles = () => this.schema().roles;
  roleKeys = () => Object.keys(this.schema().roles);

  constructor() {
    // Sync selectedRolesArray with selectedRole input
    effect(() => {
      const role = this.selectedRole();
      if (role) {
        this.selectedRolesArray = [role];
      } else {
        this.selectedRolesArray = [];
      }
    });
  }

  toggleAddRole(): void {
    this.showAddRole.set(!this.showAddRole());
    if (this.showAddRole()) {
      this.newRoleKey = '';
    }
  }

  cancelAddRole(): void {
    this.showAddRole.set(false);
    this.newRoleKey = '';
  }

  addRole(): void {
    const key = this.newRoleKey.trim().toLowerCase();
    if (!key) return;

    if (this.schema().roles[key]) {
      alert(`Role "${key}" already exists`);
      return;
    }

    this.roleAdded.emit({ key });
    this.cancelAddRole();
  }

  deleteRole(roleKey: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Delete role "${this.roles()[roleKey].label}" (${roleKey})?\n\nThis will also remove all references to this role.`)) {
      this.roleDeleted.emit(roleKey);
    }
  }

  onSelectionChange(): void {
    if (this.selectedRolesArray.length > 0) {
      this.roleSelected.emit(this.selectedRolesArray[0]);
    }
  }
}
