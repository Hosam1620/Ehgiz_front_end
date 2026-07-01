import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClassifyRequestDto {
  title: string;
  description: string;
}

export interface ClassifyResponseDto {
  category: string;
  confidence: number;
}

export interface ApiResponse<T> {
  succeeded: boolean;
  message: string;
  data: T;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class ClassificationService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/classification/classify`;

  classify(title: string, description: string): Observable<ApiResponse<ClassifyResponseDto>> {
    const payload: ClassifyRequestDto = { title, description };
    return this.http.post<ApiResponse<ClassifyResponseDto>>(this.endpoint, payload);
  }
}
