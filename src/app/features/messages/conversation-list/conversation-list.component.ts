import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../core/services/message.service';
import { ChatHubService } from '../../../core/services/chat-hub.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConversationDto } from '../../../core/models/message.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  imports: [RouterModule, TimeAgoPipe, LoadingSpinnerComponent],
})
export class ConversationListComponent implements OnInit, OnDestroy {
  private readonly messageService = inject(MessageService);
  private readonly chatHub = inject(ChatHubService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly conversations = signal<ConversationDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');

  private subs: Subscription[] = [];

  readonly filteredConversations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sorted = [...this.conversations()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (!q) return sorted;
    return sorted.filter(c => c.otherUserName.toLowerCase().includes(q));
  });

  readonly totalUnread = computed(() =>
    this.conversations().reduce((sum, c) => sum + c.unreadCount, 0)
  );

  ngOnInit(): void {
    this.loadConversations();

    // Incoming message: bump updatedAt, update lastMessage, increment unreadCount
    this.subs.push(
      this.chatHub.messageReceived$.subscribe(msg => {
        this.conversations.update(list => {
          const exists = list.some(c => c.id === msg.conversationId);
          if (!exists) {
            // New conversation appeared — reload
            this.loadConversations();
            return list;
          }
          const isOwnMessage = msg.senderId === this.auth.currentUser()?.id;
          return list.map(c =>
            c.id === msg.conversationId
              ? {
                  ...c,
                  lastMessage: msg,
                  updatedAt: msg.createdAt,
                  unreadCount: isOwnMessage ? c.unreadCount : c.unreadCount + 1,
                }
              : c
          );
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.messageService.getConversations().subscribe({
      next: data => {
        this.conversations.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load conversations.');
        this.isLoading.set(false);
      },
    });
  }

  open(id: number): void {
    this.router.navigate(['/messages', id]);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  initialsOf(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('');
  }
}
