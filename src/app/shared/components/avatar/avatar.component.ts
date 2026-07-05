import { Component, computed, input, signal } from '@angular/core';
import { resolveMediaUrl } from '../../../core/utils/media-url';

/**
 * Circular user avatar with an initials fallback when no image URL is provided
 * (or when the image fails to load).
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <span class="app-avatar" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="fontSize()" [title]="name()">
      @if (imageUrl(); as url) {
        <img [src]="url" [alt]="name()" (error)="onError()" />
      } @else {
        {{ initials() }}
      }
    </span>
  `,
})
export class AvatarComponent {
  /** Raw image URL from the API (relative paths are resolved against apiUrl). */
  src = input<string | null | undefined>(null);
  name = input<string | null | undefined>('');
  size = input<number>(36);

  private readonly failed = signal(false);

  protected readonly imageUrl = computed(() => {
    if (this.failed()) return null;
    return resolveMediaUrl(this.src() ?? null);
  });

  protected readonly fontSize = computed(() => Math.max(10, Math.round(this.size() * 0.38)));

  protected readonly initials = computed(() => {
    const name = (this.name() ?? '').trim();
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('') || '?';
  });

  protected onError(): void {
    this.failed.set(true);
  }
}
