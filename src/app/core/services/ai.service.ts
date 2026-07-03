import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ToolAssistantResponse } from '../models/ai-assistant.model';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  askAssistant(question: string): Observable<ApiResponse<ToolAssistantResponse>> {
    return this.http.post<ApiResponse<ToolAssistantResponse>>(
      `${this.apiUrl}/api/ai/assistant`,
      { question }
    );
  }
}
