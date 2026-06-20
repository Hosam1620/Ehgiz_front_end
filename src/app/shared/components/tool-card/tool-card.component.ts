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

  protected readonly statusLabel = computed(() => {
    const tool = this.tool();
    if (!tool.isAvailable) return 'Booked';
    return 'Available';
  });

  protected readonly statusClass = computed(() => {
    const tool = this.tool();
    if (!tool.isAvailable) return 'chip-red';
    return 'chip-green';
  });

  protected readonly placeholderEmoji = computed(() => {
    const name = (this.tool().categoryName ?? '').toLowerCase();
    if (name.includes('photo')) return '📷';
    if (name.includes('power')) return '🔩';
    if (name.includes('clean')) return '🧹';
    if (name.includes('garden')) return '🌿';
    return '🔧';
  });
}
