import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateToolRequest,
  Tool,
  ToolFilterParams,
  ToolPagedResult,
  ToolSuggestionResponse,
  PhotoSearchResult,
  UpdateToolRequest,
  UploadToolImagesResponse,
} from '../models/tool.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

/** All tool endpoints return the shared ApiResponse envelope; this service
 *  unwraps it so components keep working with the plain models. */
@Injectable({ providedIn: 'root' })
export class ToolsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Tools`;

  getAll(params: ToolFilterParams = {}): Observable<ToolPagedResult> {
    return this.http
      .get<ApiResponse<ToolPagedResult>>(this.base, { params: this.buildParams(params) })
      .pipe(map(r => this.unwrap(r, 'No tools returned')));
  }

  getById(id: number): Observable<Tool> {
    return this.http
      .get<ApiResponse<Tool>>(`${this.base}/${id}`)
      .pipe(map(r => this.unwrap(r, 'Tool not found')));
  }

  getMyTools(): Observable<Tool[]> {
    return this.http
      .get<ApiResponse<Tool[]>>(`${this.base}/my`)
      .pipe(map(r => r.data ?? []));
  }

  create(data: CreateToolRequest): Observable<Tool> {
    return this.http
      .post<ApiResponse<Tool>>(this.base, data)
      .pipe(map(r => this.unwrap(r, 'Tool creation returned no data')));
  }

  update(id: number, data: UpdateToolRequest): Observable<Tool> {
    return this.http
      .put<ApiResponse<Tool>>(`${this.base}/${id}`, data)
      .pipe(map(r => this.unwrap(r, 'Tool update returned no data')));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadImages(id: number, files: File[]): Observable<UploadToolImagesResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http
      .post<ApiResponse<UploadToolImagesResponse>>(`${this.base}/${id}/images`, formData)
      .pipe(map(r => this.unwrap(r, 'Image upload returned no data')));
  }

  suggestFromImages(files: File[]): Observable<ToolSuggestionResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http
      .post<ApiResponse<ToolSuggestionResponse>>(`${this.base}/suggest-from-images`, formData)
      .pipe(map(r => this.unwrap(r, 'Suggestion returned no data')));
  }

  searchByPhoto(files: File[], page = 1, pageSize = 10): Observable<PhotoSearchResult> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http
      .post<ApiResponse<PhotoSearchResult>>(`${this.base}/search-by-photo`, formData, { params })
      .pipe(map(r => this.unwrap(r, 'Photo search returned no data')));
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/images/${imageId}`);
  }

  setPrimaryImage(imageId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/images/${imageId}/primary`, {});
  }

  private unwrap<T>(res: ApiResponse<T>, emptyMessage: string): T {
    if (!res.data) {
      throw new Error(res.message || emptyMessage);
    }
    return res.data;
  }

  private buildParams(params: ToolFilterParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.categoryId != null) {
      httpParams = httpParams.set('CategoryId', params.categoryId);
    }
    if (params.location) {
      httpParams = httpParams.set('Location', params.location);
    }
    if (params.minPrice != null) {
      httpParams = httpParams.set('MinPrice', params.minPrice);
    }
    if (params.maxPrice != null) {
      httpParams = httpParams.set('MaxPrice', params.maxPrice);
    }
    if (params.isAvailable != null) {
      httpParams = httpParams.set('IsAvailable', params.isAvailable);
    }
    if (params.searchTerm) {
      httpParams = httpParams.set('SearchTerm', params.searchTerm);
    }
    if (params.condition) {
      httpParams = httpParams.set('Condition', params.condition);
    }
    if (params.nearLat != null && params.nearLng != null) {
      httpParams = httpParams.set('NearLat', params.nearLat).set('NearLng', params.nearLng);
      if (params.radiusKm != null) {
        httpParams = httpParams.set('RadiusKm', params.radiusKm);
      }
    }
    if (params.page != null) {
      httpParams = httpParams.set('Page', params.page);
    }
    if (params.pageSize != null) {
      httpParams = httpParams.set('PageSize', params.pageSize);
    }

    return httpParams;
  }
}
