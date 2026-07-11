import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CategoryOption } from '../models/tool.model';

interface CategoryDto {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  toolCount?: number;
}

/** Public categories lookup used by the add/edit tool forms and browse filters. */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  private categories$?: Observable<CategoryOption[]>;

  getCategories(): Observable<CategoryOption[]> {
    this.categories$ ??= this.http
      .get<ApiResponse<CategoryDto[]>>(`${environment.apiUrl}/api/categories`)
      .pipe(
        map(r => (r.data ?? []).map(c => ({ id: c.id, name: c.name, imageUrl: c.imageUrl }))),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    return this.categories$;
  }

  /** Drop the cached list so the next getCategories() refetches. Call after an
   *  admin creates, renames, or deletes a category, otherwise the add/edit-tool
   *  and browse dropdowns keep showing the stale list for the app's lifetime. */
  invalidate(): void {
    this.categories$ = undefined;
  }
}
