import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ironplan-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<Theme>('dark');

  init(): void {
    if (!this.isBrowser) {
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const theme: Theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    this.applyTheme(theme, false);
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme, true);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: Theme, persist: boolean): void {
    this.theme.set(theme);

    if (!this.isBrowser) {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;

    if (persist) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }
}
