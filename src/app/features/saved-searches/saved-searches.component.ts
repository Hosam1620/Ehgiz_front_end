import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SavedSearch } from '../../core/models/saved-search.model';
import { SavedSearchService } from '../../core/services/saved-search.service';
import { ToolCondition, toolConditionLabel } from '../../core/models/tool.model';
import { BrowseFilterStore } from '../tools/browse-filter.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-saved-searches',
  imports: [DatePipe, RouterLink, LoadingSpinnerComponent],
  templateUrl: './saved-searches.component.html',
})
export class SavedSearchesComponent implements OnInit {
  private readonly savedSearchService = inject(SavedSearchService);
  private readonly filterStore = inject(BrowseFilterStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly searches = signal<SavedSearch[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deletingId = signal<number | null>(null);

  protected readonly conditionLabel = toolConditionLabel;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.savedSearchService.getAll().subscribe({
      next: searches => {
        this.searches.set(searches);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load saved searches.');
        this.isLoading.set(false);
      },
    });
  }

  /** Applies the saved filters to the browse store and opens the browse page. */
  protected runSearch(search: SavedSearch): void {
    this.filterStore.reset();
    this.filterStore.patch({
      searchTerm: search.searchTerm ?? '',
      categoryId: search.categoryId,
      location: search.location ?? '',
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      condition: (search.condition as ToolCondition | null) ?? null,
      page: 1,
    });
    void this.router.navigate(['/browse']);
  }

  protected deleteSearch(search: SavedSearch): void {
    this.deletingId.set(search.id);
    this.savedSearchService.delete(search.id).subscribe({
      next: () => {
        this.searches.update(list => list.filter(s => s.id !== search.id));
        this.deletingId.set(null);
        this.toast.show('Deleted', 'Saved search removed.', 'success');
      },
      error: err => {
        this.deletingId.set(null);
        this.toast.show('Error', err.error?.message ?? 'Could not delete saved search.', 'error');
      },
    });
  }

  protected criteriaChips(search: SavedSearch): string[] {
    const chips: string[] = [];
    if (search.searchTerm) chips.push(`"${search.searchTerm}"`);
    if (search.categoryName) chips.push(search.categoryName);
    if (search.location) chips.push(search.location);
    if (search.minPrice != null || search.maxPrice != null) {
      const min = search.minPrice != null ? String(search.minPrice) : '0';
      const max = search.maxPrice != null ? String(search.maxPrice) : 'any';
      chips.push(`${min}–${max} EGP/day`);
    }
    const condition = this.conditionLabel(search.condition);
    if (condition) chips.push(condition);
    return chips;
  }
}
