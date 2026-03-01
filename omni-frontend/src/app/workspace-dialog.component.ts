import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WorkspaceService } from './core/services/workspace.service';
import { WorkspaceCreate } from './core/models/workspace.model';

interface DialogData {
  mode: 'create' | 'edit';
  workspaceId?: string;
}

@Component({
  selector: 'omni-workspace-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Create' : 'Edit' }} Workspace</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="My Workspace" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="personal">Personal</mat-option>
            <mat-option value="organization">Organization</mat-option>
            <mat-option value="enterprise">Enterprise</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Subscription Tier</mat-label>
          <mat-select formControlName="subscription_tier">
            <mat-option value="free">Free</mat-option>
            <mat-option value="pro">Pro</mat-option>
            <mat-option value="enterprise">Enterprise</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Storage Quota (MB)</mat-label>
          <input matInput type="number" formControlName="storage_quota_mb" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Limit</mat-label>
          <input matInput type="number" formControlName="project_limit" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="save()"
        [disabled]="form.invalid"
      >
        {{ data.mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-dialog-content {
      min-width: 400px;
      padding-top: 16px;
    }
  `],
})
export class WorkspaceDialogComponent {
  workspaceSvc = inject(WorkspaceService);
  dialogRef = inject(MatDialogRef<WorkspaceDialogComponent>);
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['personal'],
      subscription_tier: ['free'],
      storage_quota_mb: [1024],
      project_limit: [5],
    });
  }

  save(): void {
    if (this.form.invalid) return;

    let userId = localStorage.getItem('omni_user_id');
    if (!userId) {
      // Use default test user ID
      userId = '6c6286ff-1ff6-4f68-89be-e1e49c6be566';
      localStorage.setItem('omni_user_id', userId);
      console.log('🧪 Using default test user ID:', userId);
    }

    const payload: WorkspaceCreate = {
      ...this.form.value,
      owner_user_id: userId,
    };

    if (this.data.mode === 'create') {
      this.workspaceSvc.createWorkspace(payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => alert(`Error: ${err.message}`),
      });
    } else {
      // Edit mode implementation would go here
      this.dialogRef.close(true);
    }
  }
}
