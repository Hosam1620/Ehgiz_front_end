import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ToolsService } from '../../core/services/tools.service';
import { CategoryOption, Tool, ToolFilterParams, ToolPagedResult } from '../../core/models/tool.model';
import { BrowseFilterStore } from './browse-filter.store';

const CONDITION_LABEL_MAP: Record<string, string> = { '1': 'New', '2': 'Good', '3': 'Fair', '4': 'Poor' };

const SEEDED_CATEGORIES: CategoryOption[] = [
  { id: 1, name: 'Power Tools' },
  { id: 2, name: 'Gardening' },
  { id: 3, name: 'Construction' },
  { id: 4, name: 'Cleaning Equipment' },
];

@Injectable({ providedIn: 'root' })
export class BrowseService {
  private readonly toolsService = inject(ToolsService);
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

  loadCategoryOptions(): Observable<CategoryOption[]> {
    return this.toolsService
      .getAll({ page: 1, pageSize: 100 })
      .pipe(
        map(result => {
          const categories = this.extractCategories(result.items ?? []);
          return categories.length ? categories : SEEDED_CATEGORIES;
        })
      );
  }

  private applyClientFilters(tools: Tool[]): Tool[] {
    const { conditions, insuredOnly } = this.filterStore.snapshot();

    let filtered = tools;

    if (conditions.length) {
      filtered = filtered.filter(tool => {
        const label = tool.condition ? (CONDITION_LABEL_MAP[tool.condition] ?? tool.condition) : '';
        return conditions.some(c => label.toLowerCase().includes(c.toLowerCase()));
      });
    }

    if (insuredOnly) {
      filtered = filtered.filter(tool => tool.insurancePrice > 0);
    }

    return filtered;
  }
}
