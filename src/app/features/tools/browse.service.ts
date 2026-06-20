import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ToolsService } from '../../core/services/tools.service';
import { CategoryOption, Tool, ToolFilterParams, ToolPagedResult } from '../../core/models/tool.model';
import { BrowseFilterStore } from './browse-filter.store';

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
      .pipe(map(result => this.extractCategories(result.items ?? [])));
  }

  private applyClientFilters(tools: Tool[]): Tool[] {
    const { conditions, insuredOnly } = this.filterStore.snapshot();

    let filtered = tools;

    if (conditions.length) {
      filtered = filtered.filter(tool =>
        tool.condition != null &&
        conditions.some(c => tool.condition!.toLowerCase().includes(c.toLowerCase()))
      );
    }

    if (insuredOnly) {
      filtered = filtered.filter(tool => tool.insurancePrice > 0);
    }

    return filtered;
  }
}
