import { Component, computed, effect, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Tool } from '../../../core/models/tool.model';

@Component({
  selector: 'app-tool-card',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './tool-card.component.html',
})
export class ToolCardComponent {
  tool = input.required<Tool>();
  showAiMatch = input<boolean>(false);

  private readonly failedImages = signal<Set<string>>(new Set());

  protected readonly primaryImage = computed(() => {
    const failed = this.failedImages();
    return this.tool().imageUrls?.find(url => !failed.has(url)) ?? null;
  });

  protected readonly statusLabel = computed(() =>
    this.tool().isAvailable ? 'Available' : 'Booked'
  );

  protected readonly statusClass = computed(() =>
    this.tool().isAvailable ? 'chip-green' : 'chip-red'
  );

  protected readonly conditionLabel = computed(() => {
    const c = this.tool().condition;
    if (!c) return null;
    const map: Record<string, string> = { '1': 'New', '2': 'Good', '3': 'Fair', '4': 'Poor' };
    return map[c] ?? c;
  });

  protected readonly placeholderTitle = computed(() => this.tool().categoryName ?? 'Tool photo');
  protected readonly placeholderSubtitle = computed(() => this.tool().name ?? 'Image coming soon');

  protected readonly placeholderIcon = computed(() => {
    const name = `${this.tool().categoryName ?? ''} ${this.tool().name ?? ''}`.toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return 'fas fa-camera';
    if (name.includes('clean') || name.includes('washer')) return 'fas fa-broom';
    if (name.includes('garden') || name.includes('lawn')) return 'fas fa-seedling';
    if (name.includes('construct') || name.includes('ladder')) return 'fas fa-helmet-safety';
    if (name.includes('electri') || name.includes('generat')) return 'fas fa-bolt';
    if (name.includes('wood') || name.includes('saw')) return 'fas fa-ruler-combined';
    if (name.includes('paint')) return 'fas fa-paint-roller';
    return 'fas fa-toolbox';
  });

  protected readonly cardBg = computed(() => {
    const name = (this.tool().categoryName ?? '').toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return '#EFF6FF';
    if (name.includes('power') || name.includes('drill')) return '#E8F4EE';
    if (name.includes('garden') || name.includes('lawn')) return '#E1F5EE';
    if (name.includes('electri') || name.includes('generat')) return '#FEF6E4';
    if (name.includes('wood') || name.includes('saw')) return '#F1EFE8';
    if (name.includes('construct') || name.includes('build')) return '#F1EFE8';
    return '#EFEFEA';
  });

  constructor() {
    effect(() => {
      this.tool().id;
      this.failedImages.set(new Set());
    });
  }

  protected onImageError(url: string): void {
    this.failedImages.update(failed => {
      const next = new Set(failed);
      next.add(url);
      return next;
    });
  }
}
