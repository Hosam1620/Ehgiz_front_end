import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CreateSavedSearchRequest, SavedSearch } from '../models/saved-search.model';

@Injectable({ providedIn: 'root' })
export class SavedSearchService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/saved-searches`;

  create(data: CreateSavedSearchRequest): Observable<SavedSearch> {
    return this.http.post<ApiResponse<SavedSearch>>(this.base, data).pipe(
      map(r => {
        if (!r.data) throw new Error('No saved search returned');
        return r.data;
      })
    );
  }

  getAll(): Observable<SavedSearch[]> {
    return this.http.get<ApiResponse<SavedSearch[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }
}
