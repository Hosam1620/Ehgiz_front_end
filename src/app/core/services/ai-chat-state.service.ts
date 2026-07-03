import { Injectable, signal, inject, effect } from '@angular/core';
import { ChatMessage } from '../models/ai-assistant.model';
import { AiService } from './ai.service';

const STORAGE_KEY = 'ehgiz_ai_chat_history';

@Injectable({ providedIn: 'root' })
export class AiChatStateService {
  private readonly aiService = inject(AiService);

  readonly messages = signal<ChatMessage[]>(this.loadFromStorage());
  readonly isOpen = signal<boolean>(false);
  readonly isWaiting = signal<boolean>(false);

  constructor() {
    // Save to session storage automatically whenever messages change
    effect(() => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages()));
    });
  }

  private loadFromStorage(): ChatMessage[] {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  sendMessage(content: string): void {
    if (!content.trim() || content.trim().length < 5) return;
    
    // Add user message
    this.messages.update(msgs => [
      ...msgs,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      }
    ]);

    // Add temporary loading assistant message
    const tempAssistantId = crypto.randomUUID();
    this.messages.update(msgs => [
      ...msgs,
      {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        loading: true,
        timestamp: new Date()
      }
    ]);

    this.isWaiting.set(true);

    this.aiService.askAssistant(content.trim()).subscribe({
      next: (res) => {
        this.isWaiting.set(false);
        this.messages.update(msgs => 
          msgs.map(m => m.id === tempAssistantId ? {
            ...m,
            loading: false,
            content: res.data?.answer ?? 'No answer provided.',
            recommendedTools: res.data?.recommendedTools ?? [],
            timestamp: new Date()
          } : m)
        );
      },
      error: (err) => {
        this.isWaiting.set(false);
        let errorMsg = 'An unexpected error occurred.';
        if (err.status === 503) {
          errorMsg = 'Assistant unavailable, try later.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        this.messages.update(msgs => 
          msgs.map(m => m.id === tempAssistantId ? {
            ...m,
            loading: false,
            error: errorMsg,
            timestamp: new Date()
          } : m)
        );
      }
    });
  }
}
