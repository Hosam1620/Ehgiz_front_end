import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateToolRequest,
  Tool,
  ToolFilterParams,
  ToolPagedResult,
  UpdateToolRequest,
  UploadToolImagesResponse,
} from '../models/tool.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ToolsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Tools`;

  getAll(params: ToolFilterParams = {}): Observable<ToolPagedResult> {
    return this.http.get<ToolPagedResult>(this.base, { params: this.buildParams(params) });
  }

  getById(id: number): Observable<Tool> {
    return this.http.get<Tool>(`${this.base}/${id}`);
  }

  getMyTools(): Observable<Tool[]> {
    return this.http.get<Tool[]>(`${this.base}/my`);
  }

  create(data: CreateToolRequest): Observable<Tool> {
    return this.http.post<Tool>(this.base, data);
  }

  update(id: number, data: UpdateToolRequest): Observable<Tool> {
    return this.http.put<Tool>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadImages(id: number, files: File[]): Observable<UploadToolImagesResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<UploadToolImagesResponse>(`${this.base}/${id}/images`, formData);
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/images/${imageId}`);
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
    if (params.page != null) {
      httpParams = httpParams.set('Page', params.page);
    }
    if (params.pageSize != null) {
      httpParams = httpParams.set('PageSize', params.pageSize);
    }

    return httpParams;
  }
}
