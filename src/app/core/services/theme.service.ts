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
