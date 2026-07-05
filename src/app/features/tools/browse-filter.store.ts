import { Injectable, computed, signal } from '@angular/core';
import { ToolCondition, ToolFilterParams } from '../../core/models/tool.model';

export interface BrowseFilterState {
  searchTerm: string;
  categoryId: number | null;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  isAvailable: boolean | null;
  /** Backend enum name, or null for "All conditions" (param omitted). */
  condition: ToolCondition | null;
  insuredOnly: boolean;
  page: number;
  pageSize: number;
}

const DEFAULT_STATE: BrowseFilterState = {
  searchTerm: '',
  categoryId: null,
  location: '',
  minPrice: null,
  maxPrice: null,
  isAvailable: null,
  condition: null,
  insuredOnly: false,
  page: 1,
  pageSize: 12,
};

@Injectable({ providedIn: 'root' })
export class BrowseFilterStore {
  private readonly state = signal<BrowseFilterState>({ ...DEFAULT_STATE });

  readonly searchTerm = computed(() => this.state().searchTerm);
  readonly categoryId = computed(() => this.state().categoryId);
  readonly location = computed(() => this.state().location);
  readonly minPrice = computed(() => this.state().minPrice);
  readonly maxPrice = computed(() => this.state().maxPrice);
  readonly isAvailable = computed(() => this.state().isAvailable);
  readonly condition = computed(() => this.state().condition);
  readonly insuredOnly = computed(() => this.state().insuredOnly);
  readonly page = computed(() => this.state().page);
  readonly pageSize = computed(() => this.state().pageSize);
  readonly snapshot = computed(() => this.state());

  readonly apiParams = computed<ToolFilterParams>(() => {
    const s = this.state();
    return {
      searchTerm: s.searchTerm || undefined,
      categoryId: s.categoryId ?? undefined,
      location: s.location || undefined,
      minPrice: s.minPrice ?? undefined,
      maxPrice: s.maxPrice ?? undefined,
      isAvailable: s.isAvailable ?? undefined,
      condition: s.condition ?? undefined,
      page: s.page,
      pageSize: s.pageSize,
    };
  });

  patch(partial: Partial<BrowseFilterState>): void {
    this.state.update(current => ({ ...current, ...partial }));
  }

  setPage(page: number): void {
    this.patch({ page });
  }

  reset(): void {
    this.state.set({ ...DEFAULT_STATE });
  }
}
