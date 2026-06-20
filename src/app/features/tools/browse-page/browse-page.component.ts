import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tool } from '../../../core/models/tool.model';
import { BrowseService } from '../browse.service';
import { BrowseFilterStore } from '../browse-filter.store';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { ToolCardComponent } from '../../../shared/components/tool-card/tool-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-browse-page',
  imports: [
    RouterModule,
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

  ngOnInit(): void {
    this.loadTools();
  }

  onFiltersChanged(): void {
    this.loadTools();
  }

  onPageChange(page: number): void {
    this.filterStore.setPage(page);
    this.loadTools();
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
