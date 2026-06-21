import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ToolsService } from '../../../core/services/tools.service';
import { Tool } from '../../../core/models/tool.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-tool-detail',
  imports: [RouterModule, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './tool-detail.component.html',
})
export class ToolDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly toolsService = inject(ToolsService);

  protected readonly tool = signal<Tool | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedImageIndex = signal(0);
  protected readonly withInsurance = signal(false);
  protected readonly rentalDays = signal(3);

  protected readonly subtotal = computed(() => {
    const t = this.tool();
    return t ? t.pricePerDay * this.rentalDays() : 0;
  });

  protected readonly insuranceCost = computed(() => {
    const t = this.tool();
    return t && this.withInsurance() ? t.insurancePrice * this.rentalDays() : 0;
  });

  protected readonly serviceFee = computed(() => Math.round(this.subtotal() * 0.1));

  protected readonly total = computed(
    () => this.subtotal() + this.insuranceCost() + this.serviceFee()
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid tool id.');
      this.isLoading.set(false);
      return;
    }

    this.toolsService.getById(id).subscribe({
      next: tool => {
        this.tool.set(tool);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to load tool.');
        this.isLoading.set(false);
      },
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  incrementDays(): void {
    this.rentalDays.update(d => d + 1);
  }

  decrementDays(): void {
    this.rentalDays.update(d => Math.max(1, d - 1));
  }

  toggleInsurance(): void {
    this.withInsurance.update(v => !v);
  }

  protected ownerInitials(name: string | null): string {
    if (!name) return 'O';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'O';
  }

  protected currentImage(tool: Tool): string | null {
    const urls = tool.imageUrls ?? [];
    if (!urls.length) return null;
    return urls[this.selectedImageIndex()] ?? urls[0];
  }

  protected placeholderEmoji(tool: Tool): string {
    const name = (tool.categoryName ?? '').toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return '📷';
    if (name.includes('power') || name.includes('drill')) return '🔩';
    if (name.includes('garden') || name.includes('lawn')) return '🌿';
    if (name.includes('electri') || name.includes('generat')) return '⚡';
    if (name.includes('wood') || name.includes('saw')) return '🪚';
    if (name.includes('construct')) return '🏗️';
    if (name.includes('paint')) return '🎨';
    return '🔧';
  }

  protected cardBg(tool: Tool): string {
    const name = (tool.categoryName ?? '').toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return '#EFF6FF';
    if (name.includes('power') || name.includes('drill')) return '#E8F4EE';
    if (name.includes('garden') || name.includes('lawn')) return '#E1F5EE';
    if (name.includes('electri') || name.includes('generat')) return '#FEF6E4';
    if (name.includes('wood') || name.includes('saw')) return '#F1EFE8';
    if (name.includes('construct')) return '#F1EFE8';
    return '#EFEFEA';
  }

  protected memberSince(createdAt: string): string {
    return new Date(createdAt).getFullYear().toString();
  }
}
