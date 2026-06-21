import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
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

  readonly conversations = signal<ConversationDto[]>([]);
  readonly unreadCount = computed(() =>
    this.conversations().reduce((sum, conversation) => sum + conversation.unreadCount, 0)
  );

  startOrGetConversation(recipientId: number) {
    const body: StartConversationDto = { recipientId };
    return this.http
      .post<ApiResponse<ConversationDto>>(`${this.base}/conversations`, body)
      .pipe(
        map(r => r.data!),
        tap(conversation => this.upsertConversation(conversation))
      );
  }

  getConversations() {
    return this.http
      .get<ApiResponse<ConversationDto[]>>(`${this.base}/conversations`)
      .pipe(
        map(r => r.data ?? []),
        tap(conversations => this.conversations.set(conversations))
      );
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
    return this.http.put<void>(`${this.base}/conversations/${conversationId}/read`, {}).pipe(
      tap(() => {
        this.conversations.update(list =>
          list.map(conversation =>
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      })
    );
  }

  applyIncomingMessage(message: MessageDto): void {
    this.conversations.update(list => {
      const conversation = list.find(item => item.id === message.conversationId);
      if (!conversation) {
        return list;
      }

      return list.map(item =>
        item.id === message.conversationId
          ? {
              ...item,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: item.unreadCount + 1,
            }
          : item
      );
    });
  }

  private upsertConversation(conversation: ConversationDto): void {
    this.conversations.update(list => {
      const exists = list.some(item => item.id === conversation.id);
      return exists
        ? list.map(item => (item.id === conversation.id ? conversation : item))
        : [conversation, ...list];
    });
  }
}
