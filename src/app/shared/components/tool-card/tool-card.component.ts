import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Tool } from '../../../core/models/tool.model';

@Component({
  selector: 'app-tool-card',
  imports: [RouterModule, DecimalPipe],
  templateUrl: './tool-card.component.html',
})
export class ToolCardComponent {
  tool = input.required<Tool>();
  showAiMatch = input<boolean>(false);

  protected readonly primaryImage = computed(() => this.tool().imageUrls?.[0] ?? null);

  protected readonly statusLabel = computed(() =>
    this.tool().isAvailable ? 'Available' : 'Booked'
  );

  protected readonly statusClass = computed(() =>
    this.tool().isAvailable ? 'chip-green' : 'chip-red'
  );

  protected readonly placeholderEmoji = computed(() => {
    const name = (this.tool().categoryName ?? '').toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return '📷';
    if (name.includes('power') || name.includes('drill')) return '🔩';
    if (name.includes('clean')) return '🧹';
    if (name.includes('garden') || name.includes('lawn')) return '🌿';
    if (name.includes('construct') || name.includes('build')) return '🏗️';
    if (name.includes('electri') || name.includes('generat')) return '⚡';
    if (name.includes('wood') || name.includes('saw')) return '🪚';
    if (name.includes('paint')) return '🎨';
    if (name.includes('plumb')) return '🔧';
    return '🔧';
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
}
