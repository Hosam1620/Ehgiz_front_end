import { Injectable, effect, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'ehgiz_theme';

/**
 * Light/dark theme handling. The chosen theme is stamped on <html data-theme="...">
 * which drives the CSS custom-property palettes in styles.css. The choice is
 * persisted in localStorage; the first visit follows prefers-color-scheme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.initialTheme());
  readonly isDark = () => this.theme() === 'dark';

  constructor() {
    effect(() => {
      const theme = this.theme();
      document.documentElement.setAttribute('data-theme', theme);
      // Bootstrap 5.3 components (cards, forms, dropdowns on the static content
      // pages) key off data-bs-theme, not our data-theme. Keep them in sync so
      // Bootstrap cards don't stay white-on-dark in dark mode.
      document.documentElement.setAttribute('data-bs-theme', theme);
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): AppTheme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // storage unavailable, fall back to the media query
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
