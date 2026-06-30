import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PhotoSearchResult } from '../../../core/models/tool.model';
import { ToolsService } from '../../../core/services/tools.service';
import { ToolCardComponent } from '../../../shared/components/tool-card/tool-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-image-search',
  imports: [RouterLink, ToolCardComponent, PaginationComponent, LoadingSpinnerComponent],
  templateUrl: './image-search.component.html',
})
export class ImageSearchComponent {
  private readonly toolsService = inject(ToolsService);

  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly previewUrls = signal<string[]>([]);
  protected readonly fileError = signal<string | null>(null);
  protected readonly isSearching = signal(false);
  protected readonly searchError = signal<string | null>(null);
  protected readonly result = signal<PhotoSearchResult | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly matchingTools = computed(() => this.result()?.matchingTools.items ?? []);
  protected readonly totalCount = computed(() => this.result()?.matchingTools.totalCount ?? 0);
  protected readonly totalPages = computed(() => this.result()?.matchingTools.totalPages ?? 0);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = Array.from(input.files ?? []);
    this.fileError.set(null);
    this.searchError.set(null);
    this.result.set(null);

    const invalid = raw.filter(f => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024);
    if (invalid.length) {
      this.fileError.set('Some files were skipped: only images up to 5 MB are allowed.');
    }

    const files = raw.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (!files.length) {
      input.value = '';
      return;
    }

    this.selectedFiles.set(files);
    this.previewUrls.set([]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrls.update(urls => [...urls, String(reader.result)]);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
    this.result.set(null);
    this.searchError.set(null);
  }

  onSearch(): void {
    const files = this.selectedFiles();
    if (!files.length || this.isSearching()) {
      return;
    }

    this.currentPage.set(1);
    this.runSearch(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.runSearch(page);
  }

  private runSearch(page: number): void {
    const files = this.selectedFiles();
    if (!files.length) {
      return;
    }

    this.isSearching.set(true);
    this.searchError.set(null);

    this.toolsService.searchByPhoto(files, page, this.pageSize()).subscribe({
      next: response => {
        this.result.set(response);
        this.isSearching.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isSearching.set(false);
        const message = typeof err.error?.message === 'string'
          ? err.error.message
          : err.error?.title ?? 'Photo search failed. Please try again.';
        this.searchError.set(message);
      },
    });
  }
}
