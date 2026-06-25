import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryOption, Tool } from '../../../core/models/tool.model';
import { BrowseService } from '../browse.service';
import { BrowseFilterStore } from '../browse-filter.store';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { ToolCardComponent } from '../../../shared/components/tool-card/tool-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type SortBy = 'default' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-browse-page',
  imports: [
    RouterLink,
    FilterPanelComponent,
    ToolCardComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './browse-page.component.html',
})
export class BrowsePageComponent implements OnInit {
  private readonly browseService = inject(BrowseService);
  private readonly filterStore = inject(BrowseFilterStore);

  protected readonly tools = signal<Tool[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(12);
  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly selectedCategoryId = signal<number | null>(null);
  protected readonly sortBy = signal<SortBy>('default');

  protected readonly sortedTools = computed(() => {
    const list = [...this.tools()];
    switch (this.sortBy()) {
      case 'price-asc':
        return list.sort((a, b) => a.pricePerDay - b.pricePerDay);
      case 'price-desc':
        return list.sort((a, b) => b.pricePerDay - a.pricePerDay);
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadTools();
  }

  onFiltersChanged(): void {
    this.selectedCategoryId.set(this.filterStore.categoryId());
    this.loadTools();
  }

  onPageChange(page: number): void {
    this.filterStore.setPage(page);
    this.loadTools();
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
    this.filterStore.patch({ categoryId: id, page: 1 });
    this.loadTools();
  }

  onSortChange(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as SortBy);
  }

  private loadCategories(): void {
    this.browseService.loadCategoryOptions().subscribe({
      next: cats => this.categories.set(cats),
    });
  }

  private loadTools(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.browseService.browse().subscribe({
      next: result => {
        this.tools.set(result.items ?? []);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.currentPage.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to load tools.');
        this.isLoading.set(false);
      },
    });
  }
}
