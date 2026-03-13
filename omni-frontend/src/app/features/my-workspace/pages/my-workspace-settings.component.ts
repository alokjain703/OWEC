import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { WorkspaceNavComponent } from '../components/workspace-nav.component';
import { UserSettingsService } from '../services/user-settings.service';

@Component({
  selector: 'omni-my-workspace-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WorkspaceNavComponent,
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatSlideToggleModule, MatDividerModule,
  ],
  template: `
    <div class="workspace-page">
      <div class="workspace-header">
        <h1 class="page-title">My Workspace</h1>
      </div>

      <omni-workspace-nav />

      <div class="settings-content">
        @if (loading()) {
          <div class="spinner-wrap"><mat-spinner diameter="36" /></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="save()">
            
            <!-- Appearance -->
            <mat-card class="settings-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>palette</mat-icon>
                <mat-card-title>Appearance</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Theme</mat-label>
                  <mat-select formControlName="theme">
                    <mat-option value="dark">Dark</mat-option>
                    <mat-option value="light">Light</mat-option>
                    <mat-option value="system">System</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Workspace -->
            <mat-card class="settings-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>home_work</mat-icon>
                <mat-card-title>Workspace</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Default Schema</mat-label>
                  <mat-select formControlName="defaultSchema">
                    <mat-option value="">None</mat-option>
                    <mat-option value="character">Character</mat-option>
                    <mat-option value="location">Location</mat-option>
                    <mat-option value="item">Item</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-slide-toggle formControlName="sidebarCollapsed">
                  Collapse sidebar by default
                </mat-slide-toggle>
              </mat-card-content>
            </mat-card>

            <!-- Graph Settings -->
            <mat-card class="settings-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>hub</mat-icon>
                <mat-card-title>Graph Settings</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Graph Layout</mat-label>
                  <mat-select formControlName="graphLayout">
                    <mat-option value="force">Force-directed</mat-option>
                    <mat-option value="tree">Tree</mat-option>
                    <mat-option value="radial">Radial</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Editor Settings -->
            <mat-card class="settings-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>edit_note</mat-icon>
                <mat-card-title>Editor Settings</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Font Size</mat-label>
                  <mat-select formControlName="editorFontSize">
                    <mat-option [value]="12">12px</mat-option>
                    <mat-option [value]="14">14px (default)</mat-option>
                    <mat-option [value]="16">16px</mat-option>
                    <mat-option [value]="18">18px</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                @if (saving()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>save</mat-icon>
                }
                Save Settings
              </button>
              <button mat-button type="button" (click)="reset()">Reset</button>
            </div>

          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .workspace-page { display: flex; flex-direction: column; height: 100%; background: var(--omni-bg); }
    .workspace-header { padding: 24px 24px 0; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--omni-text); margin: 0 0 4px; }
    .settings-content { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; max-width: 700px; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .settings-card {}
    .full-width { width: 100%; }
    mat-card-content { display: flex; flex-direction: column; gap: 16px; padding-top: 8px !important; }
    mat-slide-toggle { margin-bottom: 4px; }
    .form-actions { display: flex; gap: 12px; align-items: center; padding-bottom: 40px; }
  `],
})
export class MyWorkspaceSettingsComponent implements OnInit {
  private settingsSvc = inject(UserSettingsService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);

  form: FormGroup = this.fb.group({
    theme: ['dark'],
    defaultSchema: [''],
    graphLayout: ['force'],
    editorFontSize: [14],
    sidebarCollapsed: [false],
  });

  ngOnInit(): void {
    this.settingsSvc.getSettings().subscribe({
      next: (res) => {
        if (res?.settings) {
          this.form.patchValue({
            theme: res.settings['theme'] ?? 'dark',
            defaultSchema: res.settings['defaultSchema'] ?? '',
            graphLayout: res.settings['graphLayout'] ?? 'force',
            editorFontSize: res.settings['editorFontSize'] ?? 14,
            sidebarCollapsed: res.settings['sidebarCollapsed'] ?? false,
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.settingsSvc.updateSettings(this.form.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Settings saved', undefined, { duration: 2500 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save settings', 'Dismiss', { duration: 4000 });
      },
    });
  }

  reset(): void {
    this.form.reset({
      theme: 'dark',
      defaultSchema: '',
      graphLayout: 'force',
      editorFontSize: 14,
      sidebarCollapsed: false,
    });
  }
}
