import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CreateReviewRequest, Review, ToolRating } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/reviews`;

  getByTool(toolId: number): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${this.base}/tool/${toolId}`)
      .pipe(map(r => r.data ?? []));
  }

  getToolRating(toolId: number): Observable<ToolRating> {
    return this.http.get<ApiResponse<ToolRating>>(`${this.base}/tool/${toolId}/rating`)
      .pipe(map(r => {
        if (!r.data) throw new Error('No rating data returned');
        return r.data;
      }));
  }

  getById(id: number): Observable<Review> {
    return this.http.get<ApiResponse<Review>>(`${this.base}/${id}`)
      .pipe(map(r => {
        if (!r.data) throw new Error('No review data returned');
        return r.data;
      }));
  }

  create(data: CreateReviewRequest): Observable<Review> {
    return this.http.post<ApiResponse<Review>>(this.base, data)
      .pipe(map(r => {
        if (!r.data) throw new Error('No review data returned');
        return r.data;
      }));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
