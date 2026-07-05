import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { ToolsService } from '../../core/services/tools.service';
import { CategoriesService } from '../../core/services/categories.service';
import { CategoryOption, Tool, ToolFilterParams, ToolPagedResult } from '../../core/models/tool.model';
import { BrowseFilterStore } from './browse-filter.store';

const SEEDED_CATEGORIES: CategoryOption[] = [
  { id: 1, name: 'Power Tools' },
  { id: 2, name: 'Gardening' },
  { id: 3, name: 'Construction' },
  { id: 4, name: 'Cleaning Equipment' },
];

@Injectable({ providedIn: 'root' })
export class BrowseService {
  private readonly toolsService = inject(ToolsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly filterStore = inject(BrowseFilterStore);

  browse(params?: ToolFilterParams): Observable<ToolPagedResult> {
    const apiParams = params ?? this.filterStore.apiParams();
    return this.toolsService.getAll(apiParams).pipe(
      map(result => ({
        ...result,
        items: this.applyClientFilters(result.items ?? []),
      }))
    );
  }

  extractCategories(tools: Tool[]): CategoryOption[] {
    const mapById = new Map<number, string>();
    tools.forEach(tool => {
      if (tool.categoryId && tool.categoryName) {
        mapById.set(tool.categoryId, tool.categoryName);
      }
    });
    return Array.from(mapById.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Loads the real category list; falls back to deriving from listed tools if the endpoint fails. */
  loadCategoryOptions(): Observable<CategoryOption[]> {
    return this.categoriesService.getCategories().pipe(
      switchMap(categories => (categories.length ? of(categories) : this.deriveCategoriesFromTools())),
      catchError(() => this.deriveCategoriesFromTools())
    );
  }

  private deriveCategoriesFromTools(): Observable<CategoryOption[]> {
    return this.toolsService.getAll({ page: 1, pageSize: 100 }).pipe(
      map(result => {
        const categories = this.extractCategories(result.items ?? []);
        return categories.length ? categories : SEEDED_CATEGORIES;
      }),
      catchError(() => of(SEEDED_CATEGORIES))
    );
  }

  private applyClientFilters(tools: Tool[]): Tool[] {
    const { insuredOnly } = this.filterStore.snapshot();
    return insuredOnly ? tools.filter(tool => tool.insurancePrice > 0) : tools;
  }
}
