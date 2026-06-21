import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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

  /** POST /conversations — start or retrieve an existing conversation */
  startOrGetConversation(recipientId: number) {
    const body: StartConversationDto = { recipientId };
    return this.http.post<ConversationDto>(`${this.base}/conversations`, body);
  }

  /** GET /conversations — full inbox sorted by backend */
  getConversations() {
    return this.http.get<ConversationDto[]>(`${this.base}/conversations`);
  }

  /** GET /conversations/{id}?page&pageSize — messages newest-first from backend */
  getMessages(conversationId: number, page = 1, pageSize = 30) {
    return this.http.get<MessageDto[]>(`${this.base}/conversations/${conversationId}`, {
      params: { page: String(page), pageSize: String(pageSize) },
    });
  }

  /** POST /conversations/{id} — send a message, returns confirmed MessageDto */
  sendMessage(conversationId: number, content: string) {
    const body: SendMessageDto = { content };
    return this.http.post<MessageDto>(`${this.base}/conversations/${conversationId}`, body);
  }

  /** PUT /conversations/{id}/read — mark all messages in this conversation as read */
  markAsRead(conversationId: number) {
    return this.http.put<void>(`${this.base}/conversations/${conversationId}/read`, {});
  }
}
