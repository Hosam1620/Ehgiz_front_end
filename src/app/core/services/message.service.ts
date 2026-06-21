import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ConversationDto,
  MessageDto,
  SendMessageDto,
  StartConversationDto,
} from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/messages`;

  startOrGetConversation(recipientId: number) {
    const body: StartConversationDto = { recipientId };
    return this.http
      .post<ApiResponse<ConversationDto>>(`${this.base}/conversations`, body)
      .pipe(map(r => r.data!));
  }

  getConversations() {
    return this.http
      .get<ApiResponse<ConversationDto[]>>(`${this.base}/conversations`)
      .pipe(map(r => r.data ?? []));
  }

  getMessages(conversationId: number, page = 1, pageSize = 30) {
    return this.http
      .get<ApiResponse<MessageDto[]>>(`${this.base}/conversations/${conversationId}`, {
        params: { page: String(page), pageSize: String(pageSize) },
      })
      .pipe(map(r => r.data ?? []));
  }

  sendMessage(conversationId: number, content: string) {
    const body: SendMessageDto = { content };
    return this.http
      .post<ApiResponse<MessageDto>>(`${this.base}/conversations/${conversationId}`, body)
      .pipe(map(r => r.data!));
  }

  /** PUT /conversations/{id}/read — 204 No Content, no wrapper */
  markAsRead(conversationId: number) {
    return this.http.put<void>(`${this.base}/conversations/${conversationId}/read`, {});
  }
}
