import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AppTheme {
  id: string;
  label: string;
  icon: string;        // material icon name
  dark: boolean;
}

export const THEMES: AppTheme[] = [
  { id: 'dark-purple',   label: 'Deep Purple (Dark)',  icon: 'nights_stay',    dark: true  },
  { id: 'dark-indigo',   label: 'Indigo (Dark)',       icon: 'dark_mode',      dark: true  },
  { id: 'light-indigo',  label: 'Indigo (Light)',      icon: 'light_mode',     dark: false },
  { id: 'light-teal',    label: 'Teal (Light)',        icon: 'wb_sunny',       dark: false },
  { id: 'light-pink',    label: 'Pink (Light)',        icon: 'palette',        dark: false },
];

const STORAGE_KEY = 'omni-theme';
const DEFAULT_THEME = 'dark-purple';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly themes = THEMES;

  /** Currently active theme id */
  readonly activeThemeId = signal<string>(this.loadSaved());

  get activeTheme(): AppTheme {
    return THEMES.find(t => t.id === this.activeThemeId()) ?? THEMES[0];
  }

  constructor() {
    // Whenever the theme changes, update the DOM and persist
    effect(() => {
      const id = this.activeThemeId();
      this.applyTheme(id);
      this.save(id);
    });
  }

  setTheme(id: string): void {
    this.activeThemeId.set(id);
  }

  private applyTheme(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const body = document.body;
    // Remove all theme classes
    THEMES.forEach(t => body.classList.remove(`theme-${t.id}`));
    body.classList.add(`theme-${id}`);

    // Drive the mat-app-background density class
    const isDark = THEMES.find(t => t.id === id)?.dark ?? true;
    body.classList.toggle('dark-theme', isDark);
    body.classList.toggle('light-theme', !isDark);
  }

  private save(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* SSR / private mode */ }
  }

  private loadSaved(): string {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_THEME;
    try { return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME; } catch { return DEFAULT_THEME; }
  }
}
