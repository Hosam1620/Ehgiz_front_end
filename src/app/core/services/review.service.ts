import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReviewRequest, Review, ToolRating } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/Reviews`;

  getByTool(toolId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/tool/${toolId}`);
  }

  getToolRating(toolId: number): Observable<ToolRating> {
    return this.http.get<ToolRating>(`${this.base}/tool/${toolId}/rating`);
  }

  getById(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.base}/${id}`);
  }

  create(data: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.base, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
