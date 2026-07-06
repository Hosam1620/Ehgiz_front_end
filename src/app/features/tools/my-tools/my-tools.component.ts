import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ToolsService } from '../../../core/services/tools.service';
import { Tool, toolConditionLabel } from '../../../core/models/tool.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type ToolTab = 'all' | 'available' | 'booked' | 'inactive';

@Component({
  selector: 'app-my-tools',
  imports: [RouterLink, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './my-tools.component.html',
})
export class MyToolsComponent implements OnInit {
  private readonly toolsService = inject(ToolsService);

  protected readonly tools = signal<Tool[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeTab = signal<ToolTab>('all');
  protected readonly toolToDelete = signal<Tool | null>(null);

  protected readonly filteredTools = computed(() => {
    const tab = this.activeTab();
    const items = this.tools();
    switch (tab) {
      case 'available':
        return items.filter(t => t.isAvailable);
      case 'booked':
        return items.filter(t => !t.isAvailable);
      case 'inactive':
        return [];
      default:
        return items;
    }
  });

  protected readonly tabCounts = computed(() => {
    const items = this.tools();
    return {
      all: items.length,
      available: items.filter(t => t.isAvailable).length,
      booked: items.filter(t => !t.isAvailable).length,
      inactive: 0,
    };
  });

  /** Owner-facing summary: how many listings and the combined daily earning
   *  potential if every available tool were rented. */
  protected readonly summary = computed(() => {
    const items = this.tools();
    const available = items.filter(t => t.isAvailable);
    return {
      total: items.length,
      available: available.length,
      booked: items.filter(t => !t.isAvailable).length,
      potentialPerDay: available.reduce((sum, t) => sum + (t.pricePerDay ?? 0), 0),
    };
  });

  protected conditionLabel(tool: Tool): string | null {
    return toolConditionLabel(tool.condition);
  }

  ngOnInit(): void {
    this.loadTools();
  }

  setTab(tab: ToolTab): void {
    this.activeTab.set(tab);
  }

  confirmDelete(tool: Tool): void {
    this.toolToDelete.set(tool);
    this.toolsService.delete(tool.id).subscribe({
      next: () => {
        this.tools.update(items => items.filter(t => t.id !== tool.id));
        this.toolToDelete.set(null);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to delete tool.');
        this.toolToDelete.set(null);
      },
    });
  }

  protected statusLabel(tool: Tool): string {
    return tool.isAvailable ? 'Available' : 'Booked';
  }

  protected statusClass(tool: Tool): string {
    return tool.isAvailable ? 'chip-green' : 'chip-orange';
  }

  protected toolThumbnail(tool: Tool): string | null {
    return tool.imageUrls?.[0] ?? null;
  }

  private loadTools(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.toolsService.getMyTools().subscribe({
      next: tools => {
        this.tools.set(tools);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to load your tools.');
        this.isLoading.set(false);
      },
    });
  }
}
