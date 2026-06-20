import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ToolsService } from '../../../core/services/tools.service';
import { Tool } from '../../../core/models/tool.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
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
    if (name.includes('photo')) return '📷';
    if (name.includes('power')) return '🔩';
    return '🔧';
  }
}
