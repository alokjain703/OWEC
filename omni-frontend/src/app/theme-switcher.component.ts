import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService, AppTheme } from './core/services/theme.service';

@Component({
  selector: 'omni-theme-switcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDividerModule],
  template: `
    <!-- Trigger button -->
    <button
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      matTooltip="Switch theme"
      aria-label="Switch colour theme">
      <mat-icon>{{ themeSvc.activeTheme.icon }}</mat-icon>
    </button>

    <!-- Theme picker menu -->
    <mat-menu #themeMenu="matMenu" class="omni-theme-menu">
      <div class="theme-menu-header">Colour Theme</div>
      <mat-divider />

      @for (group of groups; track group.label) {
        <div class="theme-group-label">{{ group.label }}</div>
        @for (theme of group.themes; track theme.id) {
          <button
            mat-menu-item
            (click)="select(theme.id)"
            [class.theme-active]="themeSvc.activeThemeId() === theme.id">
            <mat-icon>{{ theme.icon }}</mat-icon>
            <span>{{ theme.label }}</span>
            @if (themeSvc.activeThemeId() === theme.id) {
              <mat-icon class="check-icon">check</mat-icon>
            }
          </button>
        }
        <mat-divider />
      }
    </mat-menu>
  `,
  styles: [`
    :host { display: contents; }
  `],
})
export class ThemeSwitcherComponent {
  readonly themeSvc = inject(ThemeService);

  readonly groups: { label: string; themes: AppTheme[] }[] = [
    {
      label: 'Dark',
      themes: this.themeSvc.themes.filter((t: AppTheme) => t.dark),
    },
    {
      label: 'Light',
      themes: this.themeSvc.themes.filter((t: AppTheme) => !t.dark),
    },
  ];

  select(id: string): void {
    this.themeSvc.setTheme(id);
  }
}
